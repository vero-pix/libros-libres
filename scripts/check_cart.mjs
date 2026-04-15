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

// Buscar carritos recientes que contengan libros Simenon del seller vero
const SELLER = "2201d163-4423-4971-91f0-f6cebd00d1bd";

// 1) Listar carritos últimas 24h
const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const { data: items, error } = await s
  .from("cart_items")
  .select("*, listing:listings(id, slug, price, book:books(title, author), seller_id)")
  .gte("added_at", since)
  .order("added_at", { ascending: false });

if (error) { console.error(error); process.exit(1); }

// Agrupar por user_id
const byUser = {};
for (const it of items ?? []) {
  const uid = it.user_id;
  if (!byUser[uid]) byUser[uid] = [];
  byUser[uid].push(it);
}

for (const [uid, its] of Object.entries(byUser)) {
  // Solo mostrar si tiene libros del seller vero (Simenon)
  const hasMaigret = its.some((i) => i.listing?.seller_id === SELLER);
  if (!hasMaigret) continue;

  const { data: u } = await s.from("users").select("id, email, full_name, phone").eq("id", uid).single();
  console.log(`\n═══ CARRITO DE ${u?.full_name || "sin nombre"} ═══`);
  console.log(`  email: ${u?.email}`);
  console.log(`  phone: ${u?.phone}`);
  console.log(`  user_id: ${uid}`);
  console.log(`  ${its.length} items`);
  console.log();

  let total = 0;
  for (const i of its) {
    const b = i.listing?.book;
    const price = i.listing?.price ?? 0;
    total += price * (i.quantity ?? 1);
    console.log(`  • ${b?.title ?? "?"}`);
    console.log(`    $${price.toLocaleString("es-CL")}  qty=${i.quantity ?? 1}  slug=${i.listing?.slug}`);
  }
  console.log(`\n  TOTAL: $${total.toLocaleString("es-CL")}`);
}
