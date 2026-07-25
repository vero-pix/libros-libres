/**
 * Detecta listings enlazados a la ficha de libro EQUIVOCADA.
 *
 *   node scripts/_audit_ficha_slug.mjs
 *
 * El slug se genera desde el título que el vendedor escribió al publicar
 * (`slugify(bookTitle)`), así que es un testigo de lo que él creía estar
 * publicando. Si el slug no se parece al título de la ficha asociada, el
 * listing quedó colgando del libro equivocado.
 *
 * SOLO REPORTA. No corrige nada.
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

/** Bajo esta similitud entre slug y título de ficha, sospechamos. */
const UMBRAL = 0.55;

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Quita el sufijo aleatorio anti-colisión que agrega PublishForm: "-lvwc". */
const slugLimpio = (slug) => norm(slug).replace(/\s+[a-z0-9]{4}$/, "");

function similitud(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const big = (s) => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) ?? 0) + 1);
    return m;
  };
  const bx = big(x);
  const by = big(y);
  let hits = 0;
  bx.forEach((n, g) => { hits += Math.min(n, by.get(g) ?? 0); });
  let total = 0;
  bx.forEach((n) => { total += n; });
  by.forEach((n) => { total += n; });
  return total ? (2 * hits) / total : 0;
}

/** ¿El slug está contenido en el título o viceversa? Cubre títulos recortados. */
function contenido(slug, titulo) {
  const s = slugLimpio(slug);
  const t = norm(titulo);
  if (!s || !t) return false;
  return t.startsWith(s.slice(0, Math.min(s.length, 25))) || s.startsWith(t.slice(0, Math.min(t.length, 25)));
}

// ── Cargar TODO (activos, pausados y vendidos: el enlace malo es igual de malo) ──
const all = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supa
    .from("listings")
    .select("id, slug, status, seller_id, created_at, book_id, book:books(id, title, author, isbn)")
    .range(from, from + 999);
  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  all.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}

const { data: users } = await supa.from("users").select("id, username, full_name");
const U = Object.fromEntries((users ?? []).map((u) => [u.id, u.username ?? u.full_name ?? u.id.slice(0, 8)]));

const conFicha = all.filter((l) => l.book && l.slug);
console.log(`Revisados: ${all.length} listings (${conFicha.length} con ficha y slug)\n`);

// ── Divergencia slug ↔ título de ficha ──
const sospechosos = [];
for (const l of conFicha) {
  const sim = similitud(slugLimpio(l.slug), l.book.title);
  if (sim < UMBRAL && !contenido(l.slug, l.book.title)) {
    sospechosos.push({ ...l, sim });
  }
}
sospechosos.sort((a, b) => a.sim - b.sim);

console.log(`━━━━━━ LISTINGS CON SLUG QUE NO CALZA CON SU FICHA ━━━━━━`);
console.log(`${sospechosos.length} casos (umbral de similitud ${UMBRAL})\n`);
for (const l of sospechosos) {
  console.log(`  sim ${l.sim.toFixed(2)} · @${U[l.seller_id]} · ${l.status} · ${l.created_at.slice(0, 10)}`);
  console.log(`      slug dice:  ${l.slug}`);
  console.log(`      ficha dice: "${l.book.title}" — ${l.book.author ?? "?"} · isbn ${l.book.isbn ?? "NULL"}`);
  console.log(`      listing ${l.id}  ·  ficha ${l.book_id}`);
}

// ── Fichas compartidas por varios listings del MISMO vendedor con slugs distintos ──
console.log(`\n━━━━━━ FICHAS COMPARTIDAS CON SLUGS DIVERGENTES (mismo vendedor) ━━━━━━`);
const porVendedorFicha = new Map();
for (const l of conFicha) {
  const k = `${l.seller_id}|${l.book_id}`;
  if (!porVendedorFicha.has(k)) porVendedorFicha.set(k, []);
  porVendedorFicha.get(k).push(l);
}
let grupos = 0;
for (const [k, arr] of porVendedorFicha) {
  if (arr.length < 2) continue;
  const bases = new Set(arr.map((l) => slugLimpio(l.slug)));
  if (bases.size < 2) continue; // mismos slugs = duplicado legítimo, no enlace malo
  // ¿son slugs realmente distintos entre sí?
  const lista = [...bases];
  let distintos = false;
  for (let i = 0; i < lista.length; i++)
    for (let j = i + 1; j < lista.length; j++)
      if (similitud(lista[i], lista[j]) < 0.7) distintos = true;
  if (!distintos) continue;
  grupos++;
  const [sellerId] = k.split("|");
  const b = arr[0].book;
  console.log(`\n  @${U[sellerId]} — ${arr.length} listings en la ficha "${b.title}" (isbn ${b.isbn ?? "NULL"})`);
  console.log(`     ficha ${b.id}`);
  for (const l of arr) console.log(`     ${l.created_at.slice(0, 19)} · ${l.status} · ${l.slug}  [${l.id}]`);
}
if (!grupos) console.log("  Ninguno.");

// ── Fichas con ISBN repetido entre libros de títulos distintos ──
console.log(`\n━━━━━━ ISBN COMPARTIDO POR FICHAS DE TÍTULOS DISTINTOS ━━━━━━`);
const { data: books } = await supa.from("books").select("id, title, isbn").not("isbn", "is", null);
const porIsbn = new Map();
for (const b of books ?? []) {
  const k = String(b.isbn).replace(/[^0-9xX]/g, "").toUpperCase();
  if (!k) continue;
  if (!porIsbn.has(k)) porIsbn.set(k, []);
  porIsbn.get(k).push(b);
}
let choques = 0;
porIsbn.forEach((arr, isbn) => {
  if (arr.length < 2) return;
  const titulos = [...new Set(arr.map((b) => norm(b.title)))];
  if (titulos.length < 2) return;
  choques++;
  console.log(`\n  isbn ${isbn}:`);
  for (const b of arr) console.log(`     "${b.title}"  [${b.id}]`);
});
if (!choques) console.log("  Ninguno.");

console.log(`\n✅ reporte listo — no se modificó nada`);
