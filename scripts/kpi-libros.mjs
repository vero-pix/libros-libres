/**
 * Reporte de ritmo por libro — el KPI de la ficha, pero para todo el catálogo.
 *
 *   node scripts/kpi-libros.mjs                # todo el catálogo
 *   node scripts/kpi-libros.mjs vero           # una tienda
 *   node scripts/kpi-libros.mjs vero 30        # y con un mínimo de días
 *
 * Qué mira: visitas por día desde que se publicó. No el total de visitas, que
 * premia a lo viejo por el solo hecho de llevar meses arriba.
 */
import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = ".env.local";
if (existsSync(env)) {
  for (const linea of readFileSync(env, "utf8").split("\n")) {
    if (linea.startsWith("#") || !linea.includes("=")) continue;
    const i = linea.indexOf("=");
    const k = linea.slice(0, i).trim();
    if (!process.env[k]) process.env[k] = linea.slice(i + 1).trim();
  }
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const vendedor = process.argv[2] ?? null;
const minDias = Number(process.argv[3] ?? 7);

let sellerId = null;
if (vendedor) {
  const { data } = await sb.from("users").select("id").eq("username", vendedor).single();
  if (!data) { console.log(`No existe el vendedor ${vendedor}`); process.exit(1); }
  sellerId = data.id;
}

// Listings activos (paginado: Supabase corta en 1.000)
const filas = [];
for (let desde = 0; ; desde += 1000) {
  let q = sb.from("listings")
    .select("id, created_at, price, seller_id, book:books(title)")
    .eq("status", "active")
    .range(desde, desde + 999);
  if (sellerId) q = q.eq("seller_id", sellerId);
  const { data } = await q;
  filas.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}

// Visitas por listing
const vistas = new Map();
for (let desde = 0; ; desde += 1000) {
  const { data } = await sb.from("page_views")
    .select("listing_id")
    .not("listing_id", "is", null)
    .range(desde, desde + 999);
  for (const v of data ?? []) vistas.set(v.listing_id, (vistas.get(v.listing_id) ?? 0) + 1);
  if (!data || data.length < 1000) break;
}

const hoy = Date.now();
const libros = filas.map((l) => {
  const dias = Math.max(1, Math.floor((hoy - new Date(l.created_at).getTime()) / 86400000));
  const v = vistas.get(l.id) ?? 0;
  return { titulo: l.book?.title ?? "—", dias, visitas: v, ritmo: v / dias, precio: Number(l.price ?? 0) };
}).filter((l) => l.dias >= minDias);

libros.sort((a, b) => b.ritmo - a.ritmo);
const ritmos = libros.map((l) => l.ritmo).sort((a, b) => a - b);
const mediana = ritmos[Math.floor(ritmos.length / 2)] ?? 0;

const linea = (l) =>
  `  ${l.ritmo.toFixed(2).padStart(5)}/día  ${String(l.visitas).padStart(4)} vis  ${String(l.dias).padStart(4)}d  $${l.precio.toLocaleString("es-CL").padStart(7)}  ${l.titulo.slice(0, 52)}`;

console.log(`\n${libros.length} libros${vendedor ? ` de ${vendedor}` : ""} con al menos ${minDias} días publicados`);
console.log(`Ritmo mediano: ${mediana.toFixed(2)} visitas al día\n`);
console.log("━━━ LOS QUE MÁS TIRAN ━━━");
libros.slice(0, 12).forEach((l) => console.log(linea(l)));

const muertos = libros.filter((l) => l.visitas === 0);
console.log(`\n━━━ SIN UNA SOLA VISITA: ${muertos.length} de ${libros.length} (${Math.round(muertos.length / libros.length * 100)}%) ━━━`);
muertos.sort((a, b) => b.precio - a.precio).slice(0, 12).forEach((l) => console.log(linea(l)));

const caros = libros.filter((l) => l.precio >= 20000).sort((a, b) => a.ritmo - b.ritmo);
if (caros.length) {
  console.log(`\n━━━ CAROS QUE NO SE MIRAN (sobre $20.000, peor ritmo) ━━━`);
  caros.slice(0, 10).forEach((l) => console.log(linea(l)));
}
console.log("");
