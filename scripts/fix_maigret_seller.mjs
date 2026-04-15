/**
 * Migra los 31 Maigret del seller equivocado (9bee4b1a, Vitacura)
 * al correcto (2201d163, username=vero, Providencia).
 *
 * Usage:
 *   node scripts/fix_maigret_seller.mjs          # dry-run
 *   node scripts/fix_maigret_seller.mjs --go     # ejecutar
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const c = fs.readFileSync(envPath, "utf-8");
  for (const line of c.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const k = line.slice(0, idx).trim();
    if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
  }
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const GO = process.argv.includes("--go");

const WRONG_SELLER = "9bee4b1a-65b4-4f36-a94a-2705380dcabf";
const RIGHT_SELLER = "2201d163-4423-4971-91f0-f6cebd00d1bd";
const RIGHT_LAT = -33.420788;
const RIGHT_LNG = -70.602773;
const RIGHT_ADDRESS = "San Pío X 2555, Providencia, Región Metropolitana de Santiago 7500000, Chile";

// Encontrar los 31 Maigret: seller equivocado + autor Simenon
const { data: listings, error } = await s
  .from("listings")
  .select("id, slug, seller_id, book:books(id, title, author, created_by)")
  .eq("seller_id", WRONG_SELLER);
if (error) { console.error(error); process.exit(1); }

const maigrets = (listings ?? []).filter((l) => {
  const b = l.book;
  return b && b.author === "Georges Simenon";
});

console.log(`\nEncontrados: ${maigrets.length} listings Simenon en seller equivocado\n`);
for (const l of maigrets) {
  console.log(`  ${l.slug.padEnd(40)} book_id=${l.book.id}`);
}

if (!GO) {
  console.log(`\n(Dry-run) Agregar --go para migrar.`);
  process.exit(0);
}

console.log(`\n🚀 Migrando al seller correcto (${RIGHT_SELLER}, Providencia)...\n`);

let ok = 0, fail = 0;
for (const l of maigrets) {
  try {
    const { error: lErr } = await s
      .from("listings")
      .update({
        seller_id: RIGHT_SELLER,
        latitude: RIGHT_LAT,
        longitude: RIGHT_LNG,
        address: RIGHT_ADDRESS,
      })
      .eq("id", l.id);
    if (lErr) throw lErr;

    const { error: bErr } = await s
      .from("books")
      .update({ created_by: RIGHT_SELLER })
      .eq("id", l.book.id);
    if (bErr) throw bErr;

    console.log(`  ✓ ${l.slug}`);
    ok++;
  } catch (e) {
    console.log(`  ✗ ${l.slug}: ${e.message || e}`);
    fail++;
  }
}

console.log(`\n─ Resumen ─`);
console.log(`Migrados: ${ok}/${maigrets.length}`);
if (fail > 0) console.log(`Errores: ${fail}`);
