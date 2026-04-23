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
const VERO_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";

async function uploadFile(localPath, storagePath) {
  const buf = fs.readFileSync(localPath);
  const { error } = await s.storage.from("covers").upload(storagePath, buf, {
    contentType: "image/jpeg", cacheControl: "31536000", upsert: true,
  });
  if (error) { console.error(`upload err ${storagePath}:`, error.message); return null; }
  return s.storage.from("covers").getPublicUrl(storagePath).data.publicUrl;
}

async function getListing(slug) {
  const { data } = await s.from("listings").select("id,book_id,cover_image_url").eq("slug", slug).eq("seller_id", VERO_ID).single();
  return data;
}

const stamp = Date.now();
const urls = {};
for (const id of ["9009","9010","9011"]) {
  urls[id] = await uploadFile(`/tmp/seneca/IMG_${id}.jpg`, `${VERO_ID}/${stamp}-${id}.jpg`);
  console.log(`↑ IMG_${id}`);
}

// PLUTARCO T1: nueva cover = 9011; antigua cover (9003) pasa a extras
const p1 = await getListing("las-vidas-paralelas-de-plutarco-tomo-i");
const oldCoverP1 = p1.cover_image_url;
await s.from("listings").update({ cover_image_url: urls["9011"] }).eq("id", p1.id);
await s.from("listing_images").insert([
  { listing_id: p1.id, image_url: urls["9009"], sort_order: 1 },
  { listing_id: p1.id, image_url: urls["9010"], sort_order: 2 },
  { listing_id: p1.id, image_url: oldCoverP1, sort_order: 3 },
]);
console.log("✓ Plutarco T1 actualizado");

// PLUTARCO T2: cover se mantiene, sumar extras 9010 y 9009
const p2 = await getListing("las-vidas-paralelas-de-plutarco-tomo-ii");
await s.from("listing_images").insert([
  { listing_id: p2.id, image_url: urls["9010"], sort_order: 1 },
  { listing_id: p2.id, image_url: urls["9009"], sort_order: 2 },
]);
console.log("✓ Plutarco T2 actualizado");

// Actualizar descripciones con año confirmado y encuadernación
const plutarcoT1Desc = "Traducción de Antonio Ranz Romanillos, consejero de Estado y académico de la Real Academia Española. Impresa en la Imprenta Nacional de Madrid en 1821, primer tomo del set de 5 que apareció entre 1821 y 1830 — la versión al castellano más célebre de Las Vidas Paralelas durante todo el siglo XIX. Subtítulo: \"Vidas de los Hombres Ilustres\". Plutarco compara la vida de ilustres griegos y romanos (Teseo–Rómulo, Licurgo–Numa, etc.) como espejo de virtud y carácter. Encuadernación en pasta española (cuero jaspeado marrón). Pieza de biblioteca con 205 años.";
const plutarcoT2Desc = "Tomo II del set de 5. Traducción clásica de Antonio Ranz Romanillos, impresa en la Imprenta Nacional de Madrid entre 1821 y 1830. Misma encuadernación del Tomo I (pasta española, cuero jaspeado). Pieza decimonónica con 195-205 años. Referencia bibliográfica obligada en estudios clásicos de habla hispana del siglo XIX.";

await s.from("books").update({ description: plutarcoT1Desc, published_year: 1821 }).eq("id", p1.book_id);
await s.from("books").update({ description: plutarcoT2Desc, published_year: 1821 }).eq("id", p2.book_id);
console.log("✓ Descripciones actualizadas con año 1821 y encuadernación");
