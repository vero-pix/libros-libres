/**
 * Publica la colección Maigret (Luis de Caralt) de Vero.
 * Lee scripts/data/maigret_books.json, sube portadas y crea listings.
 *
 * Usage:
 *   node scripts/publish_maigret.mjs           # dry-run (no escribe nada)
 *   node scripts/publish_maigret.mjs --go      # ejecuta de verdad
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { readFileSync } from "fs";
import { resolve } from "path";

// Cargar .env.local (mismo patrón que fix-covers.ts)
const envPath = resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const k = line.slice(0, idx).trim();
    if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
  }
}

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GO = process.argv.includes("--go");

// Datos del vendedor correcto: vero (username), TusLibros, Providencia
const USER_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";
const LAT = -33.420788;
const LNG = -70.602773;
const ADDRESS = "San Pío X 2555, Providencia, Región Metropolitana de Santiago 7500000, Chile";

// Datos comunes de la colección
const PRICE = 5000;
const AUTHOR = "Georges Simenon";
const PUBLISHER = "Luis de Caralt Editor, Barcelona";
const CATEGORY = "ficcion";
const SUBCATEGORY = "novela-negra";
const GENRE = "Novela negra";
const BINDING = "paperback";
const CONDITION = "good";
const MODALITY = "sale";
const BASE_TAGS = ["NovelaNegra", "Clasico", "Coleccionable", "Maigret", "literatura francesa"];

const NOTES = `Colección clásica de Maigret — edición Luis de Caralt Editor, Barcelona (española, años 60-70). Tapa blanda con ilustración a color característica de la colección, portada con retrato de Simenon arriba a la izquierda. Estado: bueno, sin marcas, tapa intacta, lomo firme, páginas en buen estado para la edad del libro. Tengo muchos títulos más de la misma colección disponibles — si te llevas varios, conversamos precio. Ideal para coleccionistas de policial clásico y fans de Simenon.`;

const PHOTOS_ORIGINAL_DIR = "docs/maigrets";
const PHOTOS_WEB_DIR = "docs/maigrets/small"; // versiones reducidas para web

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadCover(localPath, destName) {
  const buf = fs.readFileSync(localPath);
  const storagePath = `${USER_ID}/${destName}`;
  const { error } = await s.storage.from("covers").upload(storagePath, buf, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = s.storage.from("covers").getPublicUrl(storagePath);
  return data.publicUrl;
}

async function slugIsTaken(baseSlug) {
  const { count } = await s
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("slug", baseSlug);
  return (count ?? 0) > 0;
}

async function publishBook(entry, coverUrl) {
  // 1) book row
  const bookPayload = {
    title: entry.title,
    author: AUTHOR,
    description: entry.description,
    publisher: PUBLISHER,
    published_year: null,
    pages: null,
    binding: BINDING,
    genre: GENRE,
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    tags: [...BASE_TAGS, ...(entry.tags_extra ?? [])],
    cover_url: coverUrl,
    created_by: USER_ID,
  };

  const { data: bookRow, error: bookErr } = await s
    .from("books")
    .insert(bookPayload)
    .select("id")
    .single();
  if (bookErr) throw bookErr;

  // 2) listing
  const baseSlug = slugify(entry.title);
  const slug = (await slugIsTaken(baseSlug))
    ? `${baseSlug}-${Date.now().toString(36).slice(-4)}`
    : baseSlug;

  const { data: listing, error: listingErr } = await s
    .from("listings")
    .insert({
      book_id: bookRow.id,
      seller_id: USER_ID,
      slug,
      modality: MODALITY,
      price: PRICE,
      condition: CONDITION,
      notes: NOTES,
      latitude: LAT,
      longitude: LNG,
      address: ADDRESS,
      cover_image_url: coverUrl,
      status: "active",
    })
    .select("id, slug")
    .single();
  if (listingErr) throw listingErr;

  return { bookId: bookRow.id, listingId: listing.id, slug: listing.slug };
}

async function main() {
  const jsonArg = process.argv.find((a) => a.endsWith(".json"));
  const jsonPath = jsonArg ?? "scripts/data/maigret_books.json";
  const books = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  console.log(`\n📚 ${books.length} libros para publicar\n`);
  console.log(`Modo: ${GO ? "EJECUCIÓN REAL" : "DRY-RUN (no escribe nada)"}\n`);

  // Validar que cada foto existe
  const missing = [];
  for (const b of books) {
    const webPath = path.join(PHOTOS_WEB_DIR, b.file);
    if (!fs.existsSync(webPath)) missing.push(b.file);
  }
  if (missing.length > 0) {
    console.error(`❌ Faltan ${missing.length} fotos en ${PHOTOS_WEB_DIR}:`);
    missing.forEach((f) => console.error(`   - ${f}`));
    process.exit(1);
  }
  console.log(`✓ Las ${books.length} fotos existen en ${PHOTOS_WEB_DIR}\n`);

  if (!GO) {
    console.log("─".repeat(60));
    books.forEach((b, i) => {
      console.log(`${String(i + 1).padStart(2, "0")}. ${b.title}`);
      console.log(`    foto: ${b.file}`);
      console.log(`    slug: ${slugify(b.title)}`);
    });
    console.log("─".repeat(60));
    console.log(`\n(Dry-run) Agregar --go para ejecutar.\n`);
    return;
  }

  const results = [];
  for (const [i, b] of books.entries()) {
    const n = String(i + 1).padStart(2, "0");
    try {
      console.log(`${n}. ${b.title}`);
      const destName = `${slugify(b.title)}.jpg`;
      const webPath = path.join(PHOTOS_WEB_DIR, b.file);
      const coverUrl = await uploadCover(webPath, destName);
      console.log(`    ✓ portada subida`);
      const r = await publishBook(b, coverUrl);
      console.log(`    ✓ publicado → /libros/${r.slug}`);
      results.push({ title: b.title, slug: r.slug, ok: true });
    } catch (e) {
      console.log(`    ✗ ERROR: ${e.message || e}`);
      results.push({ title: b.title, ok: false, error: e.message || String(e) });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  console.log(`\n─ Resumen ─`);
  console.log(`Publicados: ${okCount}/${books.length}`);
  if (okCount < books.length) {
    console.log(`\nErrores:`);
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.title}: ${r.error}`));
  }
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});
