#!/usr/bin/env node
/**
 * Orígenes de Shipit ↔ vendedores (D1/D6 de docs/prompts/shipit-automatico-v2.md).
 *
 *   node scripts/shipit-origenes.mjs                 lista GET /v/origins y propone match
 *   node scripts/shipit-origenes.mjs --set <user_id> <origin_id>   guarda users.shipit_origin_id
 *
 * El match es una PROPUESTA: Vero confirma cada vendedor antes de --set.
 * Criterios, en orden: correo igual · teléfono igual (últimos 8 dígitos) ·
 * calle+número iguales · mismo nombre. Nunca guarda solo.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/vnd.shipit.v4",
  "X-Shipit-Email": process.env.SHIPIT_EMAIL,
  "X-Shipit-Access-Token": process.env.SHIPIT_TOKEN,
};

const args = process.argv.slice(2);
if (args[0] === "--set") {
  const [, userId, originId] = args;
  if (!userId || !/^\d+$/.test(originId ?? "")) {
    console.error("uso: --set <user_id> <origin_id>");
    process.exit(1);
  }
  const { data, error } = await admin
    .from("users")
    .update({ shipit_origin_id: Number(originId) })
    .eq("id", userId)
    .select("username, shipit_origin_id")
    .single();
  if (error) throw error;
  console.log(`✓ ${data.username} → shipit_origin_id ${data.shipit_origin_id}`);
  process.exit(0);
}

const res = await fetch("https://api.shipit.cl/v/origins", { headers: HEADERS });
if (!res.ok) throw new Error(`GET /v/origins → ${res.status}`);
const origins = await res.json();

const fold = (s) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
const calleNum = (s) => {
  const m = fold(s).match(/^([a-z0-9 .'’-]+?)\s+(\d+)/);
  return m ? `${m[1].replace(/\s+/g, " ")} ${m[2]}` : null;
};
const tel8 = (s) => (s ?? "").replace(/\D/g, "").slice(-8) || null;

console.log(`Orígenes en la cuenta Shipit (${origins.length}):`);
for (const o of origins) {
  const a = o.address_book?.address ?? {};
  console.log(
    `  ${String(o.id).padEnd(7)} ${(o.name ?? "").trim().padEnd(12)} ${o.address_book?.full_name ?? ""} · ${a.street ?? ""} ${a.number ?? ""}, ${a.commune_name ?? ""} · ${o.address_book?.email ?? ""} · ${o.address_book?.phone ?? ""}${o.address_book?.default ? "  [DEFAULT de la cuenta]" : ""}`
  );
}

const { data: users, error } = await admin
  .from("users")
  .select("id, username, full_name, email, phone, default_address, shipit_origin_id")
  .not("default_address", "is", null);
if (error) throw error;

console.log("\nMatch propuesto (confirmar cada uno antes de --set):");
const usados = new Set();
for (const o of origins) {
  const ab = o.address_book ?? {};
  const a = ab.address ?? {};
  const cands = users
    .map((u) => {
      const razones = [];
      if (fold(u.email) && fold(u.email) === fold(ab.email)) razones.push("correo");
      if (tel8(u.phone) && tel8(u.phone) === tel8(ab.phone)) razones.push("teléfono");
      const cn = calleNum(u.default_address);
      if (cn && cn === calleNum(`${a.street ?? ""} ${a.number ?? ""}`)) razones.push("calle+número");
      if (fold(u.full_name) && fold(ab.full_name).includes(fold(u.full_name).split(" ")[0]) && razones.length) razones.push("nombre");
      return { u, razones };
    })
    .filter((c) => c.razones.length)
    .sort((x, y) => y.razones.length - x.razones.length);
  if (!cands.length) {
    console.log(`  origen ${o.id} (${(o.name ?? "").trim()}): sin vendedor que calce`);
    continue;
  }
  for (const c of cands.slice(0, 2)) {
    usados.add(c.u.id);
    console.log(
      `  origen ${o.id} (${(o.name ?? "").trim()}) → ${c.u.username}  [${c.razones.join(", ")}]  ${c.u.shipit_origin_id ? `ya tiene ${c.u.shipit_origin_id}` : ""}\n` +
        `      node scripts/shipit-origenes.mjs --set ${c.u.id} ${o.id}`
    );
  }
}

const { data: conVentas } = await admin
  .from("orders")
  .select("seller_id, seller:users!orders_seller_id_fkey(username)")
  .eq("status", "paid")
  .not("courier", "in", '("Entrega en persona","Punto de retiro")');
const sinOrigen = new Map();
for (const r of conVentas ?? []) if (!usados.has(r.seller_id)) sinOrigen.set(r.seller_id, r.seller?.username);
if (sinOrigen.size) {
  console.log("\nVendedores con ventas por courier y SIN origen en Shipit (hay que crearlo en el panel, D1):");
  for (const [id, username] of sinOrigen) console.log(`  ${username ?? id}`);
}
