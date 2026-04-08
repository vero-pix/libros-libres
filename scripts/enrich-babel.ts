import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const key = line.slice(0, idx).trim();
  const val = line.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const updates = [
  { match: "La puerta en el muro", desc: "Relato fantástico de H.G. Wells donde un hombre descubre de niño una puerta que conduce a un jardín encantado de belleza sobrenatural. A lo largo de su vida, la puerta reaparece en los momentos más inesperados, planteando un dilema entre el mundo real y la promesa de lo maravilloso. Edición de la mítica colección La Biblioteca de Babel, dirigida por Jorge Luis Borges para Ediciones Siruela. Pieza de coleccionista." },
  { match: "Bartleby el escribiente", desc: "La célebre novela corta de Herman Melville sobre un escribiente de Wall Street que responde a cada petición con un enigmático «Preferiría no hacerlo». Una de las obras más influyentes de la literatura universal, en la traducción personal de Jorge Luis Borges. Edición de la colección La Biblioteca de Babel (Franco Maria Ricci / Librería La Ciudad). Pieza de coleccionista de alto valor." },
  { match: "El cardenal Napellus", desc: "Cuentos fantásticos de Gustav Meyrink, autor de El Golem, seleccionados y prologados por Jorge Luis Borges. Relatos donde lo sobrenatural se filtra en la realidad con una atmósfera inquietante y onírica, entre la tradición gótica centroeuropea y el esoterismo. Edición de la colección La Biblioteca de Babel (Franco Maria Ricci / Librería La Ciudad). Pieza de coleccionista." },
  { match: "Conversacion en la Catedral", desc: "Primera parte de la monumental novela de Mario Vargas Llosa. En un bar limeño llamado La Catedral, Santiago Zavala y el zambo Ambrosio reconstruyen en una larga conversación los años de la dictadura de Odría y el deterioro moral de toda una sociedad. Considerada una de las grandes novelas latinoamericanas del siglo XX. Edición antigua de Seix Barral." },
  { match: "Euforia y Utopia", desc: "Obra autobiográfica de Arthur Koestler donde el autor húngaro-británico reflexiona sobre sus experiencias políticas e intelectuales, desde su militancia comunista hasta su desencanto con las utopías totalitarias. Edición Emecé 1955, traducción de Alberto Luis Bixio. Ejemplar raro y descatalogado." },
];

async function main() {
  for (const u of updates) {
    const { data } = await supabase.from("books").select("id, title").ilike("title", "%" + u.match + "%");
    if (!data?.length) { console.log("! No encontrado:", u.match); continue; }
    for (const book of data) {
      const { error } = await supabase.from("books").update({ description: u.desc }).eq("id", book.id);
      console.log(error ? "  Error: " + book.title : "  ✓ " + book.title);
    }
  }
}

main();
