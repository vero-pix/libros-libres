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

// Buscar en tabla users + auth.users
const { data: pubUsers } = await s.from("users").select("*").ilike("email", "%lazoora%");
console.log("Tabla users:", pubUsers?.length ?? 0);
for (const u of pubUsers ?? []) {
  console.log(`  ${u.id.slice(0, 8)}  ${u.email}  ${u.full_name}  creado: ${u.created_at}`);
}

const { data: auth } = await s.auth.admin.listUsers({ perPage: 500 });
const matches = (auth?.users ?? []).filter((u) => u.email?.includes("lazoora"));
console.log(`\nauth.users: ${matches.length}`);
for (const u of matches) {
  console.log(`  ${u.id.slice(0, 8)}  ${u.email}`);
  console.log(`    email_confirmed_at: ${u.email_confirmed_at ?? "❌ no confirmado"}`);
  console.log(`    last_sign_in_at: ${u.last_sign_in_at ?? "nunca"}`);
  console.log(`    created_at: ${u.created_at}`);
  console.log(`    provider: ${u.app_metadata?.provider}`);
  if (u.identities) console.log(`    identities: ${u.identities.map(i => i.provider).join(", ")}`);
}

// Últimos 5 registros por si quedó con otro email
console.log(`\n── Últimos 5 usuarios registrados (para ver si entró con otro email) ──`);
const { data: recent } = await s
  .from("users")
  .select("id, email, full_name, created_at")
  .order("created_at", { ascending: false })
  .limit(5);
for (const u of recent ?? []) {
  console.log(`  ${u.created_at.slice(0, 16)}  ${u.email}  ${u.full_name ?? "(sin nombre)"}`);
}
