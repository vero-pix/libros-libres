import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const c = fs.readFileSync(envPath, "utf-8");
for (const line of c.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SELLER_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";
const LAT = -33.420788;
const LNG = -70.602773;
const ADDRESS = "San Pío X 2555, Providencia, Región Metropolitana de Santiago 7500000, Chile";
const COVERS_DIR = "/tmp/book_covers";

function slugify(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uploadCover(localPath, destName) {
  const buf = fs.readFileSync(localPath);
  const storagePath = `${SELLER_ID}/${destName}`;
  const { error } = await s.storage.from("covers").upload(storagePath, buf, { upsert: true, contentType: "image/jpeg" });
  if (error) throw error;
  return s.storage.from("covers").getPublicUrl(storagePath).data.publicUrl;
}

const book = {
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
};

const notes =
  "Antología tomada de Poesía completa (Edición crítica, Editorial Letras Cubanas). Selección de Camilo Pérez Casal. Editorial de Ciencias Sociales, La Habana, 1991. Impresa en los talleres 'Juan Marinello' en pleno Período Especial cubano: papel rústico, diseño austero, encuadernación artesanal. Una rareza doble — el poeta chileno menos editado de los cuatro grandes publicado en la Habana del 91. Incluye Tábanos Fieros y otras piezas clave. Objeto de colección.";

const { data: existingBook } = await s.from("books").select("id").eq("title", book.title).eq("author", book.author).maybeSingle();
let bookId;
if (existingBook) {
  bookId = existingBook.id;
  console.log("  ↪ Book existente:", bookId);
} else {
  const { data, error } = await s.from("books").insert({ ...book, created_by: SELLER_ID }).select("id").single();
  if (error) throw error;
  bookId = data.id;
  console.log("  ✓ Book creado:", bookId);
}

const coverUrl = await uploadCover(path.join(COVERS_DIR, "rokha_portada.jpg"), `lo-humano-en-la-poesia-${Date.now()}.jpg`);
console.log("  ✓ Portada subida");

const baseSlug = slugify(book.title);
const { count } = await s.from("listings").select("id", { count: "exact", head: true }).eq("slug", baseSlug);
const slug = count && count > 0 ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

const { data: listing, error: lErr } = await s.from("listings").insert({
  book_id: bookId,
  seller_id: SELLER_ID,
  slug,
  modality: "sale",
  price: 14000,
  condition: "good",
  notes,
  latitude: LAT,
  longitude: LNG,
  address: ADDRESS,
  cover_image_url: coverUrl,
  status: "active",
  is_collectible: true,
}).select("id, slug").single();
if (lErr) throw lErr;
console.log("  ✓ Listing creado:", listing);

for (const [i, file] of ["rokha_indice.jpg", "rokha_interior.jpg", "rokha_contratapa.jpg"].entries()) {
  const url = await uploadCover(path.join(COVERS_DIR, file), `lo-humano-extra-${i + 1}-${Date.now()}.jpg`);
  await s.from("listing_images").insert({ listing_id: listing.id, image_url: url, sort_order: i + 1 });
  console.log(`  + Imagen extra ${i + 1}`);
}

console.log("\n✅ Rokha publicado");
