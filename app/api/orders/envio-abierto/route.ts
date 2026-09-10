import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { buscarEnvioAbierto } from "@/lib/envio-pendiente";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/envio-abierto?seller_id=...&address=...
 *
 * ¿Este comprador ya tiene un paquete armándose donde este vendedor? El
 * checkout lo pregunta para no mostrar un flete que no se va a cobrar: la
 * decisión real la toma /api/orders en el servidor, esto es solo la vitrina.
 *
 * Ver lib/envio-pendiente.ts (caso Don Luis, 09-09-2026).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión no hay nada que mirar: el checkout exige cuenta igual.
  if (!user) return NextResponse.json({ envio: null });

  const sellerId = request.nextUrl.searchParams.get("seller_id");
  const address = request.nextUrl.searchParams.get("address");
  if (!sellerId) return NextResponse.json({ envio: null });

  const envio = await buscarEnvioAbierto(
    createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    ),
    { buyerId: user.id, sellerId, direccion: address }
  );

  // Solo lo que el checkout necesita mostrar. El bundle_id no sale de acá:
  // el cliente no tiene por qué poder nombrarlo.
  return NextResponse.json({
    envio: envio
      ? { titulos: envio.titulos, fletePagado: envio.fletePagado, creadoEn: envio.creadoEn, cupo: envio.cupo }
      : null,
  });
}
