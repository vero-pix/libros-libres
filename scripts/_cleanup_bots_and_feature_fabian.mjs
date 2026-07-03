import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes("--dry");

// ─────────── 1. Borrar bots ───────────
const bots = JSON.parse(fs.readFileSync("/tmp/bot_ids.json", "utf-8"));
console.log(`═══ BORRADO DE ${bots.length} BOTS ${DRY ? "(DRY RUN)" : ""} ═══\n`);

for (const b of bots) {
  // listings por seguridad (no deberían tener, pero verificamos)
  const { count: ln } = await s.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", b.id);
  const { count: on } = await s.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", b.id);
  if (ln > 0 || on > 0) {
    console.log(`  ⚠️  SALTADO ${b.email} — tiene listings=${ln} orders=${on} (NO es bot puro)`);
    continue;
  }
  // contar dependencias (page_views + cart_items referencian users.id sin cascade)
  const { count: pv } = await s.from("page_views").select("id", { count: "exact", head: true }).eq("user_id", b.id);
  const { count: ci } = await s.from("cart_items").select("id", { count: "exact", head: true }).eq("user_id", b.id);
  if (DRY) {
    console.log(`  [dry] borraría ${b.email} (${b.id.slice(0,8)}) — page_views=${pv} cart_items=${ci}`);
    continue;
  }
  // 1. limpiar dependencias (son ruido de bot, se eliminan)
  const { error: pvErr } = await s.from("page_views").delete().eq("user_id", b.id);
  const { error: ciErr } = await s.from("cart_items").delete().eq("user_id", b.id);
  // 2. borrar fila public.users
  const { error: uErr } = await s.from("users").delete().eq("id", b.id);
  // 3. borrar de auth
  const { error: aErr } = await s.auth.admin.deleteUser(b.id);
  const ok = !uErr && !aErr;
  console.log(`  ${ok ? "🗑️ " : "⚠️ "} ${b.email}  pv:${pvErr?pvErr.message:`-${pv}`} cart:${ciErr?ciErr.message:`-${ci}`}  users:${uErr?uErr.message:"ok"}  auth:${aErr?aErr.message:"ok"}`);
}

// ─────────── 2. Featured a Fabián ───────────
console.log(`\n═══ FEATURED: Fabián ═══\n`);
const { data: fab } = await s
  .from("users")
  .select("id, full_name, username, featured")
  .eq("email", "fabignasagredo89@gmail.com")
  .maybeSingle();

if (!fab) {
  console.log("  ❌ no encontré a Fabián por email");
} else {
  console.log(`  Fabián: ${fab.full_name} @${fab.username} featured_actual=${fab.featured}`);
  if (fab.featured) {
    console.log("  ✓ ya estaba destacado, nada que hacer");
  } else if (DRY) {
    console.log("  [dry] setearía featured=true");
  } else {
    const { error } = await s.from("users").update({ featured: true }).eq("id", fab.id);
    console.log(error ? `  ⚠️ error: ${error.message}` : "  ✅ featured=true seteado");
  }
}

// ─────────── 3. Estado final de destacados ───────────
const { data: feats } = await s
  .from("users")
  .select("full_name, username, featured")
  .eq("featured", true)
  .order("full_name");
console.log(`\n═══ VENDEDORES DESTACADOS AHORA (${feats?.length ?? 0}) ═══`);
for (const f of feats ?? []) console.log(`  • ${f.full_name} (@${f.username ?? "—"})`);
