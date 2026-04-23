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

const { data } = await s
  .from("users")
  .select("id, email, full_name, username, role, mercadopago_connected_at")
  .or("email.ilike.%vero%,email.ilike.%velasquez%,email.ilike.%economics%,full_name.ilike.%vero%")
  .order("created_at");
for (const u of data ?? []) {
  console.log({ id: u.id.slice(0,8), email: u.email, full_name: u.full_name, username: u.username, role: u.role, mp: u.mercadopago_connected_at ? "SÍ" : "NO" });
}
