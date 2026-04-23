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
const { data: users } = await s.from("users").select("id,email,username,full_name,created_at,mercadopago_user_id").or("username.ilike.%buhardilla%,full_name.ilike.%buhardilla%,email.ilike.%buhardilla%");
console.log("USUARIOS:", JSON.stringify(users, null, 2));
for (const u of users ?? []) {
  const { data: listings } = await s.from("listings").select("id,title,status,created_at,price").eq("seller_id", u.id).order("created_at", {ascending:false});
  console.log(`\n── ${u.username || u.email} — ${listings?.length ?? 0} listings ──`);
  for (const l of listings ?? []) console.log(`  [${l.status}] ${l.created_at.slice(0,16)} · $${l.price} · ${l.title}`);
}
