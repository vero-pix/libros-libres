/**
 * Backfill de books.category / books.subcategory para las fichas que quedaron
 * sin categoría (≈23% del catálogo activo a jul 2026).
 *
 *   npm run backfill-categorias            → DRY-RUN (no escribe nada)
 *   npm run backfill-categorias -- --write  → escribe en la BD
 *   npm run backfill-categorias -- --write --solo-alta   → escribe solo confianza alta
 *
 * Dos capas, en orden:
 *   1. HEURÍSTICA (gratis): autor conocido, señales del título, `genre` de la
 *      ficha vía lib/genreNormalizer. Resuelve la mayoría sin gastar un peso.
 *   2. CLAUDE (solo lo que quedó sin resolver): devuelve {category, subcategory,
 *      confidence} restringido al set de slugs válidos.
 *
 * Solo se escribe con confianza alta. Lo dudoso queda sin tocar para que Vero
 * lo resuelva en /admin/clasificador, que ya filtra por category null.
 *
 * ⚠️ Los slugs son los REALES de la tabla `categories` — los mismos que usan
 * las landings /categoria/[slug] y el filtro del home. NO los de lib/genres.ts,
 * que quedó en la taxonomía anterior.
 */
import Anthropic from "@anthropic-ai/sdk";
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

const ESCRIBIR = process.argv.includes("--write");
const SOLO_ALTA = process.argv.includes("--solo-alta");
const SIN_LLM = process.argv.includes("--sin-llm");

// ── Set de slugs válidos (padre → hijos). Espejo de la tabla `categories`. ──
const TAXONOMIA = {
  ficcion: ["ficcion-novela", "ficcion-poesia", "ficcion-policial", "ficcion-teatro"],
  "no-ficcion": [
    "no-ficcion-historia", "no-ficcion-ensayo", "no-ficcion-humanidades",
    "no-ficcion-ciencia", "no-ficcion-biografia", "no-ficcion-arte",
    "no-ficcion-economia", "no-ficcion-autoayuda",
  ],
  "infantil-juvenil": ["infantil-juvenil-infantil", "infantil-juvenil-juvenil"],
  academico: ["academico-universitario", "academico-escolar", "academico-manuales", "academico-tecnico"],
  idiomas: ["idiomas-ingles", "idiomas-frances", "idiomas-aleman", "idiomas-portugues", "idiomas-otros"],
  otros: ["otros-comics", "otros-revistas", "otros-enciclopedias", "otros-religion"],
};
const PADRE_DE = {};
for (const [padre, hijos] of Object.entries(TAXONOMIA)) {
  PADRE_DE[padre] = padre;
  for (const h of hijos) PADRE_DE[h] = padre;
}
const esValido = (cat, sub) =>
  !!TAXONOMIA[cat] && (!sub || TAXONOMIA[cat].includes(sub));

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // Sin puntuación: "E.L. James" y "E. L. James" deben calzar con "e l james".
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// ── CAPA 1: heurística ──

/** Autores cuya obra cae siempre en la misma categoría. */
const POR_AUTOR = [
  // Novela — comercial y literaria
  [["megan maxwell", "e l james", "el james", "danielle steel", "nicholas sparks", "corin tellado", "nora roberts", "julia quinn", "federico moccia"], "ficcion", "ficcion-novela"],
  [["isabel allende", "somerset maugham", "maugham", "gabriel garcia marquez", "mario vargas llosa", "julio cortazar", "jose donoso", "roberto bolano", "hermann hesse", "stefan zweig", "milan kundera", "paulo coelho", "ken follett", "javier marias", "carlos fuentes", "juan rulfo", "virginia woolf", "jane austen", "charles dickens", "victor hugo", "dostoievski", "tolstoi", "kafka", "camus", "sartre", "saramago", "umberto eco", "isabel coixet", "luis sepulveda", "marcela serrano", "hernan rivera letelier", "antonio skarmeta"], "ficcion", "ficcion-novela"],
  // Policial / suspenso
  [["agatha christie", "georges simenon", "simenon", "henning mankell", "jo nesbo", "andrea camilleri", "patricia highsmith", "stieg larsson", "arthur conan doyle", "conan doyle", "john le carre", "stephen coonts", "tom clancy", "frederick forsyth", "john grisham"], "ficcion", "ficcion-policial"],
  // Poesía
  [["pablo neruda", "gabriela mistral", "nicanor parra", "jorge teillier", "raul zurita", "gonzalo rojas", "vicente huidobro", "oscar castro", "federico garcia lorca", "walt whitman", "rainer maria rilke"], "ficcion", "ficcion-poesia"],
  // Teatro
  [["alejandro casona", "william shakespeare", "shakespeare", "moliere", "henrik ibsen", "bertolt brecht"], "ficcion", "ficcion-teatro"],
  // Infantil / juvenil
  [["marcela paz", "roald dahl", "hans christian andersen", "hermanos grimm", "beatrix potter", "dr seuss", "jeff kinney", "rick riordan", "j k rowling", "jk rowling", "stephenie meyer", "john green", "brigid kemmerer"], "infantil-juvenil", "infantil-juvenil-juvenil"],
  // Autoayuda / espiritualidad
  [["jorge bucay", "walter riso", "louise hay", "deepak chopra", "robin sharma", "dale carnegie", "napoleon hill", "brian tracy"], "no-ficcion", "no-ficcion-autoayuda"],
  // Ciencia y divulgación
  [["carl sagan", "stephen hawking", "richard dawkins", "yuval noah harari", "oliver sacks", "isaac asimov"], "no-ficcion", "no-ficcion-ciencia"],
  // Historia
  [["benjamin vicuna mackenna", "sergio villalobos", "gabriel salazar", "jose bengoa", "alfredo jocelyn-holt", "ascanio cavallo", "patricia verdugo"], "no-ficcion", "no-ficcion-historia"],
  // Humanidades / filosofía
  [["michel foucault", "foucault", "hannah arendt", "friedrich nietzsche", "nietzsche", "platon", "aristoteles", "seneca", "immanuel kant", "erich fromm", "zygmunt bauman", "byung-chul han", "francisco varela"], "no-ficcion", "no-ficcion-humanidades"],
  // Economía
  [["adam smith", "thomas piketty", "milton friedman", "john maynard keynes", "philip kotler", "michael porter"], "no-ficcion", "no-ficcion-economia"],
];

/** Señales en el título. El orden importa: lo más específico primero. */
const POR_TITULO = [
  [/\b(diccionario|gramatica|gramática)\b.*\b(ingles|inglés|frances|francés|aleman|alemán|portugues|portugués)\b/i, "idiomas", "idiomas-otros"],
  [/\b(english|grammar|teen club|new interchange|headway)\b/i, "idiomas", "idiomas-ingles"],
  [/\bdiccionario\b/i, "otros", "otros-enciclopedias"],
  [/\benciclopedi/i, "otros", "otros-enciclopedias"],
  [/\brevista\b/i, "otros", "otros-revistas"],
  [/\b(biblia|evangelio|catecismo|oracion(es)?|espiritualidad|budismo|teolog)/i, "otros", "otros-religion"],
  [/\b(manga|comic|cómic|historieta|mafalda|condorito)\b/i, "otros", "otros-comics"],
  [/\b(\d°|\d º)?\s*(basico|básico|medio)\b.*\b(matematica|lenguaje|historia|ciencias|ingles)\b/i, "academico", "academico-escolar"],
  [/\btexto (escolar|del estudiante)\b/i, "academico", "academico-escolar"],
  [/\b(manual|tratado|introduccion a la|fundamentos de|principios de)\b/i, "academico", "academico-manuales"],
  [/\b(derecho|codigo civil|código civil|procesal|constitucional)\b/i, "academico", "academico-universitario"],
  [/\b(anatomia|anatomía|fisiologia|fisiología|medicina interna|farmacolog)/i, "academico", "academico-universitario"],
  [/\b(calculo|cálculo|algebra|álgebra|termodinamica|termodinámica|circuitos)\b/i, "academico", "academico-universitario"],
  [/\bhistoria (de|del|universal|contemporanea|contemporánea)\b/i, "no-ficcion", "no-ficcion-historia"],
  [/\b(memorias?|biografia|biografía|vida de)\b/i, "no-ficcion", "no-ficcion-biografia"],
  [/\b(poemas?|poesia|poesía|antologia poetica|cantos?)\b/i, "ficcion", "ficcion-poesia"],
  [/\b(cuentos? (infantiles|para ninos|para niños)|caperucita|pinocho|patito feo)\b/i, "infantil-juvenil", "infantil-juvenil-infantil"],
  [/\b(arte|pintura|fotografia|fotografía|arquitectura|escultura)\b/i, "no-ficcion", "no-ficcion-arte"],
  [/\b(economia|economía|finanzas|marketing|administracion de empresas)\b/i, "no-ficcion", "no-ficcion-economia"],
  [/\b(filosofia|filosofía|sociologia|sociología|antropolog|psicoanalis)/i, "no-ficcion", "no-ficcion-humanidades"],
  [/\b(novela|saga)\b/i, "ficcion", "ficcion-novela"],
];

/** El campo `genre` de la ficha, cuando viene con algo usable. */
const POR_GENRE = [
  [/novela histor/i, "ficcion", "ficcion-novela"],
  [/novela|literatura|fiction|narrativa/i, "ficcion", "ficcion-novela"],
  [/poes|poetry/i, "ficcion", "ficcion-poesia"],
  [/teatro|drama/i, "ficcion", "ficcion-teatro"],
  [/policial|crime|thriller|terror|misterio|suspen/i, "ficcion", "ficcion-policial"],
  [/ciencia ficcion|ciencia ficción|science fiction|fantas/i, "ficcion", "ficcion-novela"],
  [/histor|history/i, "no-ficcion", "no-ficcion-historia"],
  [/biograf|biographies|memoir/i, "no-ficcion", "no-ficcion-biografia"],
  [/ensayo|criticism|interpretation/i, "no-ficcion", "no-ficcion-ensayo"],
  [/cienc|science|natural/i, "no-ficcion", "no-ficcion-ciencia"],
  [/filosof|sociolog|antropolog|psicolog/i, "no-ficcion", "no-ficcion-humanidades"],
  [/arte|art\b|fotograf/i, "no-ficcion", "no-ficcion-arte"],
  [/econom|business|negocio/i, "no-ficcion", "no-ficcion-economia"],
  [/autoayuda|self-help|superacion/i, "no-ficcion", "no-ficcion-autoayuda"],
  [/infantil|juvenil|children|young adult/i, "infantil-juvenil", "infantil-juvenil-juvenil"],
  [/enciclopedi/i, "otros", "otros-enciclopedias"],
  [/ingles|inglés|english|idioma/i, "idiomas", "idiomas-ingles"],
  [/religio|espiritual/i, "otros", "otros-religion"],
];

function heuristica(book) {
  const autor = norm(book.author);
  const titulo = String(book.title ?? "");

  for (const [autores, cat, sub] of POR_AUTOR) {
    if (autores.some((a) => autor.includes(a))) {
      return { category: cat, subcategory: sub, confidence: "alta", via: "autor" };
    }
  }
  for (const [re, cat, sub] of POR_TITULO) {
    if (re.test(titulo)) {
      return { category: cat, subcategory: sub, confidence: "alta", via: "titulo" };
    }
  }
  if (book.genre) {
    for (const [re, cat, sub] of POR_GENRE) {
      if (re.test(book.genre)) {
        return { category: cat, subcategory: sub, confidence: "media", via: "genre" };
      }
    }
  }
  return null;
}

// ── CAPA 2: Claude, solo para lo que quedó sin resolver ──
const SLUGS_VALIDOS = Object.entries(TAXONOMIA)
  .map(([p, h]) => `${p}: ${h.join(", ")}`)
  .join("\n");

/**
 * Esquema de salida forzado: la respuesta se valida contra esto, así que no hay
 * que parsear texto libre ni rezar para que devuelva JSON bien formado.
 */
const ESQUEMA = {
  type: "object",
  properties: {
    resultados: {
      type: "array",
      items: {
        type: "object",
        properties: {
          n: { type: "integer" },
          category: { type: "string", enum: Object.keys(TAXONOMIA) },
          subcategory: { type: "string", enum: Object.values(TAXONOMIA).flat() },
          confidence: { type: "string", enum: ["alta", "media", "baja"] },
        },
        required: ["n", "category", "subcategory", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["resultados"],
  additionalProperties: false,
};

const anthropic = env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null;

async function clasificarConClaude(lote) {
  if (!anthropic) return [];

  const listado = lote
    .map((b, i) => `${i + 1}. "${b.title ?? ""}" — ${b.author ?? "autor desconocido"}${b.publisher ? ` (${b.publisher})` : ""}`)
    .join("\n");

  try {
    const res = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 8000,
      output_config: {
        effort: "low", // clasificar por título y autor es tarea simple
        format: { type: "json_schema", schema: ESQUEMA },
      },
      messages: [
        {
          role: "user",
          content: `Clasifica cada libro en la taxonomía de un marketplace chileno de libros usados.

Taxonomía válida (categoría padre: subcategorías):
${SLUGS_VALIDOS}

Libros:
${listado}

Devuelve un objeto con "resultados": un elemento por libro, con "n" = el número de la lista.
- "confidence": "alta" si reconoces el libro o al autor con seguridad; "media" si lo deduces del título; "baja" si estás adivinando.
- La subcategoría debe pertenecer a la categoría que elijas.`,
        },
      ],
    });

    // OJO: con thinking adaptivo el primer bloque puede ser de razonamiento,
    // no de texto. Buscar el bloque de texto en vez de asumir content[0].
    const texto = res.content.find((b) => b.type === "text")?.text ?? "";
    if (!texto) return [];
    const datos = JSON.parse(texto);
    return datos.resultados ?? [];
  } catch (err) {
    console.error(`  ⚠️ ${err?.status ?? ""} ${err?.message?.slice(0, 140) ?? err}`);
    return [];
  }
}

// ─────────────────────────── MAIN ───────────────────────────

// ── Validación dura: la taxonomía del script debe calzar con la tabla real ──
// Si alguien agrega/renombra una categoría en Supabase y el script queda
// desfasado, preferimos abortar antes que escribir slugs malformados.
{
  const { data: reales, error } = await supa.from("categories").select("slug, parent_slug");
  if (error) { console.error("No pude leer la tabla categories:", error.message); process.exit(1); }
  const validos = new Set((reales ?? []).map((c) => c.slug));
  const padreReal = Object.fromEntries((reales ?? []).map((c) => [c.slug, c.parent_slug]));
  const problemas = [];
  for (const [padre, hijos] of Object.entries(TAXONOMIA)) {
    if (!validos.has(padre)) problemas.push(`padre "${padre}" no existe en categories`);
    for (const h of hijos) {
      if (!validos.has(h)) problemas.push(`subcategoría "${h}" no existe en categories`);
      else if (padreReal[h] !== padre) problemas.push(`"${h}" cuelga de "${padreReal[h]}" en la BD, no de "${padre}"`);
    }
  }
  if (problemas.length) {
    console.error("✗ La taxonomía del script no calza con la BD:");
    problemas.forEach((p) => console.error("   " + p));
    process.exit(1);
  }
  console.log(`✓ Taxonomía validada contra la BD: ${validos.size} slugs reales\n`);
}

console.log(ESCRIBIR ? "MODO ESCRITURA — se van a modificar datos" : "DRY-RUN — no se escribe nada");
console.log(`Umbral: ${SOLO_ALTA ? "solo confianza alta" : "alta y media"}${SIN_LLM ? " · sin capa Claude" : ""}\n`);

const listings = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supa
    .from("listings")
    .select("id, seller_id, book:books(id, title, author, publisher, genre, category, subcategory)")
    .eq("status", "active")
    .range(from, from + 999);
  if (error) { console.error("Error:", error.message); process.exit(1); }
  listings.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}

const fichas = new Map();
for (const l of listings) {
  if (l.book && !l.book.category) fichas.set(l.book.id, l.book);
}
console.log(`Listings activos: ${listings.length} · fichas sin categoría: ${fichas.size}\n`);

const propuestas = [];
const sinResolver = [];

for (const book of fichas.values()) {
  const h = heuristica(book);
  if (h) propuestas.push({ book, ...h });
  else sinResolver.push(book);
}

console.log(`Capa 1 (heurística): ${propuestas.length} resueltas · ${sinResolver.length} pendientes`);

if (sinResolver.length && !SIN_LLM) {
  const TAM = 40;
  for (let i = 0; i < sinResolver.length; i += TAM) {
    const lote = sinResolver.slice(i, i + TAM);
    process.stdout.write(`  Claude: lote ${Math.floor(i / TAM) + 1}/${Math.ceil(sinResolver.length / TAM)}… `);
    const res = await clasificarConClaude(lote);
    let ok = 0;
    for (const r of res) {
      const book = lote[(r.n ?? 0) - 1];
      if (!book) continue;
      if (!esValido(r.category, r.subcategory)) continue;
      propuestas.push({ book, category: r.category, subcategory: r.subcategory, confidence: r.confidence ?? "baja", via: "claude" });
      ok++;
    }
    console.log(`${ok}/${lote.length}`);
  }
}

// ── Reporte ──
const porVia = {};
const porConf = {};
const porCat = {};
for (const p of propuestas) {
  porVia[p.via] = (porVia[p.via] ?? 0) + 1;
  porConf[p.confidence] = (porConf[p.confidence] ?? 0) + 1;
  const k = p.subcategory ?? p.category;
  porCat[k] = (porCat[k] ?? 0) + 1;
}

console.log(`\n━━━━━━ PROPUESTA: ${propuestas.length} de ${fichas.size} fichas ━━━━━━`);
console.log("por método:", JSON.stringify(porVia));
console.log("por confianza:", JSON.stringify(porConf));
console.log("\npor categoría destino:");
Object.entries(porCat).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));

if (process.argv.includes("--ver-dificiles")) {
  const claves = ["ciam", "vaticano", "cinema", "cinéma", "giedion", "frei montalva", "salgari", "lebret", "catalogo general", "catálogo general", "biblicas", "bíblicas"];
  console.log("\n━━━━━━ LAS DIFÍCILES ━━━━━━");
  for (const p of propuestas) {
    const t = `${p.book.title ?? ""} ${p.book.author ?? ""}`.toLowerCase();
    if (claves.some((k) => t.includes(k))) {
      console.log(`  [${p.confidence}] "${(p.book.title ?? "").slice(0, 52)}" — ${(p.book.author ?? "").slice(0, 26)}`);
      console.log(`       → ${p.category} / ${p.subcategory}`);
    }
  }
}

console.log("\n━━━━━━ MUESTRA AL AZAR (20) ━━━━━━");
const mezcla = [...propuestas].sort(() => (propuestas.length % 2 ? 1 : -1));
const paso = Math.max(1, Math.floor(propuestas.length / 20));
for (let i = 0; i < propuestas.length && i / paso < 20; i += paso) {
  const p = propuestas[i];
  console.log(`  [${p.confidence}/${p.via}] "${(p.book.title ?? "").slice(0, 42)}" — ${(p.book.author ?? "?").slice(0, 24)}`);
  console.log(`       → ${p.category} / ${p.subcategory}`);
}

// Cobertura: qué propuestas caen en una categoría SIN landing publicada.
const CON_LANDING = new Set([
  "ficcion", "ficcion-novela", "ficcion-poesia", "ficcion-policial",
  "no-ficcion", "no-ficcion-historia", "no-ficcion-ensayo", "no-ficcion-humanidades",
  "no-ficcion-ciencia", "no-ficcion-biografia", "no-ficcion-arte",
  "infantil-juvenil", "academico-universitario", "academico-escolar",
  "academico-manuales", "idiomas", "otros", "academico",
]);
const sinLanding = propuestas.filter((p) => !CON_LANDING.has(p.category) && !CON_LANDING.has(p.subcategory ?? ""));
if (sinLanding.length) {
  console.log(`\n⚠️  ${sinLanding.length} quedarán bien clasificadas pero SIN landing que las muestre:`);
  const porCat2 = {};
  for (const p of sinLanding) porCat2[p.subcategory ?? p.category] = (porCat2[p.subcategory ?? p.category] ?? 0) + 1;
  Object.entries(porCat2).forEach(([k, v]) => console.log(`     ${String(v).padStart(3)}  ${k}`));
  console.log("     (falta crear /categoria/otros — se puede agregar a categorias.config.ts)");
}

const noResueltas = fichas.size - propuestas.length;
if (noResueltas > 0) {
  console.log(`\n━━━━━━ SIN CLASIFICAR: ${noResueltas} ━━━━━━`);
  console.log("  Quedan con category null para revisión en /admin/clasificador.");
  const resueltas = new Set(propuestas.map((p) => p.book.id));
  const pendientes = [...fichas.values()].filter((b) => !resueltas.has(b.id));
  if (process.argv.includes("--listar-pendientes")) {
    for (const b of pendientes) console.log(`    "${(b.title ?? "").slice(0, 50)}" — ${(b.author ?? "?").slice(0, 30)}`);
  }
}

// ── Escritura ──
if (!ESCRIBIR) {
  console.log("\n✅ dry-run listo — no se modificó nada. Para escribir: npm run backfill-categorias -- --write");
  process.exit(0);
}

// Cada propuesta, una por una, contra el set válido. Nada malformado pasa.
const malformadas = propuestas.filter((p) => !esValido(p.category, p.subcategory));
if (malformadas.length) {
  console.error(`\n✗ ${malformadas.length} propuestas malformadas — se abortó sin escribir:`);
  malformadas.forEach((p) => console.error(`   ${p.category}/${p.subcategory} · "${p.book.title}"`));
  process.exit(1);
}
console.log(`\n✓ Las ${propuestas.length} propuestas usan slugs válidos`);

const aEscribir = propuestas.filter((p) => (SOLO_ALTA ? p.confidence === "alta" : p.confidence !== "baja"));
console.log(`\n━━━━━━ ESCRIBIENDO ${aEscribir.length} fichas ━━━━━━`);
let ok = 0, fallos = 0;
for (const p of aEscribir) {
  const { error } = await supa
    .from("books")
    .update({ category: p.category, subcategory: p.subcategory })
    .eq("id", p.book.id);
  if (error) { fallos++; console.error(`  ✗ ${p.book.title}: ${error.message}`); }
  else ok++;
}
console.log(`  ✓ ${ok} actualizadas · ${fallos} fallos`);

const { count } = await supa.from("books").select("*", { count: "exact", head: true }).is("category", null);
console.log(`\nFichas con category null en toda la tabla books: ${count}`);
console.log("✅ backfill listo");
