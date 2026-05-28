/**
 * Carga masiva desde CSV con formato:
 * num,titulo,autor,isbn,condicion,tipo,descripcion,cover_openlibrary,cover_google,year,pages,categoria
 *
 * Auto-completa sinopsis, portada, género y año desde Google Books API
 * cuando el CSV no los trae.
 *
 * FOTOS PROPIAS DEL VENDEDOR (--photos):
 *   Para vendedores con fotos uniformes (ej: CIM Libros) que NO quieren la
 *   portada genérica del catálogo. Sube las fotos locales a la galería real
 *   (bucket "covers" + tabla listing_images), igual que el formulario web.
 *   - La PRIMERA foto de cada libro queda como portada (cover_image_url).
 *   - El resto va a la galería (listing_images), sin duplicar la portada.
 *   Mapeo de fotos a cada libro (dos formas):
 *   a) Columna `fotos` en el CSV: nombres separados por ; → "tapa.jpg;lomo.jpg"
 *   b) Por nombre de archivo = ISBN: 9788401352836.jpg, 9788401352836-2.jpg, ...
 *   Formatos soportados: jpg, jpeg, png, webp. HEIC NO (exportar a JPEG antes).
 *
 * Usage:
 *   npx tsx scripts/bulk-upload-csv.ts docs/carga_masiva_libros.csv
 *   npx tsx scripts/bulk-upload-csv.ts libros.csv --photos ./fotos_cim
 *   npx tsx scripts/bulk-upload-csv.ts libros.csv --photos ./fotos --dry-run
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join, basename, extname } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const key = line.slice(0, idx).trim();
  // Quitar comillas envolventes (.env.local suele traer KEY="valor")
  const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// Vendedor por defecto: vero (Providencia). Override con --seller <uuid> para
// cargar a nombre de otro vendedor (ej: CIM Libros). La ubicación se resuelve
// luego desde el perfil del vendedor en la BD.
const sellerIdx = process.argv.indexOf("--seller");
const SELLER_ID =
  sellerIdx > -1 ? process.argv[sellerIdx + 1] : "2201d163-4423-4971-91f0-f6cebd00d1bd";
// CLI overrides: npx tsx scripts/bulk-upload-csv.ts file.csv --price 6500 --notes "Sin marcas de uso"
const priceIdx = process.argv.indexOf("--price");
const DEFAULT_PRICE = priceIdx > -1 ? parseInt(process.argv[priceIdx + 1], 10) : 5000;
const notesIdx = process.argv.indexOf("--notes");
const DEFAULT_NOTES = notesIdx > -1 ? process.argv[notesIdx + 1] : null;
// Carpeta de fotos propias del vendedor (opcional)
const photosIdx = process.argv.indexOf("--photos");
const PHOTOS_DIR = photosIdx > -1 ? resolve(process.argv[photosIdx + 1]) : null;
// Dry-run: no escribe nada en la BD ni en Storage, solo reporta qué haría
const DRY_RUN = process.argv.includes("--dry-run");
const PHOTO_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const STORAGE_BUCKET = "covers";
// Coordenadas se resuelven desde el perfil del vendedor en Supabase
let SELLER_LAT = -33.4489;
let SELLER_LNG = -70.6693;
let SELLER_ADDRESS = "Santiago, Chile";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface BookMeta {
  description: string | null;
  cover_url: string | null;
  genre: string | null;
  published_year: number | null;
  publisher: string | null;
  pages: number | null;
}

async function fetchBookMeta(isbn: string, title: string, author: string): Promise<BookMeta> {
  const clean = isbn.replace(/[-\s]/g, "");
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  // Try by ISBN first
  for (const query of [`isbn:${clean}`, `${title} ${author}`]) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1${apiKey ? `&key=${apiKey}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.items?.length) continue;

      const v = data.items[0].volumeInfo;
      const cover = v.imageLinks?.thumbnail?.replace("http://", "https://") ?? null;
      const desc = v.description ?? null;

      if (desc || cover) {
        return {
          description: desc,
          cover_url: cover,
          genre: v.categories?.[0] ?? null,
          published_year: v.publishedDate ? parseInt(v.publishedDate.substring(0, 4)) : null,
          publisher: v.publisher ?? null,
          pages: v.pageCount ?? null,
        };
      }
    } catch { /* continue to next query */ }
  }

  return { description: null, cover_url: null, genre: null, published_year: null, publisher: null, pages: null };
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// Listado de la carpeta de fotos, cacheado una vez
let photoDirFiles: string[] = [];
function loadPhotoDir() {
  if (!PHOTOS_DIR) return;
  if (!existsSync(PHOTOS_DIR)) {
    console.error(`❌ Carpeta de fotos no existe: ${PHOTOS_DIR}`);
    process.exit(1);
  }
  photoDirFiles = readdirSync(PHOTOS_DIR).filter((f) =>
    PHOTO_EXTS.includes(extname(f).toLowerCase())
  );
  console.log(`📷 Carpeta de fotos: ${PHOTOS_DIR} (${photoDirFiles.length} imágenes)`);
}

// Resuelve las fotos de un libro. Prioridad:
//   1) columna `fotos` del CSV (nombres separados por ;)
//   2) por nombre de archivo = ISBN (isbn.jpg, isbn-2.jpg, isbn_3.png, ...)
function resolvePhotosForRow(row: Record<string, string>, isbn: string): string[] {
  if (!PHOTOS_DIR) return [];

  // a) Columna explícita `fotos`
  if (row.fotos?.trim()) {
    const names = row.fotos.split(";").map((n) => n.trim()).filter(Boolean);
    const paths: string[] = [];
    for (const name of names) {
      const full = join(PHOTOS_DIR, name);
      if (existsSync(full)) paths.push(full);
      else console.warn(`    ⚠️  Foto no encontrada: ${name}`);
    }
    return paths;
  }

  // b) Por ISBN: archivos cuyo nombre (sin un sufijo -N / _N) es el ISBN.
  //    9788432216152.jpg (portada), 9788432216152-2.jpg, 9788432216152_3.png, ...
  if (isbn) {
    const clean = isbn.replace(/[-\s]/g, "");
    const matches = photoDirFiles
      .filter((f) => {
        const stem = basename(f, extname(f));
        const norm = stem.replace(/[-_]\d+$/, "").replace(/[-\s]/g, "");
        return norm === clean;
      })
      // orden: la foto sin sufijo (portada) primero, luego -2, -3...
      .sort((a, b) => photoSuffix(a) - photoSuffix(b) || a.localeCompare(b));
    return matches.map((f) => join(PHOTOS_DIR, f));
  }

  return [];
}

// Número de sufijo de una foto (isbn-2.jpg → 2). Sin sufijo → 0 (va primero).
function photoSuffix(filename: string): number {
  const m = basename(filename, extname(filename)).match(/[-_](\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+/g, "-");
}

// Sube las fotos al bucket y devuelve las URLs públicas (en orden)
async function uploadPhotos(listingId: string, paths: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < paths.length; i++) {
    const filePath = paths[i];
    const ext = extname(filePath).toLowerCase();
    const storagePath = `${SELLER_ID}/${listingId}/${i}-${sanitizeName(basename(filePath))}`;

    if (DRY_RUN) {
      urls.push(`[dry-run] ${storagePath}`);
      continue;
    }

    const buffer = readFileSync(filePath);
    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: CONTENT_TYPES[ext] ?? "image/jpeg",
        upsert: true,
      });
    if (upErr) {
      console.warn(`    ⚠️  Error subiendo ${basename(filePath)}: ${upErr.message}`);
      continue;
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/bulk-upload-csv.ts <csv-file> [--photos <dir>] [--dry-run]");
    process.exit(1);
  }

  if (DRY_RUN) console.log("🧪 DRY-RUN: no se escribe nada en la BD ni en Storage.\n");
  loadPhotoDir();

  // Resolver ubicación del vendedor desde su perfil
  const { data: seller } = await supabase
    .from("users")
    .select("default_latitude, default_longitude, default_address, comuna")
    .eq("id", SELLER_ID)
    .single();

  if (seller?.default_latitude && seller?.default_longitude) {
    SELLER_LAT = seller.default_latitude;
    SELLER_LNG = seller.default_longitude;
    SELLER_ADDRESS = seller.default_address || seller.comuna || "Santiago, Chile";
    console.log(`📍 Ubicación del vendedor: ${SELLER_ADDRESS} (${SELLER_LAT}, ${SELLER_LNG})`);
  } else {
    console.warn(`⚠️  Vendedor sin ubicación guardada. Usando Santiago centro como fallback.`);
    console.warn(`   Para corregir: actualiza default_latitude/longitude en el perfil del vendedor.`);
  }

  const csv = readFileSync(filePath, "utf-8");
  const lines = csv.split("\n").filter((l) => l.trim());
  const header = parseCsvLine(lines[0]);

  let created = 0;
  let skipped = 0;
  let failed = 0;
  let photosUploaded = 0;
  let noPhoto = 0;

  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });

    const title = row.titulo;
    const author = row.autor;
    const isbn = row.isbn;
    let description = row.descripcion || null;
    let coverUrl = row.cover_google || row.cover_openlibrary || null;
    let genre = row.categoria || null;
    let year = row.year ? parseInt(row.year, 10) || null : null;
    let publisher = row.editorial || null;
    let pages = row.pages ? parseInt(row.pages, 10) || null : null;
    const binding = row.encuadernacion || null;
    const condition = row.condicion === "buen_estado" ? "good" : row.condicion || "good";
    const modality = row.tipo === "venta" ? "sale" : row.tipo === "both" ? "both" : row.tipo || "sale";
    const rowPrice = row.precio ? parseInt(row.precio, 10) : DEFAULT_PRICE;
    const rentalPrice = modality !== "sale" ? Math.round(rowPrice * 0.4) : null;

    if (!title || !author) {
      console.log(`  Skip row ${i}: missing title/author`);
      skipped++;
      continue;
    }

    // Resolver fotos propias del vendedor (si se pasó --photos)
    const photoPaths = resolvePhotosForRow(row, isbn);
    if (PHOTOS_DIR && photoPaths.length === 0) {
      console.warn(`  ⚠️  "${title}" sin fotos en la carpeta (usará portada de catálogo)`);
      noPhoto++;
    }

    // En dry-run solo reportamos el mapeo y seguimos, sin tocar BD ni Storage
    if (DRY_RUN) {
      const fotos = PHOTOS_DIR
        ? ` — ${photoPaths.length} foto(s): ${photoPaths.map((p) => basename(p)).join(", ") || "ninguna"}`
        : "";
      console.log(`  • ${title} — ${author}${fotos}`);
      created++;
      continue;
    }

    // Auto-complete missing data from Google Books
    if (isbn && (!description || !coverUrl || !genre || !year)) {
      console.log(`  Buscando datos de "${title}"...`);
      const meta = await fetchBookMeta(isbn, title, author);
      if (!description && meta.description) description = meta.description;
      if (!coverUrl && meta.cover_url) coverUrl = meta.cover_url;
      if (!genre && meta.genre) genre = meta.genre;
      if (!year && meta.published_year) year = meta.published_year;
      if (!publisher && meta.publisher) publisher = meta.publisher;
      if (!pages && meta.pages) pages = meta.pages;
    }
    genre = genre || "Literatura";

    // Check if book with this ISBN already exists
    let bookId: string;
    if (isbn) {
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("isbn", isbn)
        .maybeSingle();

      if (existing) {
        // Check if listing already exists for this book + seller
        const { data: existingListing } = await supabase
          .from("listings")
          .select("id")
          .eq("book_id", existing.id)
          .eq("seller_id", SELLER_ID)
          .maybeSingle();

        if (existingListing) {
          console.log(`  Skip: "${title}" ya existe`);
          skipped++;
          continue;
        }
        bookId = existing.id;
      } else {
        const { data: newBook, error: bookErr } = await supabase
          .from("books")
          .insert({
            title,
            author,
            isbn,
            description,
            cover_url: coverUrl,
            genre,
            published_year: year,
            publisher,
            pages,
            binding,
            created_by: SELLER_ID,
          })
          .select("id")
          .single();

        if (bookErr || !newBook) {
          console.error(`  Error book "${title}": ${bookErr?.message}`);
          failed++;
          continue;
        }
        bookId = newBook.id;
      }
    } else {
      const { data: newBook, error: bookErr } = await supabase
        .from("books")
        .insert({
          title,
          author,
          description,
          cover_url: coverUrl,
          genre,
          published_year: year,
          publisher,
          pages,
          binding,
          created_by: SELLER_ID,
        })
        .select("id")
        .single();

      if (bookErr || !newBook) {
        console.error(`  Error book "${title}": ${bookErr?.message}`);
        failed++;
        continue;
      }
      bookId = newBook.id;
    }

    // Create listing
    const { data: newListing, error: listErr } = await supabase
      .from("listings")
      .insert({
        book_id: bookId,
        seller_id: SELLER_ID,
        price: rowPrice,
        condition,
        modality,
        rental_price: rentalPrice,
        notes: DEFAULT_NOTES,
        cover_image_url: coverUrl,
        latitude: SELLER_LAT,
        longitude: SELLER_LNG,
        address: SELLER_ADDRESS,
        status: "active",
      })
      .select("id")
      .single();

    if (listErr || !newListing) {
      console.error(`  Error listing "${title}": ${listErr?.message}`);
      failed++;
      continue;
    }

    // Subir fotos propias del vendedor: 1ª = portada, resto = galería.
    // No metemos la portada en listing_images para no duplicarla (la ficha
    // arma la galería como [cover, ...listing_images]).
    if (photoPaths.length > 0) {
      const urls = await uploadPhotos(newListing.id, photoPaths);
      if (urls.length > 0) {
        await supabase
          .from("listings")
          .update({ cover_image_url: urls[0] })
          .eq("id", newListing.id);

        if (urls.length > 1) {
          await supabase.from("listing_images").insert(
            urls.slice(1).map((url, idx) => ({
              listing_id: newListing.id,
              image_url: url,
              sort_order: idx,
            }))
          );
        }
        photosUploaded += urls.length;
      }
    }

    created++;
    console.log(`  ✓ ${title} — ${author}${photoPaths.length ? ` (${photoPaths.length} foto/s)` : ""}`);
  }

  console.log(`\nResultado: ${created} ${DRY_RUN ? "a crear" : "creados"}, ${skipped} omitidos, ${failed} fallidos`);
  if (PHOTOS_DIR && !DRY_RUN) {
    console.log(`Fotos: ${photosUploaded} subidas, ${noPhoto} libro(s) sin foto.`);
  } else if (PHOTOS_DIR && DRY_RUN) {
    console.log(`Fotos: ${noPhoto} libro(s) sin foto en la carpeta.`);
  }
}

main();
