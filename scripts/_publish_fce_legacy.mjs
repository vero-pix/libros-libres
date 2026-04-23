import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const VERO = {
  id: "2201d163-4423-4971-91f0-f6cebd00d1bd",
  lat: -33.420788,
  lng: -70.602773,
  addr: "San Pío X 2555, Providencia, Región Metropolitana de Santiago 7500000, Chile",
};

const slugify = (s) => s.toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function createEntry({ book, listing }) {
  // 1) Insert book
  const { data: bookRow, error: bookErr } = await s.from("books").insert(book).select().single();
  if (bookErr) { console.error("book err:", bookErr); return null; }
  console.log(`✓ Book creado: ${bookRow.title} (${bookRow.id})`);

  // 2) Insert listing con slug
  const slug = slugify(book.title);
  const listingPayload = {
    ...listing,
    book_id: bookRow.id,
    seller_id: VERO.id,
    latitude: VERO.lat,
    longitude: VERO.lng,
    address: VERO.addr,
    slug,
    modality: "sale",
    status: "active",
  };
  const { data: listingRow, error: lErr } = await s.from("listings").insert(listingPayload).select().single();
  if (lErr) { console.error("listing err:", lErr); return null; }
  console.log(`✓ Listing creado: /libro/vero/${slug} (${listingRow.id})`);
  return { book: bookRow, listing: listingRow };
}

// PAIDEIA
await createEntry({
  book: {
    title: "Paideia. Los ideales de la cultura griega",
    author: "Werner Jaeger",
    publisher: "Fondo de Cultura Económica",
    binding: "hardcover",
    language: "es",
    category: "no-ficcion",
    subcategory: "filosofia",
    genre: "Filosofía",
    tags: ["cultura griega", "filosofía antigua", "educación", "clásicos", "FCE"],
    description: "Obra fundacional de los estudios helénicos. Jaeger reconstruye el ideal formativo de la cultura griega —la paideia— desde Homero hasta el cristianismo, articulando educación, política, filosofía y poesía. Edición antigua de Fondo de Cultura Económica, tapa dura. Referencia obligada en estudios clásicos, filosofía de la educación e historia de las ideas.",
    created_by: VERO.id,
  },
  listing: {
    price: 20000,
    condition: "good",
    notes: "Edición antigua de FCE, tapa dura. Esquinas y lomo con desgaste visible pero íntegro. Interior limpio, sin subrayados ni manchas. Pieza de biblioteca.",
    is_collectible: true,
  },
});

// LENGUAJE Y REALIDAD
await createEntry({
  book: {
    title: "Lenguaje y Realidad",
    author: "Wilbur Marshall Urban",
    publisher: "Fondo de Cultura Económica",
    binding: "paperback",
    language: "es",
    category: "no-ficcion",
    subcategory: "filosofia",
    genre: "Filosofía",
    tags: ["filosofía del lenguaje", "lingüística", "semiótica", "FCE"],
    description: "Clásico de filosofía del lenguaje de la serie Lengua y Estudios Literarios de Fondo de Cultura Económica. Urban analiza la relación entre lenguaje, pensamiento y realidad desde una perspectiva simbólica. Texto de referencia en filosofía analítica, hermenéutica y estudios literarios. Difícil de encontrar en ediciones actuales.",
    created_by: VERO.id,
  },
  listing: {
    price: 14000,
    condition: "fair",
    notes: "Rústica antigua de FCE, tapa blanda. Papel amarilleado por el tiempo, desgaste en bordes de tapa. Interior íntegro y legible. Ejemplar de biblioteca con pátina.",
    is_collectible: true,
  },
});
