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

// 1. Buscar el listing de Canción Valiente
const { data: listings } = await s
  .from("listings")
  .select("id, seller_id, price, status, book:books(title, author)")
  .ilike("book.title", "%canción valiente%");

console.log(`Listings Canción Valiente: ${listings?.length ?? 0}`);
for (const l of listings ?? []) {
  console.log(`  ${l.id.slice(0, 8)}  ${l.status}  $${l.price}  "${l.book?.title}" de ${l.book?.author}  seller: ${l.seller_id?.slice(0, 8)}`);
}

// 2. Ver el seller
const sellerIds = [...new Set((listings ?? []).map((l) => l.seller_id).filter(Boolean))];
if (sellerIds.length) {
  const { data: sellers } = await s
    .from("users")
    .select("id, full_name, email, phone, username")
    .in("id", sellerIds);
  console.log(`\nSellers:`);
  for (const u of sellers ?? []) {
    console.log(`  ${u.id.slice(0, 8)}  ${u.full_name}  ${u.email}  ${u.phone ?? "(sin teléfono)"}  @${u.username ?? "(sin username)"}`);
  }
}

// 3. Ver si hay cart_items de Camilo con esos listings
const { data: camilo } = await s
  .from("users")
  .select("id, full_name, email")
  .ilike("email", "%camilosantelices%");

if (camilo?.length) {
  const camiloId = camilo[0].id;
  const { data: cartItems } = await s
    .from("cart_items")
    .select("id, listing_id, added_at")
    .eq("user_id", camiloId);

  console.log(`\nCarrito actual de Camilo: ${cartItems?.length ?? 0} items`);
  for (const it of cartItems ?? []) {
    const l = (listings ?? []).find((x) => x.id === it.listing_id);
    console.log(`  ${it.listing_id.slice(0, 8)}  ${l ? l.book?.title : "(otro libro)"}  added: ${it.added_at}`);
  }
}
