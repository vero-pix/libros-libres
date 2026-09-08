#!/usr/bin/env node
/**
 * Candidatos a página de autor (/autor/[slug]) — andamiaje, no configuración.
 *
 * Lista los autores con catálogo suficiente para sostener una página, con el
 * slug propuesto y la variante EXACTA del nombre en `books.author`, que es lo
 * que hay que pegar en `dbAuthors` de authors.config.ts. No escribe nada: la
 * decisión de cuáles valen la pena y los textos editoriales son de Vero.
 *
 *   node scripts/autores-candidatos.mjs              umbral 8 libros
 *   node scripts/autores-candidatos.mjs --min 5      baja el umbral
 *   node scripts/autores-candidatos.mjs --excluidos  muestra qué se descartó y por qué
 *   node scripts/autores-candidatos.mjs --json       salida para pegar en el config
 *
 * Por qué 8 y no 3: con 3 libros la página es contenido delgado y se vacía en
 * cuanto se venden dos. Ver el diagnóstico del 08-09-2026.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const args = process.argv.slice(2);
const opcion = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const MIN = Number(opcion("min", 8));

/* ─────────────────────── qué NO es un autor ─────────────────────── */

/** Colectivos y marcadores de posición: no son personas. */
const GENERICOS = new Set(["varios", "varios autores", "vv aa", "vv.aa.", "aa vv", "aa.vv.", "anonimo", "anónimo", "desconocido", "sin autor", "autores varios", "colectivo"]);

/**
 * Listas de participantes: antologías, compilaciones y créditos completos
 * volcados al campo autor. Si se cuelan, la página de alguien se llena de libros
 * que no son suyos.
 *
 * El caso que obliga a ser estricto: "Plinio Apuleyo Mendoza | Carlos Montaner |
 * Álvaro Vargas Llosa" NO es Mario Vargas Llosa, es su hijo. Una búsqueda por
 * apellido lo mete en la página equivocada.
 */
function motivoDescarte(nombre) {
  const n = nombre.trim();
  const plano = n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  if (GENERICOS.has(plano)) return "colectivo o marcador de posición";
  if (n.length > 60) return `demasiado largo (${n.length} caracteres): son créditos, no un autor`;
  if (n.includes("|")) return "varios nombres separados por barra";
  if (/^(entrevistados|compilad|editad|traducid|prologad|selecci)/i.test(n)) return "créditos de edición, no autoría";
  if (/\by\s+[A-ZÁÉÍÓÚÑ]/.test(n) && n.includes(",")) return "lista de participantes";
  // Dos comas o más siempre es enumeración. Una sola coma puede ser el formato
  // "Apellido, Nombre", que sí es un autor.
  const comas = (n.match(/,/g) || []).length;
  if (comas >= 2) return "enumeración de autores";
  if (comas === 1 && n.split(",")[1].trim().split(/\s+/).length > 2) return "dos autores separados por coma";
  if (/\(ed\.?\)|\(comp\.?\)|\(coord\.?\)/i.test(n)) return "marcado como editor o compilador";
  return null;
}

/** "María Luisa Bombal" → "maria-luisa-bombal" */
function aSlug(nombre) {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ─────────────────────── datos ─────────────────────── */

// Supabase corta en 1.000 filas: hay que paginar o el conteo sale mutilado.
const filas = [];
for (let desde = 0; ; desde += 1000) {
  const { data, error } = await admin
    .from("listings")
    .select("id, seller_id, book:books!inner(author)")
    .eq("status", "active")
    .range(desde, desde + 999);
  if (error) {
    console.error("Error al leer listings:", error.message);
    process.exit(1);
  }
  filas.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}

// Se agrupa por el string EXACTO, sin normalizar: es lo que va en dbAuthors.
const porString = new Map();
for (const f of filas) {
  const libro = Array.isArray(f.book) ? f.book[0] : f.book;
  const autor = libro?.author;
  if (!autor || !autor.trim()) continue;
  if (!porString.has(autor)) porString.set(autor, { exacto: autor, libros: 0, vendedores: new Set() });
  const e = porString.get(autor);
  e.libros++;
  e.vendedores.add(f.seller_id);
}

// Variantes del mismo autor (espacios sobrantes, mayúsculas) se suman bajo un
// slug común, pero conservando cada string por separado para dbAuthors.
const porSlug = new Map();
for (const e of porString.values()) {
  const descarte = motivoDescarte(e.exacto);
  const slug = aSlug(e.exacto);
  if (!slug) continue;
  if (!porSlug.has(slug)) porSlug.set(slug, { slug, variantes: [], libros: 0, vendedores: new Set(), descartes: [] });
  const g = porSlug.get(slug);
  if (descarte) {
    g.descartes.push({ ...e, motivo: descarte });
  } else {
    g.variantes.push(e);
    g.libros += e.libros;
    e.vendedores.forEach((v) => g.vendedores.add(v));
  }
}

// Los ya configurados no son candidatos.
const config = readFileSync(new URL("../app/(main)/autor/[slug]/authors.config.ts", import.meta.url), "utf8");
const yaConfigurados = new Set([...config.matchAll(/^\s*slug: '([^']+)'/gm)].map((m) => m[1]));

const candidatos = [...porSlug.values()]
  .filter((g) => g.variantes.length > 0 && g.libros >= MIN && !yaConfigurados.has(g.slug))
  .sort((a, b) => b.libros - a.libros || a.slug.localeCompare(b.slug));

/* ─────────────────────── salida ─────────────────────── */

if (args.includes("--json")) {
  console.log(JSON.stringify(candidatos.map((g) => ({
    slug: g.slug,
    displayName: g.variantes[0].exacto.trim(),
    dbAuthors: g.variantes.map((v) => v.exacto),
    libros: g.libros,
  })), null, 2));
  process.exit(0);
}

console.log(`CANDIDATOS A PÁGINA DE AUTOR — ${MIN}+ libros activos\n`);
console.log(`  ${candidatos.length} candidatos · ${yaConfigurados.size} ya configurados · ${porSlug.size} nombres distintos en catálogo\n`);
console.log("   #  libros  vend  slug propuesto                  variante exacta en books.author");
console.log("  ─────────────────────────────────────────────────────────────────────────────────────");
candidatos.forEach((g, i) => {
  g.variantes.forEach((v, j) => {
    // Los espacios sobrantes se marcan con · para que se vean al pegarlos.
    const visible = v.exacto === v.exacto.trim() ? v.exacto : `"${v.exacto.replace(/^ +| +$/g, (s) => "·".repeat(s.length))}"`;
    const cab = j === 0 ? `  ${String(i + 1).padStart(2)}  ${String(g.libros).padStart(6)}  ${String(g.vendedores.size).padStart(4)}  ${g.slug.padEnd(30)}` : " ".repeat(48);
    console.log(`${cab}${visible}${v.exacto !== v.exacto.trim() ? "  ← ESPACIOS SOBRANTES" : ""}`);
  });
});

if (args.includes("--excluidos")) {
  const fuera = [...porSlug.values()].flatMap((g) => g.descartes).filter((d) => d.libros >= 2).sort((a, b) => b.libros - a.libros);
  console.log(`\nDESCARTADOS (${fuera.length} con 2+ libros)\n`);
  for (const d of fuera) {
    const corto = d.exacto.length > 62 ? d.exacto.slice(0, 59) + "..." : d.exacto;
    console.log(`  ${String(d.libros).padStart(3)}  ${corto}`);
    console.log(`       → ${d.motivo}`);
  }
}

console.log(`\nPara configurar uno: copiar la variante exacta a dbAuthors en`);
console.log(`app/(main)/autor/[slug]/authors.config.ts. Los textos editoriales los escribe Vero.`);
