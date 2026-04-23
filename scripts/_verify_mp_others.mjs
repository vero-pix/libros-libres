import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const c = fs.readFileSync(envPath, "utf-8");
for (const line of c.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await s
  .from("users")
  .select("id, username, full_name, mercadopago_user_id, mercadopago_connected_at")
  .not("mercadopago_user_id", "is", null);

if (error) {
  console.error("ERROR:", error);
  process.exit(1);
}

console.log(`Vendedores con MP conectado: ${data.length}`);
for (const u of data) {
  console.log(
    `  - ${u.username || u.full_name || "(sin nombre)"} | mp_user_id=${u.mercadopago_user_id} | desde ${u.mercadopago_connected_at}`
  );
}
