import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = "9bee4b1a-65b4-4f36-a94a-2705380dcabf";
const LAT = -33.376334;
const LNG = -70.548805;
const ADDRESS = "Del Mirador 2070, Vitacura, Región Metropolitana de Santiago 7630000, Chile";

async function uploadCover(localPath, destName) {
  const buf = fs.readFileSync(localPath);
  const path = `${USER_ID}/${destName}`;
  const { error } = await s.storage.from("covers").upload(path, buf, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = s.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}

async function publishBook({ book, price, originalPrice, notes }) {
  const { data: bookRow, error: bookErr } = await s
    .from("books")
    .upsert(
      { ...book, created_by: USER_ID },
      { onConflict: "isbn", ignoreDuplicates: false }
    )
    .select("id")
    .single();
  if (bookErr) throw bookErr;
  console.log("Book id:", bookRow.id);

  const baseSlug = book.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const { count } = await s
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("slug", baseSlug);
  const slug =
    count && count > 0 ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

  const { data: listing, error: listingErr } = await s
    .from("listings")
    .insert({
      book_id: bookRow.id,
      seller_id: USER_ID,
      slug,
      modality: "sale",
      price,
      original_price: originalPrice,
      condition: "good",
      notes,
      latitude: LAT,
      longitude: LNG,
      address: ADDRESS,
      cover_image_url: null,
      status: "active",
    })
    .select("id, slug")
    .single();
  if (listingErr) throw listingErr;
  console.log("Listing created:", listing);
  return listing;
}

const notasColeccion =
  "Colección Seix Barral – Biblioteca Breve, edición española de 1983. Traducción del alemán por Margarita Fontseré. Estado bueno: tapa intacta, lomo firme, páginas sin marcas significativas. Tengo además el libro hermano de la misma colección (Max Frisch – Seix Barral Biblioteca Breve), si te llevas los dos hacemos precio.";

try {
  await publishBook({
    book: {
      title: "No soy Stiller",
      author: "Max Frisch",
      isbn: "8432200301",
      description:
        "Una de las grandes novelas europeas del siglo XX. Un hombre detenido en la frontera suiza insiste en que no es Stiller, el escultor desaparecido por el que lo toman. A partir de esa negación, Frisch construye una meditación brillante sobre la identidad, la memoria y las ficciones que nos contamos para soportar la propia vida. Traducción del alemán por Margarita Fontseré.",
      publisher: "Seix Barral – Biblioteca Breve",
      published_year: 1983,
      pages: null,
      binding: "paperback",
      genre: "Ficción",
      category: "ficcion",
      subcategory: "novela",
      tags: ["clásicos del siglo xx", "literatura alemana", "suiza"],
    },
    price: 13000,
    originalPrice: 14560,
    notes: notasColeccion,
  });

  await publishBook({
    book: {
      title: "Digamos que me llamo Gantenbein",
      author: "Max Frisch",
      isbn: "843220420X",
      description:
        "Un hombre imagina que es ciego y se inventa vidas. Frisch juega con la identidad, la ficción y la posibilidad: ¿quién serías si pudieras elegir otra biografía? Considerada una de sus obras más experimentales y fascinantes, publicada originalmente en 1964. Edición Seix Barral – Biblioteca Breve.",
      publisher: "Seix Barral – Biblioteca Breve",
      published_year: 1983,
      pages: null,
      binding: "paperback",
      genre: "Ficción",
      category: "ficcion",
      subcategory: "novela",
      tags: ["clásicos del siglo xx", "literatura alemana", "suiza"],
    },
    price: 10000,
    originalPrice: 11200,
    notes: notasColeccion,
  });

  console.log("\n✅ Ambos libros publicados.");
} catch (e) {
  console.error("❌ Error:", e.message || e);
  process.exit(1);
}
