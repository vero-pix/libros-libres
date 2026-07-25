/**
 * Reporte de integridad del catálogo. SOLO LEE — no borra ni modifica nada.
 *
 *   node scripts/_audit_integridad.mjs
 *
 * Lista:
 *   1. Publicaciones activas bajo el mínimo de precio.
 *   2. Publicaciones muy bajo la mediana de su mismo título en la plataforma.
 *   3. Duplicados del mismo vendedor (mismo ISBN o título casi idéntico).
 *   4. Cuáles de todas esas están además en un carrusel/colección curada.
 *
 * Vero decide caso a caso qué hacer con cada uno.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const MIN_PRICE = Number(process.env.MIN_LISTING_PRICE ?? 1000);
const DEVIATION_PCT = 60;
const SIMILARITY = 0.85;
const clp = (n) => "$" + Math.round(n ?? 0).toLocaleString("es-CL");
const P = (t) => console.log(`\n━━━━━━ ${t} ━━━━━━`);

const normalizeTitle = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(\s*\d+\s*\)\s*$/, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeIsbn = (s) => String(s ?? "").replace(/[^0-9xX]/g, "").toUpperCase();

function titleSimilarity(a, b) {
  const x = normalizeTitle(a);
  const y = normalizeTitle(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const bigrams = (s) => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const bx = bigrams(x);
  const by = bigrams(y);
  let hits = 0;
  for (const [g, n] of bx) hits += Math.min(n, by.get(g) ?? 0);
  const total =
    [...bx.values()].reduce((a, c) => a + c, 0) + [...by.values()].reduce((a, c) => a + c, 0);
  return total ? (2 * hits) / total : 0;
}

const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

/** Marcadores de tomo/volumen: separan "Tomo I" de "Tomo II" (libros distintos). */
function volumeMarkers(title) {
  const t = normalizeTitle(title);
  const out = new Set();
  for (const m of t.matchAll(/\b(?:tomo|vol|volumen|parte|libro|numero|n)\s+([ivx]+|\d{1,2})\b/g)) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : ROMAN[m[1]];
    if (n) out.add(n);
  }
  const tail = t.match(/\s(\d{1,2})$/);
  if (tail) out.add(Number(tail[1]));
  const tr = t.match(/\s([ivx]{1,4})$/);
  if (tr && ROMAN[tr[1]]) out.add(ROMAN[tr[1]]);
  return out;
}

function differentVolume(a, b) {
  const va = volumeMarkers(a);
  const vb = volumeMarkers(b);
  if (!va.size && !vb.size) return false;
  if (va.size !== vb.size) return true;
  for (const n of va) if (!vb.has(n)) return true;
  return false;
}

const median = (arr) => {
  const n = arr.filter((v) => v > 0).sort((a, b) => a - b);
  if (!n.length) return null;
  const m = Math.floor(n.length / 2);
  return n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2;
};

// ── Cargar catálogo activo ──
const all = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supa
    .from("listings")
    .select("id, slug, price, seller_id, created_at, status, book:books(id, title, author, isbn, tags)")
    .eq("status", "active")
    .range(from, from + 999);
  if (error) {
    console.error("Error leyendo listings:", error.message);
    process.exit(1);
  }
  all.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}

const { data: users } = await supa.from("users").select("id, username, full_name");
const U = Object.fromEntries((users ?? []).map((u) => [u.id, u.username ?? u.full_name ?? u.id.slice(0, 8)]));
const withBook = all.filter((l) => l.book);

console.log(`Catálogo activo: ${all.length} publicaciones (${withBook.length} con ficha de libro)`);
console.log(`Umbrales: mínimo ${clp(MIN_PRICE)} · desviación ${DEVIATION_PCT}% · similitud ${SIMILARITY}`);

// ── 1. Bajo el mínimo ──
P("PRECIO BAJO EL MÍNIMO");
const bajos = withBook
  .filter((l) => (l.price ?? 0) < MIN_PRICE)
  .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
console.log(`${bajos.length} publicaciones bajo ${clp(MIN_PRICE)}`);
for (const l of bajos) {
  const tags = (l.book.tags ?? []).length ? ` · tags: ${l.book.tags.join(", ")}` : "";
  console.log(`  ${clp(l.price)} · ${(l.book.title ?? "").slice(0, 48)} · @${U[l.seller_id]}${tags}`);
  console.log(`      https://tuslibros.cl/libro/${U[l.seller_id]}/${l.slug}`);
}

// ── 2. Muy bajo la mediana del mismo título ──
P("PRECIO ANÓMALO vs. MISMO TÍTULO EN LA PLATAFORMA");
const byTitle = new Map();
for (const l of withBook) {
  const k = normalizeIsbn(l.book.isbn) || normalizeTitle(l.book.title);
  if (!k) continue;
  if (!byTitle.has(k)) byTitle.set(k, []);
  byTitle.get(k).push(l);
}
let anomalos = 0;
for (const [, group] of byTitle) {
  if (group.length < 2) continue;
  const med = median(group.map((l) => l.price ?? 0));
  if (!med) continue;
  for (const l of group) {
    const dev = ((med - (l.price ?? 0)) / med) * 100;
    if (dev > DEVIATION_PCT && (l.price ?? 0) >= MIN_PRICE) {
      anomalos++;
      console.log(
        `  ${clp(l.price)} vs mediana ${clp(med)} (−${Math.round(dev)}%) · ${(l.book.title ?? "").slice(0, 44)} · @${U[l.seller_id]}`
      );
      console.log(`      https://tuslibros.cl/libro/${U[l.seller_id]}/${l.slug}`);
    }
  }
}
if (!anomalos) console.log("  Ninguno.");

// ── 3. Duplicados del mismo vendedor ──
P("DUPLICADOS DEL MISMO VENDEDOR");
const bySeller = new Map();
for (const l of withBook) {
  if (!bySeller.has(l.seller_id)) bySeller.set(l.seller_id, []);
  bySeller.get(l.seller_id).push(l);
}
let grupos = 0;
let dupTotal = 0;
for (const [sellerId, items] of bySeller) {
  const seen = new Set();
  for (let i = 0; i < items.length; i++) {
    if (seen.has(items[i].id)) continue;
    const group = [items[i]];
    for (let j = i + 1; j < items.length; j++) {
      if (seen.has(items[j].id)) continue;
      const a = items[i].book;
      const b = items[j].book;
      const sameIsbn =
        normalizeIsbn(a.isbn) && normalizeIsbn(a.isbn) === normalizeIsbn(b.isbn);
      const sim = titleSimilarity(a.title, b.title);
      const sameAuthor =
        !a.author || !b.author ? true : titleSimilarity(a.author, b.author) > 0.7;
      const otroTomo = differentVolume(a.title, b.title);
      if (!otroTomo && (sameIsbn || (sim >= SIMILARITY && sameAuthor))) {
        group.push(items[j]);
        seen.add(items[j].id);
      }
    }
    if (group.length > 1) {
      grupos++;
      dupTotal += group.length - 1;
      const mismaFicha = new Set(group.map((g) => g.book.id)).size === 1;
      console.log(
        `\n  @${U[sellerId]} — ${group.length} publicaciones del mismo libro` +
          (mismaFicha ? "  ⚠️ TODAS apuntan a la MISMA ficha de libro" : "")
      );
      for (const g of group) {
        console.log(`     ${clp(g.price)} · ${(g.created_at ?? "").slice(0, 10)} · "${(g.book.title ?? "").slice(0, 44)}"`);
        console.log(`        https://tuslibros.cl/libro/${U[sellerId]}/${g.slug}`);
      }
    }
  }
}
if (!grupos) console.log("  Ninguno.");
else console.log(`\n  ${grupos} grupos · ${dupTotal} publicaciones sobrantes`);

// ── 4. Sospechosas que además están en colecciones curadas ──
P("SOSPECHOSAS QUE ESTÁN EN CARRUSELES CURADOS");
const sospechosas = new Set(bajos.map((l) => l.id));
const curadas = withBook.filter((l) => sospechosas.has(l.id) && (l.book.tags ?? []).length > 0);
if (!curadas.length) console.log("  Ninguna.");
for (const l of curadas) {
  console.log(
    `  ${clp(l.price)} · ${(l.book.title ?? "").slice(0, 44)} · en: ${l.book.tags.join(", ")} · @${U[l.seller_id]}`
  );
}

console.log("\n✅ reporte listo — no se modificó nada");
