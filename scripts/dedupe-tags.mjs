/**
 * Consolida tags duplicados/sucios en la tabla books.
 *
 * Problema: convivían dos vocabularios — slugs curados que alimentan las
 * colecciones del home (components/home/ColeccionRow.tsx → .contains) y
 * formas CamelCase emitidas por el suggester. Eso generaba duplicados en el
 * sidebar (?tag=) tipo "ensayo" vs "Ensayo".
 *
 * Regla: consolidar hacia el slug de colección cuando existe; eliminar
 * singletons-basura (nombres de autor/premio que se colaron como tag).
 *
 * Idempotente: solo actualiza books cuyos tags cambian.
 *
 * Uso:  set -a; source .env.local; set +a; node scripts/dedupe-tags.mjs
 *       node scripts/dedupe-tags.mjs --apply   (sin --apply es dry-run)
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APPLY = process.argv.includes("--apply");

// Renombrar (forma sucia → canónica). El destino dedupe si ya existe.
const RENAME = {
  "Ensayo": "ensayo",
  "Clasico": "clasicos",
  "Clásico": "clasicos",
  "NovelaNegra": "novela-negra",
  "Filosofia": "filosofia",
  "Filosofía": "filosofia",
  "filosofía": "filosofia",
  "literatura latinoamericana": "latinoamerica-contemp",
  "antropología": "Humanidades",
};

// Eliminar por completo (no son vocabulario, son nombres sueltos).
const REMOVE = new Set([
  "Mutis",
  "Premio Cervantes",
  "Teilhard de Chardin",
]);

function clean(tags) {
  const out = [];
  for (const t of tags ?? []) {
    if (REMOVE.has(t)) continue;
    const mapped = RENAME[t] ?? t;
    if (!out.includes(mapped)) out.push(mapped);
  }
  return out;
}

const { data: books, error } = await supabase
  .from("books")
  .select("id, tags")
  .neq("tags", "{}");

if (error) { console.error("Error:", error); process.exit(1); }

let changed = 0;
const before = {};
const after = {};
const tally = (obj, arr) => arr.forEach(t => { obj[t] = (obj[t] ?? 0) + 1; });

for (const b of books) {
  const orig = b.tags ?? [];
  tally(before, orig);
  const next = clean(orig);
  tally(after, next);

  const diff = orig.length !== next.length || orig.some((t, i) => t !== next[i]);
  if (!diff) continue;
  changed++;

  if (APPLY) {
    const { error: e } = await supabase.from("books").update({ tags: next }).eq("id", b.id);
    if (e) console.error(`  ✗ ${b.id}: ${e.message}`);
  }
}

const show = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])
  .map(([k, n]) => `  ${String(n).padStart(4)}  ${k}`).join("\n");

console.log(`${APPLY ? "APLICADO" : "DRY-RUN (usa --apply para escribir)"}`);
console.log(`Libros con tags: ${books.length} | a modificar: ${changed}`);
console.log(`Tags distintos: ${Object.keys(before).length} → ${Object.keys(after).length}`);
console.log("\n=== ANTES ===\n" + show(before));
console.log("\n=== DESPUÉS ===\n" + show(after));
