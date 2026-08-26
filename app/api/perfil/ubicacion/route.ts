import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { comunaDesdeAddress, resolverCityId } from "@/lib/cities";

export const runtime = "nodejs";

/**
 * POST /api/perfil/ubicacion
 *
 * Guarda la ubicación del vendedor y —esto es lo que faltaba— la **comuna**.
 *
 * Hasta el 26-08-2026 el formulario de perfil escribía `latitude`, `longitude` y
 * `address` en los listings, pero nunca `city_id`. El filtro de comuna de
 * /search filtra por `city_id`, así que un vendedor que se corregía de Santiago
 * a Viña del Mar seguía apareciendo en Santiago: la dirección decía una cosa y
 * el filtro otra. Carlos Clark lo reportó por el formulario de contacto el 6 de
 * agosto y hubo que arreglarlo a mano en la base de datos.
 *
 * `resolverCityId` puede tener que crear la comuna en `cities`, y eso pide
 * service role — por eso esto es un endpoint y no una llamada desde el cliente.
 *
 * Body: { lat, lng, address, aplicarAPublicaciones?: boolean }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { lat?: number; lng?: number; address?: string; aplicarAPublicaciones?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { lat, lng, address, aplicarAPublicaciones } = body;
  if (typeof lat !== "number" || typeof lng !== "number" || !address?.trim()) {
    return NextResponse.json({ error: "Faltan lat, lng o address" }, { status: 400 });
  }

  const service = createServiceRoleClient();

  // La comuna se resuelve una sola vez y sirve para los dos lados: el nombre
  // legible va a `users.city` (lo muestra el perfil público) y el id va a los
  // listings (lo usa el filtro).
  const comuna = comunaDesdeAddress(address);
  let cityId: string | null = null;
  try {
    cityId = await resolverCityId(service, address, { lat, lng });
  } catch {
    // Nunca debería lanzar, pero perder la comuna no puede costar el guardado.
    cityId = null;
  }

  const { error: userError } = await service
    .from("users")
    .update({
      default_latitude: lat,
      default_longitude: lng,
      default_address: address,
      ...(comuna ? { city: comuna } : {}),
    })
    .eq("id", user.id);

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  let actualizados: number | null = null;
  if (aplicarAPublicaciones) {
    // `listings.location` es columna generada desde latitude/longitude: no se
    // escribe, se recalcula sola.
    const { data, error: listingError } = await service
      .from("listings")
      .update({
        latitude: lat,
        longitude: lng,
        address,
        ...(cityId ? { city_id: cityId } : {}),
      })
      .eq("seller_id", user.id)
      .in("status", ["active", "paused"])
      .select("id");

    if (listingError) {
      return NextResponse.json({ error: listingError.message }, { status: 500 });
    }
    actualizados = data?.length ?? 0;
  }

  return NextResponse.json({ comuna, cityId, actualizados });
}
