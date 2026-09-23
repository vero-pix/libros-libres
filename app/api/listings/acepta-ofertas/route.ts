import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { vendedorPuedeRecibirOfertas } from "@/lib/offers";

/**
 * POST /api/listings/acepta-ofertas  { acepta: boolean }
 * Enciende o apaga "Se aceptan ofertas" en TODAS las publicaciones activas del
 * vendedor con sesión. Ver components/offers/OfertasEnTodos.tsx.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { acepta } = await req.json().catch(() => ({}));
  if (typeof acepta !== "boolean") {
    return NextResponse.json({ error: "Falta indicar si aceptas ofertas" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (acepta) {
    const { data: perfil } = await admin
      .from("users")
      .select("mercadopago_user_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!vendedorPuedeRecibirOfertas(!!perfil?.mercadopago_user_id)) {
      return NextResponse.json(
        { error: "Las ofertas quedaron solo para quienes cobran con MercadoPago. Conéctalo y vuelve a intentar." },
        { status: 403 }
      );
    }
  }

  const { error, count } = await admin
    .from("listings")
    .update({ acepta_ofertas: acepta }, { count: "exact" })
    .eq("seller_id", user.id)
    .eq("status", "active");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, actualizadas: count ?? 0 });
}
