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

const { data: users, error } = await s
  .from("users")
  .select("id, full_name, email, username, created_at, role")
  .order("created_at", { ascending: false });

if (error) {
  console.error("err:", error);
  process.exit(1);
}

const now = Date.now();
const h = (ms) => Math.round((now - ms) / 3600e3);

console.log(`═══ TOTAL USUARIOS: ${users.length} ═══\n`);

console.log("ÚLTIMOS 20 REGISTROS (más reciente primero):\n");
for (const u of users.slice(0, 20)) {
  const age = h(new Date(u.created_at).getTime());
  const ageLabel = age < 24 ? `hace ${age}h` : `hace ${Math.round(age / 24)}d`;
  console.log(
    `  ${u.created_at.slice(0, 16)}  (${ageLabel.padEnd(10)})  ${(u.full_name ?? "(sin nombre)").padEnd(28)}  ${u.email}  ${u.username ? "@" + u.username : ""}`
  );
}

// Contar por ventana
const last24h = users.filter((u) => h(new Date(u.created_at).getTime()) <= 24).length;
const last7d = users.filter((u) => h(new Date(u.created_at).getTime()) <= 24 * 7).length;
const last30d = users.filter((u) => h(new Date(u.created_at).getTime()) <= 24 * 30).length;

console.log(`\n═══ REGISTROS POR VENTANA ═══`);
console.log(`  últimas 24h:  ${last24h}`);
console.log(`  últimos 7d:   ${last7d}`);
console.log(`  últimos 30d:  ${last30d}`);
console.log(`  total:        ${users.length}`);
