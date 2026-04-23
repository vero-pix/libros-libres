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
// Buscar por email
const { data: byEmail } = await s.from("users").select("*").ilike("email", "%lacamara%");
console.log("BY EMAIL:", JSON.stringify(byEmail, null, 2));
// Auth lookup
const { data: auth } = await s.auth.admin.listUsers();
const antonio = auth?.users?.find(u => u.email?.includes("lacamara"));
console.log("AUTH:", antonio ? {id: antonio.id, email: antonio.email, last_sign_in: antonio.last_sign_in_at, created: antonio.created_at} : "not found");
if (antonio) {
  const { data: listings } = await s.from("listings").select("id,title,status,created_at").eq("seller_id", antonio.id);
  console.log("LISTINGS:", listings?.length ?? 0, listings);
}
