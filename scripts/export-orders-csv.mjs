/**
 * Exporta TODAS las órdenes (la tabla del panel de admin) a un CSV.
 * Uso: node scripts/export-orders-csv.mjs [ruta]   (default: ~/Downloads/ordenes-tuslibros-YYYY-MM-DD.csv)
 * Fechas en hora de Chile.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import os from "os";
import path from "path";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function all(t, c, order) {
  const o = [];
  for (let f = 0; ; f += 1000) {
    let q = s.from(t).select(c).range(f, f + 999);
    if (order) q = q.order(order, { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    o.push(...data);
    if (data.length < 1000) break;
  }
  return o;
}

const orders = await all(
  "orders",
  `*,
   listing:listings(id, price, slug, book:books(title, author)),
   buyer:users!orders_buyer_id_fkey(full_name, email, phone, username),
   seller:users!orders_seller_id_fkey(full_name, email, phone, username)`,
  "created_at",
);

const ESTADO = { pending: "Pendiente", paid: "Pagado", shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado" };
const fecha = (d) => (d ? new Date(d).toLocaleString("es-CL", { timeZone: "America/Santiago", hour12: false }) : "");

const cols = [
  ["fecha", (o) => fecha(o.created_at)],
  ["estado", (o) => ESTADO[o.status] ?? o.status],
  ["titulo", (o) => o.listing?.book?.title ?? ""],
  ["autor", (o) => o.listing?.book?.author ?? ""],
  ["comprador", (o) => o.buyer?.full_name ?? ""],
  ["comprador_email", (o) => o.buyer?.email ?? ""],
  ["comprador_telefono", (o) => o.buyer?.phone ?? ""],
  ["vendedor", (o) => o.seller?.full_name ?? ""],
  ["vendedor_username", (o) => o.seller?.username ?? ""],
  ["vendedor_email", (o) => o.seller?.email ?? ""],
  ["precio_libro", (o) => o.book_price],
  ["envio", (o) => o.shipping_cost],
  ["comision", (o) => o.service_fee],
  ["total", (o) => o.total],
  ["velocidad_envio", (o) => o.shipping_speed],
  ["courier", (o) => o.courier ?? ""],
  ["tracking", (o) => o.tracking_code ?? ""],
  ["estado_envio", (o) => o.shipping_status ?? ""],
  ["direccion", (o) => o.buyer_address ?? ""],
  ["mp_payment_id", (o) => o.mercadopago_payment_id ?? ""],
  ["mp_preference_id", (o) => o.mercadopago_preference_id ?? ""],
  ["bundle_id", (o) => o.bundle_id ?? ""],
  ["order_id", (o) => o.id],
  ["listing_id", (o) => o.listing_id],
  ["actualizado", (o) => fecha(o.updated_at)],
];

const esc = (v) => {
  const t = v == null ? "" : String(v);
  return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
// Separador ";" para que Excel/Numbers en español lo abran bien; BOM para tildes en Excel.
const lines = [cols.map((c) => c[0]).join(";"), ...orders.map((o) => cols.map((c) => esc(c[1](o))).join(";"))];
const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
const out = process.argv[2] ?? path.join(os.homedir(), "Downloads", `ordenes-tuslibros-${hoy}.csv`);
fs.writeFileSync(out, "﻿" + lines.join("\n"), "utf-8");

const porEstado = {};
for (const o of orders) porEstado[ESTADO[o.status] ?? o.status] = (porEstado[ESTADO[o.status] ?? o.status] ?? 0) + 1;
console.log(`${orders.length} órdenes → ${out}`);
console.log(porEstado);
