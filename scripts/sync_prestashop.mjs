/**
 * sync_prestashop.mjs
 * Sincroniza stock entre PrestaShop y tuslibros.cl
 *
 * Cómo funciona:
 *   - Lee todos los listings activos del vendedor en tuslibros
 *   - Para cada uno, busca el producto en PrestaShop por ISBN o título
 *   - Si stock PrestaShop = 0 y tuslibros = activo → pausa en tuslibros
 *   - Si stock PrestaShop > 0 y tuslibros = pausado → reactiva en tuslibros
 *
 * Uso:
 *   node scripts/sync_prestashop.mjs
 *   (Se recomienda ejecutar cada 15-30 min con cron)
 *
 * Variables requeridas: PS_URL, PS_API_KEY, TL_API_KEY, TL_URL (igual que import)
 */

import { readFileSync } from "fs";

try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
} catch {}

const PS_URL     = (process.env.PS_URL || "").replace(/\/$/, "");
const PS_API_KEY = process.env.PS_API_KEY || "";
const TL_API_KEY = process.env.TL_API_KEY || "";
const TL_URL     = (process.env.TL_URL || "https://tuslibros.cl").replace(/\/$/, "");
const DRY_RUN    = process.env.DRY_RUN === "true";

if (!PS_URL || !PS_API_KEY || !TL_API_KEY) {
  console.error("❌ Faltan variables: PS_URL, PS_API_KEY o TL_API_KEY");
  process.exit(1);
}

const psHeaders = {
  Authorization: "Basic " + Buffer.from(`${PS_API_KEY}:`).toString("base64"),
  Accept: "application/json",
};
const tlHeaders = {
  Authorization: `Bearer ${TL_API_KEY}`,
  "Content-Type": "application/json",
};

async function psGet(path) {
  const url = `${PS_URL}/api/${path}${path.includes("?") ? "&" : "?"}output_format=JSON`;
  const res = await fetch(url, { headers: psHeaders });
  if (!res.ok) throw new Error(`PS ${path}: ${res.status}`);
  return res.json();
}

async function tlGet(path) {
  const res = await fetch(`${TL_URL}${path}`, { headers: tlHeaders });
  if (!res.ok) throw new Error(`TL ${path}: ${res.status}`);
  return res.json();
}

async function tlPatch(id, body) {
  const res = await fetch(`${TL_URL}/api/v1/listings/${id}`, {
    method: "PATCH",
    headers: tlHeaders,
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json() };
}

async function main() {
  const ts = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" });
  console.log(`\n[${ts}] Iniciando sync PrestaShop ↔ tuslibros...`);
  if (DRY_RUN) console.log("⚠️  MODO SIMULACIÓN");

  // 1. Obtener todos los listings activos y pausados del vendedor en tuslibros
  const [active, paused] = await Promise.all([
    tlGet("/api/v1/listings?status=active&limit=100"),
    tlGet("/api/v1/listings?status=paused&limit=100"),
  ]);

  const allListings = [
    ...(active.listings || []).map(l => ({ ...l, tl_status: "active" })),
    ...(paused.listings || []).map(l => ({ ...l, tl_status: "paused" })),
  ];

  console.log(`   tuslibros: ${active.listings?.length ?? 0} activos, ${paused.listings?.length ?? 0} pausados`);

  // 2. Obtener todo el stock de PrestaShop
  const stockData = await psGet("stock_availables?display=[id_product,quantity]&limit=0");
  const stockMap = {};
  for (const s of stockData.stock_availables || []) {
    stockMap[String(s.id_product)] = parseInt(s.quantity) || 0;
  }

  // 3. Obtener productos de PrestaShop e indexar por ISBN y título
  const productsData = await psGet("products?display=[id,reference,ean13,name,price]&limit=0");
  const psByIsbn = {};
  const psByTitle = {};

  for (const p of productsData.products || []) {
    const isbn = (p.reference || p.ean13 || "").replace(/[^0-9]/g, "");
    if (isbn.length >= 10) psByIsbn[isbn] = p.id;

    const name = Array.isArray(p.name)
      ? (p.name[0]?.language?.value || "")
      : (p.name || "");
    if (name) psByTitle[name.toLowerCase().trim()] = p.id;
  }

  console.log(`   PrestaShop: ${Object.keys(stockMap).length} productos con stock info`);

  // 4. Cruzar y sincronizar
  let paused_count = 0, activated_count = 0, not_found = 0, unchanged = 0;

  for (const listing of allListings) {
    const isbn = listing.book?.isbn?.replace(/[^0-9]/g, "") || "";
    const title = (listing.book?.title || "").toLowerCase().trim();

    // Buscar en PrestaShop por ISBN primero, luego por título
    let psId = isbn ? psByIsbn[isbn] : null;
    if (!psId) psId = psByTitle[title] || null;

    if (!psId) {
      not_found++;
      continue;
    }

    const psStock = stockMap[String(psId)] ?? -1;
    if (psStock === -1) { not_found++; continue; }

    const shouldBePaused = psStock === 0;
    const isActive = listing.tl_status === "active";
    const isPaused = listing.tl_status === "paused";

    if (shouldBePaused && isActive) {
      // Stock en 0 en PrestaShop → pausar en tuslibros
      console.log(`   ⏸  Pausando: "${listing.book?.title}" (stock PS: ${psStock})`);
      if (!DRY_RUN) await tlPatch(listing.id, { status: "paused" });
      paused_count++;
    } else if (!shouldBePaused && isPaused) {
      // Volvió a haber stock → reactivar en tuslibros
      console.log(`   ▶️  Reactivando: "${listing.book?.title}" (stock PS: ${psStock})`);
      if (!DRY_RUN) await tlPatch(listing.id, { status: "active" });
      activated_count++;
    } else {
      unchanged++;
    }
  }

  console.log(`\nSync completado:`);
  console.log(`   Pausados:     ${paused_count}`);
  console.log(`   Reactivados:  ${activated_count}`);
  console.log(`   Sin cambio:   ${unchanged}`);
  console.log(`   No encontrados en PS: ${not_found}`);
}

main().catch(err => {
  console.error("❌ Error en sync:", err.message);
  process.exit(1);
});
