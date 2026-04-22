import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * DELETE /api/admin/users/[id]
 * Borra un usuario de verdad (auth + public.users + dependencias críticas).
 * Solo el admin puede llamarlo. Protegido por verificación de rol.
 *
 * Antes de borrar, limpia:
 * - page_views (sin cascade automático en la FK)
 * Si el usuario tiene listings, orders u otra data "dura", aborta y avisa.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Autenticar al caller y verificar que es admin
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { data: profile } = await ssr.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Cliente con service role para operaciones privilegiadas
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Verificar dependencias duras (listings activos, orders — no borrar silenciosamente)
  const [listingsRes, ordersBuyerRes, ordersSellerRes] = await Promise.all([
    admin.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", id),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", id),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", id),
  ]);
  const blockers = {
    listings: listingsRes.count ?? 0,
    ordersAsBuyer: ordersBuyerRes.count ?? 0,
    ordersAsSeller: ordersSellerRes.count ?? 0,
  };
  if (blockers.listings > 0 || blockers.ordersAsBuyer > 0 || blockers.ordersAsSeller > 0) {
    return NextResponse.json({
      error: "Usuario tiene data asociada. Elimina listings/órdenes primero.",
      blockers,
    }, { status: 409 });
  }

  // Limpiar page_views (FK RESTRICT)
  await admin.from("page_views").delete().eq("user_id", id);

  // Borrar de auth (esto cascadea mejor en Supabase)
  const { error: authErr } = await admin.auth.admin.deleteUser(id);
  // Borrar de public.users (por si el trigger de auth no lo limpia)
  const { error: pubErr } = await admin.from("users").delete().eq("id", id);

  if (authErr && pubErr) {
    return NextResponse.json({ error: authErr.message || pubErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
