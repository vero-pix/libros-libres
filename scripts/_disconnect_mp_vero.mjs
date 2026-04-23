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

const VERO_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";

const { data: before } = await s
  .from("users")
  .select("id, username, mercadopago_user_id, mercadopago_connected_at")
  .eq("id", VERO_ID)
  .single();

console.log("ANTES:", JSON.stringify(before, null, 2));

const { error } = await s
  .from("users")
  .update({
    mercadopago_user_id: null,
    mercadopago_access_token: null,
    mercadopago_refresh_token: null,
    mercadopago_connected_at: null,
  })
  .eq("id", VERO_ID);

if (error) {
  console.error("ERROR:", error);
  process.exit(1);
}

const { data: after } = await s
  .from("users")
  .select("id, username, mercadopago_user_id, mercadopago_connected_at")
  .eq("id", VERO_ID)
  .single();

console.log("DESPUES:", JSON.stringify(after, null, 2));
console.log("OK — cuenta MP desconectada.");
