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

const { data: user } = await s
  .from("users")
  .select("mercadopago_access_token, mercadopago_user_id")
  .eq("id", "2201d163-7020-41d8-ba9a-ebb0ed1f0059")
  .maybeSingle();

// intentamos por id exacto — si no, por email
let accessToken = user?.mercadopago_access_token;
let mpUserId = user?.mercadopago_user_id;

if (!accessToken) {
  const { data: u } = await s
    .from("users")
    .select("mercadopago_access_token, mercadopago_user_id")
    .eq("email", "vero@tuslibros.cl")
    .maybeSingle();
  accessToken = u?.mercadopago_access_token;
  mpUserId = u?.mercadopago_user_id;
}

if (!accessToken) {
  console.error("No encontré access token");
  process.exit(1);
}

console.log(`MP user_id en BD: ${mpUserId}`);
console.log(`Consultando API de MercadoPago...\n`);

const res = await fetch("https://api.mercadopago.com/users/me", {
  headers: { Authorization: `Bearer ${accessToken}` },
});

const data = await res.json();

if (!res.ok) {
  console.error(`Error ${res.status}:`, data);
  process.exit(1);
}

console.log("─── CUENTA DE MERCADOPAGO VINCULADA ───");
console.log(`  MP id:          ${data.id}`);
console.log(`  nickname:       ${data.nickname ?? "—"}`);
console.log(`  email:          ${data.email ?? "—"}`);
console.log(`  first_name:     ${data.first_name ?? "—"}`);
console.log(`  last_name:      ${data.last_name ?? "—"}`);
console.log(`  identification: ${data.identification?.type ?? ""} ${data.identification?.number ?? ""}`);
console.log(`  país:           ${data.country_id ?? data.site_id ?? "—"}`);
console.log(`  teléfono:       ${data.phone?.area_code ?? ""} ${data.phone?.number ?? "—"}`);
console.log(`  creado:         ${data.registration_date ?? "—"}`);
console.log(`  tags:           ${(data.tags ?? []).join(", ") || "—"}`);
