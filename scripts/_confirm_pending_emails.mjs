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

const { data: auth } = await s.auth.admin.listUsers({ perPage: 500 });
const pending = (auth?.users ?? []).filter((u) => !u.email_confirmed_at);

console.log(`Usuarios con email sin confirmar: ${pending.length}`);
for (const u of pending) {
  console.log(`  ${u.email}  · creado: ${u.created_at}`);
  const { error } = await s.auth.admin.updateUserById(u.id, { email_confirm: true });
  if (error) console.log(`    ❌ ${error.message}`);
  else console.log(`    ✅ confirmado manualmente`);
}

if (!pending.length) console.log("(ninguno pendiente)");
