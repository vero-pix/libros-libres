import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * ¿Este libro está reservado por OTRA persona en este momento? (24-09-2026)
 *
 * La ficha se cachea 60 s, así que la reserva no puede venir en el HTML: se
 * pregunta acá, sin caché. Responde solo sí o no — ni quién reservó ni hasta
 * cuándo: `listing_reservations` no se lee desde el navegador a propósito
 * (lib/reservas.ts). A quien tiene la reserva se le responde `false`: está
 * comprando, no tiene que ver el aviso.
 */
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: reserva } = await createServiceRoleClient()
    .from("listing_reservations")
    .select("buyer_id")
    .eq("listing_id", params.id)
    .gt("reserved_until", new Date().toISOString())
    .maybeSingle();

  let reservado = !!reserva;
  if (reserva) {
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (user?.id === reserva.buyer_id) reservado = false;
  }

  return NextResponse.json({ reservado }, { headers: { "Cache-Control": "no-store" } });
}
