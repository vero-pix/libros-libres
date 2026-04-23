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

// 1. Encontrar usuario Huertas
const { data: users } = await s
  .from("users")
  .select("id, full_name, email")
  .ilike("full_name", "%huertas%");

console.log("Usuarios Huertas encontrados:");
for (const u of users ?? []) console.log(`  ${u.id.slice(0, 8)}  ${u.full_name}  ${u.email}`);

if (!users?.length) {
  console.log("No se encontró Huertas");
  process.exit(1);
}

// 2. Buscar sus cart_items
const huertasIds = users.map((u) => u.id);
const { data: items } = await s
  .from("cart_items")
  .select("id, user_id, listing_id, added_at")
  .in("user_id", huertasIds);

console.log(`\nItems en carrito de Huertas: ${items?.length ?? 0}`);

if (!items?.length) {
  console.log("Ya está limpio");
  process.exit(0);
}

// 3. Ver qué listings son
const listingIds = items.map((i) => i.listing_id);
const { data: listings } = await s
  .from("listings")
  .select("id, book:books(title)")
  .in("id", listingIds);
const byId = Object.fromEntries((listings ?? []).map((l) => [l.id, l]));

for (const it of items) {
  const l = byId[it.listing_id];
  console.log(`  cart_item ${it.id.slice(0, 8)}  →  ${l?.book?.title ?? "?"}`);
}

// 4. Borrar
const { error: delErr } = await s.from("cart_items").delete().in("id", items.map((i) => i.id));
if (delErr) {
  console.error("Error borrando:", delErr);
  process.exit(1);
}
console.log(`\n✅ Borrados ${items.length} items del carrito de Huertas`);
