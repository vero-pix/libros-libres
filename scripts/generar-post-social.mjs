#!/usr/bin/env node
/**
 * Generador de posts sociales (IG/FB) para la tienda de Vero (@vero).
 *
 * AUTOMATIZA UN BATCH listo para Metricool: elige SOLO tus libros activos con
 * MÁS probabilidad de venderse (cruce con demanda real + categorías que venden
 * + oferta + foto real + colección), y produce para cada uno:
 *   - caption estilo "playbook" (1 libro/post, precio, CTA "pídelo comentando", link)
 *   - tarjeta de marca 1080² (HTML self-contained → capturar a 1:1)
 * Más un CSV y un JSON con TODO el lote y fechas programadas para cargar en Metricool.
 *
 * Uso:
 *   node scripts/generar-post-social.mjs                # top 14, 1/día desde mañana 19:00
 *   node scripts/generar-post-social.mjs --n 20         # top 20
 *   node scripts/generar-post-social.mjs --start 2026-07-25 --hour 19 --every 1
 *
 * Salida en social/ (gitignored):
 *   posts-vero.md · cards/card-NN.html · metricool-batch.json · metricool-batch.csv
 *
 * Seller Vero: username 'vero'. Ranking replicado del análisis de vendibilidad.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const env = fs.readFileSync(".env.local", "utf-8");
for (const l of env.split("\n")) {
  if (l.startsWith("#") || !l.includes("=")) continue;
  const i = l.indexOf("=");
  const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SITE = "https://tuslibros.cl";
const clp = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CL");
const fold = (x) => (x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const SEL = "*, book:books(*), seller:users(id, full_name, username, city)";

// --- args ---
const arg = (name, def) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : def;
};
const N = parseInt(arg("--n", "14"), 10);
const EVERY = parseInt(arg("--every", "1"), 10); // días entre posts
const HOUR = arg("--hour", "19");
const START = arg("--start", null); // YYYY-MM-DD; default mañana

// --- helpers de dominio ---
const cover = (l) => l.cover_image_url ?? l.book?.cover_url ?? null;
const esFotoPropia = (l) => /supabase\.co\/storage|tuslibros\.cl\/storage/.test(l.cover_image_url ?? "");
const libroUrl = (l) => (l.slug ? `/libro/vero/${l.slug}` : `/listings/${l.id}`);
const tieneOferta = (l) => l.original_price && Number(l.original_price) > Number(l.price);

// --- señales de mercado (para el ranking de vendibilidad) ---
async function demandSet() {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data: sq } = await s.from("search_queries").select("query").gt("created_at", since).limit(500);
  const { data: br } = await s.from("book_requests").select("title, author").eq("fulfilled", false);
  return new Set(
    [...(sq || []).map((x) => fold(x.query)), ...(br || []).map((x) => fold(x.title + " " + (x.author || "")))].filter(
      (t) => t && t.length > 3
    )
  );
}
async function topGenres() {
  const { data } = await s.from("listings").select("book:books(genre, category)").eq("status", "completed");
  const g = {};
  for (const l of data || []) {
    const k = fold(l.book?.genre || l.book?.category);
    if (k) g[k] = (g[k] || 0) + 1;
  }
  return new Set(Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k));
}
function score(l, demand, genres) {
  let sc = 0;
  const why = [];
  const t = fold(l.book?.title),
    a = fold(l.book?.author),
    g = fold(l.book?.genre || l.book?.category);
  for (const d of demand) {
    if ((t && (d.includes(t) || t.includes(d))) || (a && a.length > 4 && d.includes(a))) {
      sc += 3;
      why.push("demanda");
      break;
    }
  }
  if (genres.has(g)) (sc += 2), why.push("categoría-vende");
  if (l.is_collectible) (sc += 1), why.push("colección");
  if (tieneOferta(l)) (sc += 1), why.push("oferta");
  if (esFotoPropia(l)) (sc += 1), why.push("foto-real");
  return { sc, why: [...new Set(why)] };
}

// --- caption estilo playbook (voz de Vero, 1 libro/post) ---
const HOOKS_GEN = [
  "De esos que no encuentras en cualquier parte.",
  "Alguien lo leyó; ahora te toca a ti.",
  "Un usado en buen estado, a precio justo.",
  "Para tu próxima lectura, cerca tuyo.",
];
function hookDe(l, i) {
  if (tieneOferta(l)) return "Bajó de precio — los buenos, a precio justo.";
  if (l.is_collectible) return "Rareza: de las que aparecen una vez y no vuelven.";
  return HOOKS_GEN[i % HOOKS_GEN.length];
}
function caption(l, i) {
  const t = l.book?.title?.trim() || "Este libro";
  const a = l.book?.author?.trim();
  const off = tieneOferta(l) ? ` (antes ${clp(l.original_price)})` : "";
  const gtag = fold(l.book?.genre || l.book?.category).replace(/[^a-z0-9]/g, "");
  const url = SITE + libroUrl(l);
  return (
    `${t}${a ? ` — ${a}` : ""}\n` +
    `${hookDe(l, i)}\n` +
    `${clp(l.price)}${off}.\n` +
    `📍 Providencia · retiro en mano o despacho a todo Chile.\n` +
    `Pídelo comentando 👇 o escríbeme.\n` +
    `${url}\n\n` +
    `#librosusados #chile #leerenchile${gtag ? " #" + gtag : ""} #tuslibros`
  );
}

// --- tarjeta de marca 1080² (HTML self-contained) ---
function tarjetaHTML(l) {
  const t = l.book?.title?.trim() || "";
  const a = l.book?.author?.trim() || "";
  const badge = l.is_collectible ? "COLECCIÓN" : tieneOferta(l) ? "OFERTA" : "USADO";
  const c = cover(l);
  const precio = tieneOferta(l)
    ? `<span style="text-decoration:line-through;color:#a99;font-size:30px;margin-right:14px">${clp(l.original_price)}</span>${clp(l.price)}`
    : clp(l.price);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,500;1,400&family=Hanken+Grotesk:wght@500;700&display=swap');
  *{margin:0;box-sizing:border-box}
  body{width:1080px;height:1080px;background:#f4efe6;font-family:'Hanken Grotesk',sans-serif;
       display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;color:#2b2620;position:relative}
  .badge{font-size:20px;letter-spacing:.25em;font-weight:700;color:#b8860b;margin-bottom:32px}
  .cover{width:420px;height:600px;object-fit:cover;border-radius:8px;
         box-shadow:0 24px 60px rgba(0,0,0,.28);background:#e6ddcc}
  .t{font-family:'Newsreader',serif;font-size:56px;line-height:1.1;text-align:center;margin-top:44px;max-width:820px}
  .a{font-style:italic;font-size:30px;color:#6b6151;margin-top:14px}
  .p{font-size:44px;font-weight:700;margin-top:28px}
  .f{position:absolute;bottom:56px;font-weight:700;letter-spacing:.03em;color:#8a7f6b}
</style></head><body>
  <div class="badge">${badge}</div>
  ${c ? `<img class="cover" src="${c}" alt="">` : `<div class="cover"></div>`}
  <div class="t">${t}</div>
  ${a ? `<div class="a">${a}</div>` : ""}
  <div class="p">${precio}</div>
  <div class="f">tuslibros.cl</div>
</body></html>`;
}

// --- fechas programadas ---
function fechaPost(i) {
  const base = START ? new Date(START + "T00:00:00") : new Date(Date.now() + 864e5); // default mañana
  const d = new Date(base.getTime() + i * EVERY * 864e5);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${String(HOUR).padStart(2, "0")}:00`;
}
const csvCell = (v) => `"${String(v).replace(/"/g, '""')}"`;

// --- main ---
const { data: veroUser } = await s.from("users").select("id").eq("username", "vero").maybeSingle();
if (!veroUser) {
  console.error("No encontré la cuenta @vero.");
  process.exit(1);
}

// Traer TODOS los activos de Vero (paginado) con portada
let mine = [],
  fromIdx = 0;
while (true) {
  const { data } = await s
    .from("listings")
    .select(SEL)
    .eq("seller_id", veroUser.id)
    .eq("status", "active")
    .range(fromIdx, fromIdx + 199);
  if (!data?.length) break;
  mine = mine.concat(data);
  if (data.length < 200) break;
  fromIdx += 200;
}
mine = mine.filter((l) => cover(l));

const demand = await demandSet();
const genres = await topGenres();
const scored = mine
  .map((l) => ({ l, ...score(l, demand, genres) }))
  .sort((a, b) => b.sc - a.sc || (esFotoPropia(b.l) ? 1 : 0) - (esFotoPropia(a.l) ? 1 : 0));
// Dedup por título (no postear el mismo libro dos veces aunque haya copias)
const seenTitle = new Set();
const ranked = [];
for (const r of scored) {
  const key = fold(r.l.book?.title);
  if (key && seenTitle.has(key)) continue;
  if (key) seenTitle.add(key);
  ranked.push(r);
  if (ranked.length >= N) break;
}

if (!ranked.length) {
  console.error("Sin libros activos con portada en @vero.");
  process.exit(1);
}

// --- escribir salida ---
const dir = "social";
const cardsDir = path.join(dir, "cards");
fs.mkdirSync(cardsDir, { recursive: true });

const batch = [];
let md = `# Posts programados — tienda @vero (top ${ranked.length} por vendibilidad)\n\n`;
md += `Generado para cargar en Metricool. Cadencia: 1 post cada ${EVERY} día(s) a las ${HOUR}:00.\n\n`;

ranked.forEach((r, i) => {
  const l = r.l;
  const cap = caption(l, i);
  const url = SITE + libroUrl(l);
  const img = cover(l);
  const nn = String(i + 1).padStart(2, "0");
  const cardFile = `cards/card-${nn}.html`;
  fs.writeFileSync(path.join(dir, cardFile), tarjetaHTML(l));

  batch.push({
    date: fechaPost(i),
    text: cap,
    image: img, // foto real: URL usable directo en Metricool
    card: `social/${cardFile}`, // alternativa de marca (capturar 1:1)
    link: url,
    networks: ["instagram", "facebook"],
    book: { title: l.book?.title, author: l.book?.author, price: Number(l.price) },
    score: r.sc,
    why: r.why,
  });

  md += `## ${i + 1}. ${l.book?.title}${l.book?.author ? " — " + l.book.author : ""}  ·  ${clp(l.price)}\n`;
  md += `🗓️ ${fechaPost(i)}  ·  score ${r.sc} (${r.why.join(", ")})\n\n`;
  md += "```\n" + cap + "\n```\n";
  md += `🖼️ Imagen (foto real): ${img}\n`;
  md += `🎨 Tarjeta de marca alternativa: ${cardFile} (abrir y capturar a 1080×1080)\n\n---\n\n`;
});

fs.writeFileSync(path.join(dir, "posts-vero.md"), md);
fs.writeFileSync(path.join(dir, "metricool-batch.json"), JSON.stringify(batch, null, 2));

// CSV (columnas amigables para importar/pegar en Metricool)
const csv =
  "Date,Text,Image,Link,Networks\n" +
  batch
    .map((b) => [b.date, b.text, b.image, b.link, b.networks.join(" ")].map(csvCell).join(","))
    .join("\n");
fs.writeFileSync(path.join(dir, "metricool-batch.csv"), csv);

// --- consola ---
console.log(`\n📚 Tienda @vero — ${mine.length} activos con portada · top ${ranked.length} elegidos por vendibilidad\n`);
ranked.forEach((r, i) => {
  console.log(
    `${String(i + 1).padStart(2)}. [${r.sc}] ${r.l.book?.title}${r.l.book?.author ? " — " + r.l.book.author : ""}  ·  ${clp(r.l.price)}  ·  ${fechaPost(i)}  ·  ${r.why.join(",")}`
  );
});
console.log(`\n💾 social/ → posts-vero.md · cards/card-NN.html (${ranked.length}) · metricool-batch.json · metricool-batch.csv\n`);
