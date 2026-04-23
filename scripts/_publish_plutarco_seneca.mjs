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
  lat: -33.420788, lng: -70.602773,
  addr: "San Pío X 2555, Providencia, Región Metropolitana de Santiago 7500000, Chile",
};
const slugify = (s) => s.toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function publish({ book, listing }) {
  const { data: bookRow, error: bErr } = await s.from("books").insert(book).select().single();
  if (bErr) { console.error("book err:", bErr); return; }
  const slug = slugify(book.title);
  const payload = { ...listing, book_id: bookRow.id, seller_id: VERO.id,
    latitude: VERO.lat, longitude: VERO.lng, address: VERO.addr,
    slug, modality: "sale", status: "active" };
  const { data: lRow, error: lErr } = await s.from("listings").insert(payload).select().single();
  if (lErr) { console.error("listing err:", lErr); return; }
  console.log(`✓ /libro/vero/${slug}`);
}

// PLUTARCO TOMO I
await publish({
  book: {
    title: "Las Vidas Paralelas de Plutarco — Tomo I",
    author: "Plutarco · trad. Antonio Ranz Romanillos",
    publisher: "Imprenta Nacional, Madrid (ed. española)",
    binding: "paperback",
    language: "es",
    published_year: 1821,
    category: "coleccionables",
    subcategory: "libros-antiguos",
    genre: "Filosofía",
    tags: ["filosofía antigua", "grecia clásica", "biografías", "siglo XIX", "antiguo"],
    description: "Traducción de Antonio Ranz Romanillos, consejero de Estado y académico de la Real Academia Española. Impresa en Madrid entre 1821 y 1830 en 5 tomos — la versión al castellano más célebre de Las Vidas Paralelas durante todo el siglo XIX. Plutarco compara la vida de ilustres griegos y romanos (Teseo–Rómulo, Licurgo–Numa, etc.) como espejo de virtud y carácter. Pieza de biblioteca con cerca de 200 años.",
    created_by: VERO.id,
  },
  listing: { price: 50000, condition: "fair",
    notes: "Tomo I del set original de 5 (vendo I y II; los otros 3 no los tengo). Papel amarillento típico de impresiones españolas del XIX. Rústica sin tapa dura — así se imprimía esa serie. Lomo y bordes con desgaste, texto íntegro y legible, sin manchas ni hongos. Pieza para bibliófilo o estudioso.",
    is_collectible: true },
});

// PLUTARCO TOMO II
await publish({
  book: {
    title: "Las Vidas Paralelas de Plutarco — Tomo II",
    author: "Plutarco · trad. Antonio Ranz Romanillos",
    publisher: "Imprenta Nacional, Madrid (ed. española)",
    binding: "paperback",
    language: "es",
    published_year: 1821,
    category: "coleccionables",
    subcategory: "libros-antiguos",
    genre: "Filosofía",
    tags: ["filosofía antigua", "grecia clásica", "biografías", "siglo XIX", "antiguo"],
    description: "Tomo II del set de 5. Traducción clásica de Antonio Ranz Romanillos, impresa en España entre 1821 y 1830. Contiene las siguientes biografías paralelas del corpus plutarquiano en la secuencia de esta edición. Referencia bibliográfica obligada en estudios clásicos de habla hispana del siglo XIX.",
    created_by: VERO.id,
  },
  listing: { price: 50000, condition: "fair",
    notes: "Tomo II del set original de 5 (vendo I y II; los otros 3 no los tengo). Mismas condiciones que el Tomo I: papel amarillento, rústica original, lomo con desgaste pero texto íntegro. Se puede comprar en conjunto con el Tomo I.",
    is_collectible: true },
});

// SÉNECA TOMO I
await publish({
  book: {
    title: "Obras Escogidas de Séneca — Tomo I",
    author: "Lucio Anneo Séneca · trad. Nicolás Estévanez",
    publisher: "Casa Editorial Garnier Hermanos, París",
    binding: "paperback",
    language: "es",
    published_year: 1895,
    category: "coleccionables",
    subcategory: "libros-antiguos",
    genre: "Filosofía",
    tags: ["estoicismo", "filosofía romana", "siglo XIX", "antiguo", "Garnier"],
    description: "Edición parisina de finales del siglo XIX de la prestigiosa Casa Garnier Hermanos (6 rue des Saints-Pères). Traducción y prólogo de Nicolás Estévanez (1838-1914), militar y escritor canario. Incluye selección de tratados morales y epístolas de Séneca. Pieza de biblioteca del hispanoamericanismo editorial parisino.",
    created_by: VERO.id,
  },
  listing: { price: 25000, condition: "good",
    notes: "Tomo Primero (vendo I y II; se puede comprar por separado o en conjunto). Edición Garnier París, papel en buen estado para 130 años. Encuadernación original con desgaste en el lomo. Interior limpio, tipografía clásica Garnier.",
    is_collectible: true },
});

// SÉNECA TOMO II
await publish({
  book: {
    title: "Obras Escogidas de Séneca — Tomo II",
    author: "Lucio Anneo Séneca · trad. Nicolás Estévanez",
    publisher: "Casa Editorial Garnier Hermanos, París",
    binding: "paperback",
    language: "es",
    published_year: 1895,
    category: "coleccionables",
    subcategory: "libros-antiguos",
    genre: "Filosofía",
    tags: ["estoicismo", "filosofía romana", "siglo XIX", "antiguo", "Garnier"],
    description: "Tomo Segundo del set. Traducción de Nicolás Estévanez, edición Garnier Hermanos París. Continúa la selección de tratados filosóficos de Séneca. Firma manuscrita antigua en portadilla (provenencia, no compromete el texto).",
    created_by: VERO.id,
  },
  listing: { price: 25000, condition: "good",
    notes: "Tomo Segundo. Con firma manuscrita antigua del propietario original en portadilla — suma historia, no resta valor. Misma encuadernación Garnier que el Tomo I. Texto limpio e íntegro.",
    is_collectible: true },
});
