import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { looksLikeBotName } from "@/lib/botDetection";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/cleanup-bots
 *
 * Vercel Cron diario. Borra cuentas de registro spam: nombre aleatorio
 * (ver lib/botDetection) + cero actividad (sin listings, orders, teléfono ni
 * ciudad). Limpia primero page_views y cart_items (FK sin cascade) y luego la
 * fila en public.users y el usuario de auth.
 *
 * Protegido por CRON_SECRET. Acepta ?dry=1 para simular sin borrar.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Candidatos: registros de los últimos 14 días (margen de sobra si el cron
  // falla algún día). Bots viejos ya fueron purgados a mano.
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, full_name, phone, city, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[cron/cleanup-bots] fetch error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deleted: string[] = [];
  const skipped: string[] = [];

  for (const u of users ?? []) {
    if (!looksLikeBotName(u.full_name)) continue;
    if (u.phone || u.city) { skipped.push(`${u.email} (tiene perfil)`); continue; }

    const { count: listingsN } = await supabase
      .from("listings").select("id", { count: "exact", head: true }).eq("seller_id", u.id);
    const { count: ordersN } = await supabase
      .from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", u.id);
    if ((listingsN ?? 0) > 0 || (ordersN ?? 0) > 0) {
      skipped.push(`${u.email} (listings=${listingsN} orders=${ordersN})`);
      continue;
    }

    if (dry) { deleted.push(`[dry] ${u.email} — "${u.full_name}"`); continue; }

    // Limpiar dependencias (FK sin cascade) y borrar.
    await supabase.from("page_views").delete().eq("user_id", u.id);
    await supabase.from("cart_items").delete().eq("user_id", u.id);
    const { error: uErr } = await supabase.from("users").delete().eq("id", u.id);
    const { error: aErr } = await supabase.auth.admin.deleteUser(u.id);
    if (uErr || aErr) {
      skipped.push(`${u.email} (error: ${uErr?.message ?? ""} ${aErr?.message ?? ""})`);
    } else {
      deleted.push(`${u.email} — "${u.full_name}"`);
    }
  }

  console.log(`[cron/cleanup-bots] ${dry ? "DRY " : ""}borrados=${deleted.length} saltados=${skipped.length}`);
  return NextResponse.json({ dry, deletedCount: deleted.length, deleted, skipped });
}
