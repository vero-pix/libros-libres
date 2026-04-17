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

const { data } = await s
  .from("listings")
  .select(`
    id, price, condition, status, featured, deprioritized, cover_image_url,
    book:books(title, author, cover_url, language, genre, category),
    seller:users(id, full_name, mercadopago_user_id, plan)
  `)
  .eq("status", "active");

const CHILENOS = /\b(parra|bola[ñn]o|neruda|mistral|zambra|lemebel|allende|skarmeta|donoso|dorfman|hernan rivera|diamela eltit|ra[úu]l zurita|jos[eé] donoso|pedro lemebel|alberto fuguet|marcela serrano|isabel allende|roberto bola[ñn]o|nicanor parra)\b/i;
const PESADOS = /\b(garc[íi]a m[áa]rquez|borges|cort[áa]zar|rulfo|vargas llosa|onetti|sabato|arlt|bioy casares|puig|ribeyro|monterroso|ocampo|walsh|pi[ñn]ol|galeano|paz|fuentes|pitol|aira)\b/i;
const CONTEMPORANEOS = /\b(enriquez|melchor|schweblin|luiselli|pron|zambra|ojeda|cabez[oó]n|castellanos moya|nettel|harwicz|yuszczuk|rooney|ferrante|knausgard|murakami|han|harari|kahneman|saunders|franzen|atwood|cusk|tokarczuk|ernaux)\b/i;
const CLASICOS_GLOBALES = /\b(kafka|dostoievski|dostoyevski|tolstoi|tolstoy|chekhov|shakespeare|camus|sartre|hesse|woolf|joyce|proust|nietzsche|orwell|huxley|bradbury|poe|wilde|fitzgerald|hemingway|faulkner|nabokov|mann|kundera|calvino|pavese|pessoa|rilke|rimbaud|baudelaire)\b/i;

function ranking(l) {
  const title = (l.book?.title ?? "").toLowerCase();
  const author = (l.book?.author ?? "").toLowerCase();
  const txt = title + " " + author;
  let score = 0;
  const reasons = [];

  const hasCustomCover = !!l.cover_image_url;
  const hasCover = hasCustomCover || !!l.book?.cover_url;
  if (hasCustomCover) { score += 3; reasons.push("portada-propia"); }
  else if (hasCover) { score += 1; reasons.push("portada-default"); }
  else { score -= 5; reasons.push("SIN-PORTADA"); }

  if (CHILENOS.test(txt)) { score += 5; reasons.push("chileno"); }
  else if (PESADOS.test(txt)) { score += 4; reasons.push("boom-latam"); }
  else if (CONTEMPORANEOS.test(txt)) { score += 4; reasons.push("contemporáneo"); }
  else if (CLASICOS_GLOBALES.test(txt)) { score += 3; reasons.push("clásico-global"); }

  if (l.seller?.mercadopago_user_id) { score += 2; reasons.push("MP"); }
  else { score -= 3; reasons.push("SIN-MP"); }

  const lang = l.book?.language;
  if (lang && lang !== "es") { score -= 3; reasons.push(`idioma-${lang}`); }

  if (l.price >= 5000 && l.price <= 30000) { score += 1; reasons.push("precio-sweet"); }
  else if (l.price < 3000) { score -= 1; reasons.push("precio-bajo"); }
  else if (l.price > 50000) { score -= 1; reasons.push("precio-alto"); }

  if (l.condition === "new" || l.condition === "like_new") { score += 1; reasons.push("cond-alta"); }

  if (l.deprioritized) { score -= 20; reasons.push("DEPRIORITIZED"); }

  if (l.featured) reasons.push("YA-FEATURED");

  return { score, reasons };
}

const scored = (data || [])
  .map((l) => ({ ...l, _rank: ranking(l) }))
  .filter((l) => l._rank.score > 2)
  .sort((a, b) => b._rank.score - a._rank.score);

console.log(`Total activos: ${data?.length}, ranking > 2: ${scored.length}\n`);
console.log("TOP 30 CANDIDATOS A DESTACADOS:\n");
scored.slice(0, 30).forEach((l, i) => {
  const title = l.book?.title ?? "?";
  const author = l.book?.author ?? "?";
  const seller = l.seller?.full_name ?? "?";
  const featured = l.featured ? "★ YA" : "  ";
  console.log(
    `${String(i + 1).padStart(2)}. [${String(l._rank.score).padStart(2)}] ${featured} ${title.slice(0, 45).padEnd(45)} | ${author.slice(0, 25).padEnd(25)} | $${String(l.price).padStart(6)} | ${seller.slice(0, 20).padEnd(20)} | ${l._rank.reasons.join(",")}`
  );
});

const alreadyFeatured = (data || []).filter((l) => l.featured);
console.log(`\nActualmente featured: ${alreadyFeatured.length}`);
alreadyFeatured.forEach((l) => {
  console.log(`  • ${l.book?.title} — ${l.book?.author} (${l.id})`);
});
