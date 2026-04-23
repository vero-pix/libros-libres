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

const { data } = await s.from("users").select("id, full_name, username, avatar_url, featured").eq("featured", true);
console.log(`Vendedores con featured=true: ${data?.length ?? 0}\n`);
for (const u of data ?? []) {
  const avatar = u.avatar_url ? "✅" : "❌ SIN AVATAR";
  console.log(`  ${avatar}  ${u.full_name?.padEnd(25)} @${u.username ?? "(sin username)"} — avatar=${u.avatar_url ?? "NULL"}`);
}
