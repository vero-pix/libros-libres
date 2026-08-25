/**
 * Valida el feed de producto antes de publicarlo en Google Merchant o Meta.
 *
 * Responde: cuántos ítems entran, cuántos se excluyen y por qué motivo, y si
 * algún campo obligatorio viene vacío.
 *
 *   node scripts/feed-validar.mjs           → resumen
 *   node scripts/feed-validar.mjs --detalle → lista los excluidos uno por uno
 *
 * ⚠️ No imprime datos de terceros: los excluidos salen por título y id de
 * listing, nunca con correo ni teléfono del vendedor.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const detalle = process.argv.includes("--detalle");

const filas = [];
for (let desde = 0; ; desde += 1000) {
  const { data, error } = await s
    .from("listings")
    .select(
      "id, price, condition, slug, cover_image_url, seller_id, seller:users(username, mercadopago_user_id), book:books(title, author, description, cover_url, isbn, publisher)"
    )
    .eq("status", "active")
    .range(desde, desde + 999);
  if (error) throw error;
  filas.push(...data);
  if (data.length < 1000) break;
}

const items = [];
const excluidos = [];
for (const l of filas) {
  const titulo = l.book?.title?.trim() ?? "";
  const fuera = (motivo) => excluidos.push({ id: l.id, titulo: titulo || "(sin título)", motivo });

  if (!l.seller?.mercadopago_user_id) { fuera("vendedor sin MercadoPago"); continue; }
  if (!titulo) { fuera("sin título"); continue; }
  if (!l.price || l.price <= 0) { fuera("sin precio"); continue; }
  if (!(l.book?.cover_url || l.cover_image_url)) { fuera("sin imagen usable"); continue; }
  if (!l.slug || !l.seller.username) { fuera("sin URL amigable"); continue; }
  items.push(l);
}

const pct = (n) => `${((n * 100) / filas.length).toFixed(1)}%`;
console.log("═══ FEED DE PRODUCTO ═══\n");
console.log(`Listings activos:      ${filas.length}`);
console.log(`✅ Entran al feed:     ${items.length}  (${pct(items.length)})`);
console.log(`❌ Excluidos:          ${excluidos.length}  (${pct(excluidos.length)})\n`);

const porMotivo = {};
for (const e of excluidos) porMotivo[e.motivo] = (porMotivo[e.motivo] ?? 0) + 1;
console.log("Motivos de exclusión:");
for (const [m, n] of Object.entries(porMotivo).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${m}`);
}

// Campos obligatorios que podrían venir flojos aun estando presentes
const sinIsbn = items.filter((l) => !l.book?.isbn?.trim()).length;
const sinDescripcion = items.filter((l) => !l.book?.description?.trim()).length;
const sinAutor = items.filter((l) => !l.book?.author?.trim()).length;
const usanContratapa = items.filter((l) => !l.book?.cover_url && l.cover_image_url).length;

console.log("\nCalidad de los que SÍ entran:");
console.log(`  sin ISBN (van con identifier_exists=no): ${sinIsbn}`);
console.log(`  sin descripción propia (se genera una):  ${sinDescripcion}`);
console.log(`  sin autor (van como "Autor desconocido"): ${sinAutor}`);
console.log(`  ⚠️ usan foto del vendedor, no tapa de catálogo: ${usanContratapa}`);
console.log("     (esos son los candidatos a que la imagen sea la contratapa)");

const valorFeed = items.reduce((t, l) => t + (l.price ?? 0), 0);
console.log(`\nValor del catálogo publicado: $${valorFeed.toLocaleString("es-CL")}`);

if (detalle) {
  console.log("\n═══ EXCLUIDOS EN DETALLE ═══");
  for (const [m] of Object.entries(porMotivo)) {
    console.log(`\n── ${m} ──`);
    for (const e of excluidos.filter((x) => x.motivo === m)) {
      console.log(`  ${e.id.slice(0, 8)}  ${e.titulo.slice(0, 60)}`);
    }
  }
} else {
  console.log("\n(corre con --detalle para ver la lista completa de excluidos)");
}
