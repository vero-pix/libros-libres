import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { veTodoElCatalogo } from "@/lib/contadorVentas";

/**
 * El KPI de un libro: cuánta gente lo miró, hace cuántos días está publicado, y
 * a qué ritmo va comparado con el resto de esa misma tienda.
 *
 * Lo ve el dueño del libro. Vero, además, sobre cualquier libro del catálogo.
 *
 * Es una llamada aparte y no datos de la ficha a propósito: así el visitante
 * normal no paga tres consultas que no va a ver (pedido de Vero, 18-09-2026).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, created_at")
    .eq("id", params.id)
    .single();

  if (!listing) return NextResponse.json({ error: "No existe" }, { status: 404 });
  // Cada vendedor ve lo suyo; Vero ve el catálogo completo (18-09-2026).
  const esDueno = listing.seller_id === user.id;
  if (!esDueno && !veTodoElCatalogo(user.id)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const dias = Math.max(
    1,
    Math.floor((Date.now() - new Date(listing.created_at as string).getTime()) / 86400000)
  );

  const [{ count: visitas }, { count: enCarrito }] = await Promise.all([
    supabase.from("page_views").select("id", { count: "exact", head: true }).eq("listing_id", params.id),
    supabase.from("cart_items").select("id", { count: "exact", head: true }).eq("listing_id", params.id),
  ]);

  // La referencia no es un número inventado: es el ritmo mediano de sus otros
  // libros activos. Sin eso, "0,3 visitas al día" no dice si es bueno o malo.
  const { data: hermanos } = await supabase
    .from("listings")
    .select("id, created_at")
    .eq("seller_id", listing.seller_id)
    .eq("status", "active")
    .limit(500);

  let mediana = 0;
  if (hermanos && hermanos.length > 1) {
    const ids = hermanos.map((h) => h.id as string);
    const { data: vistas } = await supabase
      .from("page_views")
      .select("listing_id")
      .in("listing_id", ids)
      .limit(20000);

    const porLibro = new Map<string, number>();
    for (const v of vistas ?? []) {
      const k = v.listing_id as string;
      porLibro.set(k, (porLibro.get(k) ?? 0) + 1);
    }
    const ritmos = hermanos.map((h) => {
      const d = Math.max(
        1,
        Math.floor((Date.now() - new Date(h.created_at as string).getTime()) / 86400000)
      );
      return (porLibro.get(h.id as string) ?? 0) / d;
    });
    ritmos.sort((a, b) => a - b);
    mediana = ritmos[Math.floor(ritmos.length / 2)] ?? 0;
  }

  return NextResponse.json({
    dias,
    visitas: visitas ?? 0,
    enCarrito: enCarrito ?? 0,
    ritmo: (visitas ?? 0) / dias,
    ritmoMediano: mediana,
  });
}
