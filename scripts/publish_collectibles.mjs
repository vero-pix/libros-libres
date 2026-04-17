import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
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

// Vendedor TusLibros (username vero), Providencia
const SELLER_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";
const LAT = -33.420788;
const LNG = -70.602773;
const ADDRESS = "San Pío X 2555, Providencia, Región Metropolitana de Santiago 7500000, Chile";

const COVERS_DIR = "/tmp/book_covers";

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadCover(localPath, destName) {
  const buf = fs.readFileSync(localPath);
  const storagePath = `${SELLER_ID}/${destName}`;
  const { error } = await s.storage.from("covers").upload(storagePath, buf, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = s.storage.from("covers").getPublicUrl(storagePath);
  return data.publicUrl;
}

async function findOrCreateBook(bookData) {
  const { data: existing } = await s
    .from("books")
    .select("id")
    .eq("title", bookData.title)
    .eq("author", bookData.author)
    .maybeSingle();
  if (existing) {
    console.log(`  ↪ Book existente: ${bookData.title}`);
    return existing.id;
  }
  const { data: created, error } = await s
    .from("books")
    .insert({ ...bookData, created_by: SELLER_ID })
    .select("id")
    .single();
  if (error) throw error;
  console.log(`  ✓ Book creado: ${bookData.title}`);
  return created.id;
}

async function publishListing({ book, coverFile, extraFiles = [], price, originalPrice, notes, condition = "good" }) {
  console.log(`\n— ${book.title} (${book.author})`);
  const bookId = await findOrCreateBook(book);

  const coverUrl = await uploadCover(
    path.join(COVERS_DIR, coverFile),
    `${slugify(book.title)}-${Date.now()}.jpg`
  );

  const baseSlug = slugify(book.title);
  const { count } = await s
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("slug", baseSlug);
  const slug = count && count > 0 ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

  const { data: listing, error: listingErr } = await s
    .from("listings")
    .insert({
      book_id: bookId,
      seller_id: SELLER_ID,
      slug,
      modality: "sale",
      price,
      original_price: originalPrice,
      condition,
      notes,
      latitude: LAT,
      longitude: LNG,
      address: ADDRESS,
      cover_image_url: coverUrl,
      status: "active",
      is_collectible: true,
    })
    .select("id, slug")
    .single();
  if (listingErr) throw listingErr;

  // Galería adicional (listing_images)
  for (let i = 0; i < extraFiles.length; i++) {
    const extraUrl = await uploadCover(
      path.join(COVERS_DIR, extraFiles[i]),
      `${slugify(book.title)}-extra-${i + 1}-${Date.now()}.jpg`
    );
    await s.from("listing_images").insert({
      listing_id: listing.id,
      image_url: extraUrl,
      sort_order: i + 1,
    });
  }

  console.log(`  ✓ Listing creado: /libro/vero/${listing.slug}`);
  return listing;
}

try {
  // 1. Juan Emar — Un Año
  await publishListing({
    book: {
      title: "Un Año",
      author: "Juan Emar",
      description:
        "Primera novela de Juan Emar (seudónimo de Álvaro Yáñez Bianchi), publicada originalmente en 1935. Neruda lo llamó 'el cronista de lo imaginario'. Vanguardia chilena ignorada por sus contemporáneos y revalorizada en las últimas décadas. Edición Biblioteca Claves de Chile, Editorial Sudamericana.",
      publisher: "Editorial Sudamericana — Biblioteca Claves de Chile",
      published_year: null,
      pages: null,
      binding: "paperback",
      language: "es",
      genre: "Ficción",
      category: "ficcion",
      subcategory: "novela",
      tags: ["vanguardia", "literatura chilena", "clásicos del siglo xx"],
    },
    coverFile: "emar_unanio.jpg",
    price: 12000,
    notes:
      "Biblioteca Claves de Chile, Editorial Sudamericana. La primera novela de Juan Emar (seudónimo de Álvaro Yáñez Bianchi), publicada originalmente en 1935 e ignorada por sus contemporáneos. Neruda lo llamó 'el cronista de lo imaginario'. Vanguardia chilena en estado puro, recién revalorizada en las últimas décadas. Edición en buen estado. Tengo también 'Ayer' del mismo autor, si te llevas los dos hacemos precio.",
    condition: "good",
  });

  // 2. Juan Emar — Ayer
  await publishListing({
    book: {
      title: "Ayer",
      author: "Juan Emar",
      description:
        "Novela de 1935 del escritor vanguardista chileno Juan Emar, contemporáneo de Huidobro y casi secreto en vida. Un día en la vida de un narrador que camina por una ciudad imaginaria. Pieza clave de la vanguardia latinoamericana, poco editada, muy buscada por coleccionistas. Edición Colección Entre Mares.",
      publisher: "LOM Ediciones — Colección Entre Mares",
      published_year: null,
      pages: null,
      binding: "paperback",
      language: "es",
      genre: "Ficción",
      category: "ficcion",
      subcategory: "novela",
      tags: ["vanguardia", "literatura chilena", "clásicos del siglo xx"],
    },
    coverFile: "emar_ayer.jpg",
    price: 14000,
    notes:
      "Colección Entre Mares (LOM Ediciones). Otra novela de 1935 de este autor vanguardista chileno, contemporáneo de Huidobro y casi secreto en vida. Un día en la vida de un narrador que camina por una ciudad imaginaria. Pieza clave de la vanguardia latinoamericana, poco editada, muy buscada por coleccionistas. Tengo también 'Un Año' del mismo autor, si te llevas los dos hacemos precio.",
    condition: "good",
  });

  // 3. Pablo de Rokha — Lo humano en la poesía
  await publishListing({
    book: {
      title: "Lo humano en la poesía",
      author: "Pablo de Rokha",
      description:
        "Antología tomada de Poesía completa (Edición crítica, Editorial Letras Cubanas). Selección de Camilo Pérez Casal. Editorial de Ciencias Sociales, La Habana, 1991. Impresa en los talleres 'Juan Marinello' en pleno Período Especial cubano: papel rústico, diseño austero, encuadernación artesanal. El poeta chileno menos editado de los 'cuatro grandes' (Neruda, Mistral, Huidobro, De Rokha) publicado en la Habana del 91. Rareza bibliográfica.",
      publisher: "Editorial de Ciencias Sociales, La Habana",
      published_year: 1991,
      pages: null,
      binding: "paperback",
      language: "es",
      genre: "Poesía",
      category: "clasicos",
      subcategory: null,
      tags: ["poesía chilena", "pablo de rokha", "edición cubana", "período especial"],
    },
    coverFile: "rokha_portada.jpg",
    extraFiles: ["rokha_indice.jpg", "rokha_interior.jpg", "rokha_contratapa.jpg"],
    price: 14000,
    notes:
      "Antología tomada de Poesía completa (Edición crítica, Editorial Letras Cubanas). Selección de Camilo Pérez Casal. Editorial de Ciencias Sociales, La Habana, 1991. Impresa en los talleres 'Juan Marinello' en pleno Período Especial cubano: papel rústico, diseño austero, encuadernación artesanal. Una rareza doble — el poeta chileno menos editado de los cuatro grandes publicado en la Habana del 91. Incluye Tábanos Fieros y otras piezas clave. Objeto de colección.",
    condition: "good",
  });

  console.log("\n✅ Los 3 coleccionables publicados.");
} catch (e) {
  console.error("❌ Error:", e.message || e);
  process.exit(1);
}
