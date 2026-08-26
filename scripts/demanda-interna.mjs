/**
 * Lo que la gente busca DENTRO del sitio y no encuentra.
 *
 * El informe hermano (`npm run demanda`) mira `book_requests` — lo que la gente
 * pide explícitamente llenando un formulario. Éste mira `search_queries`, que es
 * más honesto y mucho más grande: son las palabras que teclean sin pedirle
 * permiso a nadie, y la tabla guarda `results_count`, o sea si el buscador les
 * respondió algo o los dejó con la pantalla vacía.
 *
 * Nació de un caso concreto (26-08-2026): "algebra de baldor" se buscó 58 veces
 * y SIEMPRE devolvió cero, mientras el ejemplar estaba ahí, publicado, llamado
 * "Álgebra" a secas. Hay dos problemas distintos escondidos en la misma cifra:
 *
 *   NO LO TIENES     → conseguir el libro. Demanda real, sin catálogo detrás.
 *   SÍ LO TIENES     → está publicado y la búsqueda igual devolvió cero.
 *                      Es el más barato de arreglar y el más caro de ignorar.
 *
 *   node scripts/demanda-interna.mjs
 *   node scripts/demanda-interna.mjs --min 5    (umbral de búsquedas, default 3)
 *   node scripts/demanda-interna.mjs --dias 30  (default: todo el histórico)
 *
 * ⚠️ Sin --dias esto mezcla deuda vieja con demanda viva. Buena parte de los
 * ceros de abril-julio ya no se repiten: el buscador se arregló el 3 ago 2026 y
 * el catálogo creció. La tasa de búsquedas sin resultado bajó de 49% en julio a
 * 19% en agosto. Para decidir qué conseguir, correr con --dias 30.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const l of env.split("\n")) {
  if (l.startsWith("#") || !l.includes("=")) continue;
  const i = l.indexOf("=");
  const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const minIdx = process.argv.indexOf("--min");
const MIN = minIdx > -1 ? parseInt(process.argv[minIdx + 1], 10) : 3;
const diasIdx = process.argv.indexOf("--dias");
const DIAS = diasIdx > -1 ? parseInt(process.argv[diasIdx + 1], 10) : null;
const DESDE = DIAS ? new Date(Date.now() - DIAS * 86400000).toISOString() : null;

const STOPWORDS = new Set([
  "el","la","los","las","un","una","unos","unas","de","del","al","a","y","o","u",
  "en","con","por","para","sin","sobre","tras","que","se","su","sus","mi","mis",
  "lo","es","son","como","mas","más","este","esta","estos","estas","libro","libros",
]);
const fold = (x) => (x ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const terminos = (q) =>
  fold(q).replace(/[^a-z0-9ñ\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));

/**
 * Ruido: no todo lo que cae en `search_queries` lo escribió una persona.
 * Los strings con guiones son slugs de categoría o de ficha ("novela-negra",
 * "el-teorema-katherine") que entran por navegación, no por el buscador.
 */
const esRuido = (q) => /-/.test(q.trim()) || /^\s*$/.test(q);

async function pag(t, cols, extra) {
  const out = [];
  for (let f = 0; ; f += 1000) {
    let q = s.from(t).select(cols).range(f, f + 999);
    if (extra) q = extra(q);
    const { data, error } = await q;
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

const queries = await pag("search_queries", "query,results_count,created_at", (q) =>
  DESDE ? q.gte("created_at", DESDE) : q
);
const listings = await pag("listings", "id,slug,book:books(title,author)", (q) => q.eq("status", "active"));

const catalogo = listings.map((l) => ({
  slug: l.slug,
  titulo: fold(l.book?.title ?? ""),
  autor: fold(l.book?.author ?? ""),
  crudo: l.book?.title ?? "",
  autorCrudo: l.book?.author ?? "",
}));

const grupos = new Map();
for (const r of queries) {
  if (esRuido(r.query)) continue;
  const palabras = terminos(r.query);
  if (!palabras.length) continue;
  const clave = palabras.join(" ");
  const g = grupos.get(clave) ?? { n: 0, vacias: 0, ejemplo: r.query.trim(), palabras, ultima: r.created_at };
  g.n++;
  if (!r.results_count) g.vacias++;
  if (r.created_at > g.ultima) g.ultima = r.created_at;
  grupos.set(clave, g);
}

const noTienes = [], siTienes = [];
for (const [clave, g] of grupos) {
  if (g.vacias < MIN) continue; // solo las que dejaron a alguien con la pantalla vacía
  const calzan = catalogo.filter((c) =>
    g.palabras.every((w) => c.titulo.includes(w) || c.autor.includes(w))
  );
  if (calzan.length) siTienes.push({ ...g, clave, calzan });
  else noTienes.push({ ...g, clave });
}

const porVacias = (a, b) => b.vacias - a.vacias;
const totalVacias = queries.filter((r) => !r.results_count && !esRuido(r.query)).length;
const totalReales = queries.filter((r) => !esRuido(r.query)).length;

console.log(`\n═══ BÚSQUEDAS INTERNAS SIN RESULTADO ${DIAS ? `· últimos ${DIAS} días` : "· todo el histórico"} ═══`);
console.log(`${totalReales} búsquedas escritas · ${totalVacias} terminaron en cero (${(totalVacias / totalReales * 100).toFixed(0)}%)`);
console.log(`Umbral del informe: ${MIN}+ búsquedas vacías por término\n`);

console.log(`━━━ SÍ LO TIENES y el buscador igual dijo que no (${siTienes.length}) ━━━`);
console.log(`   Arreglo barato: el título del libro no contiene lo que la gente teclea.\n`);
siTienes.sort(porVacias).slice(0, 20).forEach((x) => {
  console.log(`  ${String(x.vacias).padStart(3)}× vacías  "${x.ejemplo}"`);
  x.calzan.slice(0, 3).forEach((c) => console.log(`              hay: "${c.crudo}" — ${c.autorCrudo} → /${c.slug}`));
});

console.log(`\n━━━ NO LO TIENES — demanda real sin catálogo detrás (${noTienes.length}) ━━━\n`);
noTienes.sort(porVacias).slice(0, 30).forEach((x) => {
  const dias = Math.round((Date.now() - new Date(x.ultima)) / 86400000);
  console.log(`  ${String(x.vacias).padStart(3)}×  ${x.ejemplo.padEnd(52)} (últ. hace ${dias}d)`);
});
