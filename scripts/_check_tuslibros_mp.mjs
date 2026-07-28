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

// Buscar TODAS las cuentas relacionadas a Vero / TusLibros
const { data: users } = await s
  .from("users")
  .select("id, full_name, email, username, mercadopago_user_id, mercadopago_connected_at, plan, role")
  .or("email.ilike.%tuslibros%,email.ilike.%vero%,email.ilike.%veronicavelasquez%,full_name.ilike.%vero%,full_name.ilike.%tuslibros%");

console.log(`Cuentas relacionadas a Vero / TusLibros: ${users?.length ?? 0}\n`);

for (const u of users ?? []) {
  console.log("────────────────────────────");
  console.log(`  id:            ${u.id.slice(0, 8)}${u.id.length > 8 ? "…" : ""}`);
  console.log(`  full_name:     ${u.full_name}`);
  console.log(`  email:         ${u.email}`);
  console.log(`  username:      ${u.username ?? "—"}`);
  console.log(`  role:          ${u.role}  |  plan: ${u.plan}`);
  console.log(`  MP user_id:    ${u.mercadopago_user_id ?? "— NO conectado"}`);
  console.log(`  MP connected:  ${u.mercadopago_connected_at ?? "—"}`);
  // Los tokens viven en mp_credentials, no en users
  const { data: cred } = await s.from("mp_credentials").select("access_token, refresh_token").eq("user_id", u.id).maybeSingle();
  console.log(`  access_token:  ${cred?.access_token ? `${cred.access_token.slice(0, 12)}...(${cred.access_token.length} chars)` : "—"}`);
  console.log(`  refresh_token: ${cred?.refresh_token ? "✅ presente" : "❌ no"}`);
}
