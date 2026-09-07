#!/usr/bin/env node
/**
 * Encola en `shipments` las ventas pagadas con courier que todavía no tienen
 * fila ni despacho (sin tracking_code y sin shipping_status='created'). Idempotente (ON CONFLICT DO NOTHING por bundle_id). Sirve para:
 *   - la fase 1b (recuperar lo que se pagó antes de que existiera la cola)
 *   - probar el worker en dry-run contra ventas reales
 *
 *   node scripts/shipit-encolar.mjs --desde 2026-09-01 [--hasta 2026-09-30] [--dry]
 *
 * --dry solo lista, no inserta. Usa SUPABASE_SERVICE_ROLE_KEY de .env.local.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const desde = opt("desde", "2026-09-01");
const hasta = opt("hasta", null);
const dry = args.includes("--dry");

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let q = admin
  .from("orders")
  .select(
    "id, bundle_id, seller_id, buyer_id, courier, shipping_cost, shipping_subsidy, buyer_address, created_at, tracking_code, shipping_status, seller:users!orders_seller_id_fkey(username)"
  )
  .eq("status", "paid")
  // Ya despachadas a mano (o por el flujo viejo): tienen tracking o el
  // borrador creado en Shipit. Encolarlas crearía un segundo envío.
  .is("tracking_code", null)
  .or("shipping_status.is.null,shipping_status.neq.created")
  .not("courier", "in", '("Entrega en persona","Punto de retiro")')
  .not("buyer_address", "is", null)
  .gte("created_at", desde)
  .order("created_at");
if (hasta) q = q.lte("created_at", hasta + "T23:59:59");
const { data: orders, error } = await q;
if (error) throw error;

// Una fila por bundle: la cabeza es la que cargó flete o subsidio.
const porBundle = new Map();
for (const o of orders) {
  const key = o.bundle_id ?? o.id;
  const cur = porBundle.get(key);
  const esCabeza = Number(o.shipping_cost) > 0 || Number(o.shipping_subsidy) > 0;
  if (!cur || (esCabeza && !cur.esCabeza)) porBundle.set(key, { ...o, esCabeza, key });
}

const { data: existentes } = await admin.from("shipments").select("bundle_id");
const yaEncolados = new Set((existentes ?? []).map((s) => s.bundle_id));

const ref = (b) => "TL-" + b.replace(/-/g, "").slice(0, 12);
let insertadas = 0;
console.log(`${porBundle.size} bundles pagados con courier desde ${desde}${hasta ? " hasta " + hasta : ""}:`);
for (const o of porBundle.values()) {
  const estado = yaEncolados.has(o.key) ? "ya encolado" : dry ? "(dry) se encolaría" : "encolar";
  console.log(
    `  ${ref(o.key)}  ${o.created_at.slice(0, 10)}  ${(o.seller?.username ?? o.seller_id).padEnd(20)}  ${(o.courier ?? "").padEnd(11)}  $${Number(o.shipping_cost) + Number(o.shipping_subsidy)}  ${estado}`
  );
  if (dry || yaEncolados.has(o.key)) continue;
  const { data: vend } = await admin.from("users").select("shipit_dispatch_mode").eq("id", o.seller_id).maybeSingle();
  const { error: e } = await admin.from("shipments").upsert(
    {
      bundle_id: o.key,
      order_head_id: o.id,
      seller_id: o.seller_id,
      buyer_id: o.buyer_id,
      reference: ref(o.key),
      quoted_cost: Number(o.shipping_cost) + Number(o.shipping_subsidy),
      dispatch_mode: vend?.shipit_dispatch_mode === "pickup" ? "pickup" : "dropoff",
    },
    { onConflict: "bundle_id", ignoreDuplicates: true }
  );
  if (e) console.error("   ✗", e.message);
  else insertadas++;
}
console.log(dry ? "(dry-run: nada insertado)" : `${insertadas} filas insertadas en shipments.`);
