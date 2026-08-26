/**
 * Informe de demanda no servida — qué pide la gente que NO tenemos.
 *
 * Cruza dos señales:
 *   1. `book_requests` abiertos que no tienen calce en el catálogo activo.
 *   2. `search_queries` con `has_results = false` — búsquedas que no devolvieron nada.
 *
 * Sale un informe listo para mandarle a un vendedor tal cual: "esto me lo están
 * pidiendo, ¿tienes alguno?".
 *
 *   node scripts/demanda-no-servida.mjs            → últimos 30 días
 *   node scripts/demanda-no-servida.mjs --dias 90  → otra ventana
 *   node scripts/demanda-no-servida.mjs --guardar  → escribe el .md
 *
 * ⚠️ PRIVACIDAD: `requester_email` y `requester_whatsapp` son datos de terceros.
 * Este informe NO los toca — está pensado para reenviarse a vendedores.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { normalizar, compararLibro } from "../lib/bookRequestMatch.ts";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : d;
};
const DIAS = parseInt(arg("--dias", "30"), 10);
const GUARDAR = process.argv.includes("--guardar");
const desde = new Date(Date.now() - DIAS * 86400000).toISOString();

async function pag(tabla, cols, extra) {
  const out = [];
  for (let f = 0; ; f += 1000) {
    let q = s.from(tabla).select(cols).range(f, f + 999);
    if (extra) q = extra(q);
    const { data, error } = await q;
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

// ── Catálogo activo, para saber qué SÍ tenemos ──
const catalogo = await pag(
  "listings",
  "id, book:books(title, author)",
  (q) => q.eq("status", "active")
);
const cat = catalogo.map((l) => ({
  t: normalizar(l.book?.title),
  a: normalizar(l.book?.author),
}));

const tenemos = (titulo, autor) => {
  const nT = normalizar(titulo);
  const nA = normalizar(autor);
  return cat.some((c) => compararLibro(nT, c.t, nA, c.a).hay);
};

// ── 1. Pedidos del "Se busca" sin calce ──
const pedidos = await pag("book_requests", "title, author, created_at, fulfilled", (q) =>
  q.eq("fulfilled", false)
);
const pedidosSinCalce = pedidos.filter((p) => !tenemos(p.title, p.author));

// Agrupar pedidos equivalentes (mismo título normalizado)
const grupos = new Map();
for (const p of pedidosSinCalce) {
  const clave = normalizar(p.title);
  if (!clave) continue;
  if (!grupos.has(clave)) {
    grupos.set(clave, { titulo: p.title, autor: p.author, veces: 0, ultima: p.created_at });
  }
  const g = grupos.get(clave);
  g.veces++;
  if (p.created_at > g.ultima) g.ultima = p.created_at;
  if (!g.autor && p.author) g.autor = p.author;
}

// ── 2. Búsquedas sin resultado ──
const busquedas = await pag(
  "search_queries",
  "query, normalized_query, created_at",
  (q) => q.eq("has_results", false).gte("created_at", desde)
);

// ── Ruido a descartar ──
//
// Los tags de cada libro se muestran como enlaces a /search, y el registro de
// búsquedas corre en el Server Component de esa página: cada crawler que sigue
// un tag queda anotado como si fuera una persona buscando. Por eso el listado
// venía lleno de "FICTION", "Juvenile Nonfiction" o "Ayla (Fictitious
// character)" — categorías de metadatos de Google Books, no demanda real.
//
// El filtro compara contra los tags y categorías que existen de verdad en la
// base: si el término es exactamente uno de ellos, es navegación, no búsqueda.
const BASURA = /^[\s\d]*$|^.{1,3}$|select |union |<script|http/i;

const libros = await pag("books", "tags, category, subcategory, genre");
const NAVEGACION = new Set();
for (const b of libros) {
  for (const t of b.tags ?? []) NAVEGACION.add(String(t).toLowerCase().trim());
  for (const c of [b.category, b.subcategory, b.genre]) {
    if (c) NAVEGACION.add(String(c).toLowerCase().trim());
  }
}
const porBusqueda = new Map();
let descartadasPorTag = 0;
for (const b of busquedas) {
  const clave = (b.normalized_query || b.query || "").toLowerCase().trim();
  if (!clave || BASURA.test(clave)) continue;
  if (NAVEGACION.has(clave)) { descartadasPorTag++; continue; }
  if (!porBusqueda.has(clave)) porBusqueda.set(clave, { texto: b.query, veces: 0 });
  porBusqueda.get(clave).veces++;
}
// Descartar las que sí tenemos (el buscador pudo fallar por otra razón)
const busquedasReales = [...porBusqueda.values()]
  .filter((b) => !tenemos(b.texto, ""))
  .sort((a, b) => b.veces - a.veces || a.texto.localeCompare(b.texto));

// ── Salida ──
const pedidosOrdenados = [...grupos.values()].sort(
  (a, b) => b.veces - a.veces || b.ultima.localeCompare(a.ultima)
);

const L = [];
const p = (t = "") => L.push(t);

p(`# Lo que me están pidiendo y no tengo`);
p();
p(`_Ventana: últimos ${DIAS} días · generado el ${new Date().toISOString().slice(0, 10)}_`);
p();
p(`Catálogo activo: ${catalogo.length} libros.`);
p();
p(`## Pedidos directos sin cubrir (${pedidosOrdenados.length})`);
p();
p(`Gente que entró a tuslibros.cl, escribió el título exacto que buscaba y se fue con las manos vacías.`);
p();
if (pedidosOrdenados.length) {
  p(`| Libro | Autor | Veces pedido |`);
  p(`|---|---|---:|`);
  for (const g of pedidosOrdenados) {
    p(`| ${(g.titulo ?? "").replace(/\|/g, "/")} | ${(g.autor ?? "—").replace(/\|/g, "/")} | ${g.veces} |`);
  }
} else {
  p(`_Ninguno: todo lo pedido está en catálogo._`);
}
p();
p(`## Búsquedas que no devolvieron nada (top 40)`);
p();
p(`Nadie escribió esto en el "Se busca" — lo buscaron en el buscador y no había resultados.`);
p();
if (busquedasReales.length) {
  p(`| Búsqueda | Veces |`);
  p(`|---|---:|`);
  for (const b of busquedasReales.slice(0, 40)) {
    p(`| ${b.texto.replace(/\|/g, "/")} | ${b.veces} |`);
  }
  p();
  p(`_Total de búsquedas distintas sin resultado en la ventana: ${busquedasReales.length}, después de descartar ${descartadasPorTag} términos que son tags o categorías del propio catálogo (los siguen los crawlers, no son personas)._`);
} else {
  p(`_Sin datos en la ventana._`);
}

const texto = L.join("\n");
console.log(texto);

if (GUARDAR) {
  const ruta = `docs_desde_claude/demanda-no-servida-${new Date().toISOString().slice(0, 10)}.md`;
  fs.writeFileSync(ruta, texto + "\n");
  console.log(`\n\n📄 Guardado en ${ruta}`);
}
