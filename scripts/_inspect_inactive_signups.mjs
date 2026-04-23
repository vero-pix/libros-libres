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

// Los 5 que no hicieron nada + Jorge (el de hoy) + Nicolás para comparar
const targets = [
  "far.storm2743@fastmail.com",
  "opusyzmbe@gmail.com",
  "belenaraya53@gmail.com",
  "alejandraschachtebeck@gmail.com",
  "moragaviviana@yahoo.com",
  "nicoeltit@gmail.com",
];

// 1. tabla users
const { data: users } = await s
  .from("users")
  .select("*")
  .in("email", targets);

// 2. auth.users (requiere service role)
const { data: authData } = await s.auth.admin.listUsers({ perPage: 200 });
const authByEmail = Object.fromEntries((authData?.users ?? []).map((u) => [u.email, u]));

for (const u of users ?? []) {
  const au = authByEmail[u.email];
  const { count: listingsN } = await s.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", u.id);
  const { count: cartN } = await s.from("cart_items").select("id", { count: "exact", head: true }).eq("user_id", u.id);
  const { count: ordersN } = await s.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", u.id);

  console.log(`\n─── ${u.full_name ?? "(sin nombre)"} (${u.email}) ───`);
  console.log(`  id:              ${u.id.slice(0, 8)}`);
  console.log(`  creado:          ${u.created_at.slice(0, 16)}`);
  console.log(`  email confirmed: ${au?.email_confirmed_at ?? "❌ NO confirmado"}`);
  console.log(`  último sign-in:  ${au?.last_sign_in_at ?? "nunca"}`);
  console.log(`  phone:           ${u.phone ?? "❌ falta"}`);
  console.log(`  city:            ${u.city ?? "❌ falta"}`);
  console.log(`  address:         ${u.default_address ?? "❌ falta"}`);
  console.log(`  username:        ${u.username ?? "❌ falta"}`);
  console.log(`  MP conectado:    ${u.mercadopago_user_id ? "✅" : "❌"}`);
  console.log(`  listings:        ${listingsN}`);
  console.log(`  cart items:      ${cartN}`);
  console.log(`  orders (buyer):  ${ordersN}`);
  console.log(`  provider auth:   ${au?.app_metadata?.provider ?? "?"}`);
}
