#!/usr/bin/env node
/**
 * Generador de posts sociales (IG/FB) desde el catálogo de tuslibros.cl.
 *
 * Cada día elige un libro con "mezcla rotativa" (colección / reciente / oferta),
 * arma el caption en voz de Vero y produce DOS versiones de imagen:
 *   A) foto real del vendedor (cover_image_url) — lista para publicar
 *   B) tarjeta de marca (HTML self-contained) — abrir y capturar a 1:1
 *
 * Salida: social/post-AAAAMMDD-{A.md,B.html,metricool.json}
 *
 * Uso:
 *   node scripts/generar-post-social.mjs            # libro de hoy
 *   node scripts/generar-post-social.mjs --day 1    # simular otro día (0=colección,1=reciente,2=oferta)
 *
 * Reutiliza la lógica de: lib/urls.ts (libroUrl), app/(main)/page.tsx (ventana diaria),
 * components/listings/ListingCard.tsx (portada + comuna). Conexión: patrón scripts/*.mjs.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// --- env (.env.local a mano, como el resto de scripts) ---
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

// --- args ---
const dayArg = process.argv.indexOf("--day");
const DAY = dayArg > -1 ? parseInt(process.argv[dayArg + 1], 10) : Math.floor(Date.now() / 86_400_000);
const CATS = ["coleccion", "reciente", "oferta"];
const cat = CATS[((DAY % 3) + 3) % 3];

// --- helpers de dominio (replicados de la app) ---
const SEL = "*, book:books(*), seller:users(id, full_name, username, city)";
const cover = (l) => l.cover_image_url ?? l.book?.cover_url ?? null;
// Foto REAL del vendedor = imagen alojada en el storage de Supabase (no portada de catálogo externa).
const esFotoPropia = (l) => /supabase\.co\/storage|tuslibros\.cl\/storage/.test(l.cover_image_url ?? "");
const libroUrl = (l) =>
  l.slug && l.seller?.username ? `/libro/${l.seller.username}/${l.slug}` : `/listings/${l.id}`;
const comuna = (l) => {
  const fromAddr = l.address?.split(",")[1]?.trim();
  return fromAddr || l.seller?.city || null;
};
const firstName = (l) => l.seller?.full_name?.split(" ")[0] || "un vendedor";

// --- selección por categoría (con fallback) ---
async function candidatos() {
  let q = s.from("listings").select(SEL).eq("status", "active").neq("deprioritized", true);
  if (cat === "coleccion") q = q.eq("is_collectible", true).order("created_at", { ascending: true });
  else if (cat === "reciente")
    q = q.gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()).order("created_at", { ascending: false });
  else q = q.not("original_price", "is", null).order("created_at", { ascending: true });
  let { data } = await q.limit(120);
  data = (data ?? []).filter((l) => cover(l));
  if (cat === "oferta") data = data.filter((l) => Number(l.original_price) > Number(l.price));
  // preferir los que tienen FOTO REAL del vendedor (storage propio, mejor para IG)
  data.sort((a, b) => (esFotoPropia(b) ? 1 : 0) - (esFotoPropia(a) ? 1 : 0));
  return data;
}

// --- captions en voz de Vero (gancho por categoría, rota por día) ---
function caption(l) {
  const t = l.book?.title?.trim() || "este libro";
  const a = l.book?.author?.trim();
  const autor = a ? ` de ${a}` : "";
  const donde = comuna(l) ? ` en ${comuna(l)}` : "";
  const precio = clp(l.price);
  const off =
    cat === "oferta" && Number(l.original_price) > Number(l.price)
      ? ` (antes ${clp(l.original_price)})`
      : "";
  const url = SITE + libroUrl(l);

  const hooks = {
    coleccion: [
      `Rareza del día 📚\n\n*${t}*${autor}. De esos que no encuentras en cualquier parte — está${donde}, a ${precio}.\n\n¿Te lo llevas antes que otro?\n${url}`,
      `Hay libros que aparecen una vez y no vuelven.\n\n*${t}*${autor} es uno de esos. ${precio}${donde}.\n\nMíralo acá 👇\n${url}`,
    ],
    reciente: [
      `Recién llegó al catálogo 🆕\n\n*${t}*${autor} — ${precio}${donde}.\n\nAlguien lo leyó, ahora te toca a ti.\n${url}`,
      `Nuevo${donde}: *${t}*${autor}.\n\n${precio}, listo para su próxima lectura.\n${url}`,
    ],
    oferta: [
      `Bajó de precio 🏷️\n\n*${t}*${autor} — ahora ${precio}${off}.\n\nLos buenos a precio justo${donde}.\n${url}`,
      `Oferta del día: *${t}*${autor}.\n\n${precio}${off}. Sin cajas en la bodega, directo a tu repisa.\n${url}`,
    ],
  };
  const arr = hooks[cat];
  const base = arr[DAY % arr.length];
  return base + `\n\n#librosusados #chile #leerenchile #tuslibros`;
}

// --- tarjeta de marca (HTML self-contained, 1:1) ---
function tarjetaHTML(l) {
  const t = l.book?.title?.trim() || "";
  const a = l.book?.author?.trim() || "";
  const precio = clp(l.price);
  const badge = cat === "coleccion" ? "COLECCIÓN" : cat === "oferta" ? "OFERTA" : "NUEVO";
  const c = cover(l);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,500;1,400&family=Hanken+Grotesk:wght@500;700&display=swap');
  *{margin:0;box-sizing:border-box}
  body{width:1080px;height:1080px;background:#f4efe6;font-family:'Hanken Grotesk',sans-serif;
       display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;color:#2b2620}
  .badge{font-size:20px;letter-spacing:.25em;font-weight:700;color:#b8860b;margin-bottom:32px}
  .cover{width:420px;height:600px;object-fit:cover;border-radius:8px;
         box-shadow:0 24px 60px rgba(0,0,0,.28);background:#e6ddcc}
  .t{font-family:'Newsreader',serif;font-size:56px;line-height:1.1;text-align:center;margin-top:44px;max-width:820px}
  .a{font-style:italic;font-size:30px;color:#6b6151;margin-top:14px}
  .p{font-size:44px;font-weight:700;margin-top:28px}
  .f{position:absolute;bottom:56px;font-weight:700;letter-spacing:.03em;color:#8a7f6b}
</style></head><body>
  <div class="badge">${badge} · DEL DÍA</div>
  ${c ? `<img class="cover" src="${c}" alt="">` : `<div class="cover"></div>`}
  <div class="t">${t}</div>
  ${a ? `<div class="a">${a}</div>` : ""}
  <div class="p">${precio}</div>
  <div class="f">tuslibros.cl</div>
</body></html>`;
}

// --- main ---
const lista = await candidatos();
if (!lista.length) {
  console.error(`Sin candidatos activos para la categoría "${cat}". Prueba otro --day.`);
  process.exit(1);
}
const pick = lista[DAY % lista.length];
const url = SITE + libroUrl(pick);
const cap = caption(pick);
const img = cover(pick);
const tieneFotoPropia = esFotoPropia(pick);

// carpeta social/ (gitignored)
const dir = "social";
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const baseName = `post-${stamp}-${cat}`;

// A) markdown (foto real) + B) tarjeta HTML + JSON intermedio para Metricool
fs.writeFileSync(path.join(dir, `${baseName}-A.md`), `${cap}\n\n---\nImagen (foto real): ${img}\nLink: ${url}\n`);
fs.writeFileSync(path.join(dir, `${baseName}-B.html`), tarjetaHTML(pick));
const metricool = {
  text: cap,
  link: url,
  networks: ["instagram", "facebook"],
  imageOptionA: img, // foto real del vendedor
  imageOptionB: `social/${baseName}-B.html`, // capturar a 1:1
  book: { title: pick.book?.title, author: pick.book?.author, price: Number(pick.price) },
  category: cat,
};
fs.writeFileSync(path.join(dir, `${baseName}-metricool.json`), JSON.stringify(metricool, null, 2));

// --- consola ---
console.log(`\n📅 Día ${DAY} → categoría: ${cat.toUpperCase()}`);
console.log(`📖 ${pick.book?.title}${pick.book?.author ? " — " + pick.book.author : ""}  ·  ${clp(pick.price)}  ·  por ${firstName(pick)}${comuna(pick) ? " en " + comuna(pick) : ""}`);
console.log(`🖼️  foto propia del vendedor: ${tieneFotoPropia ? "SÍ ✅" : "no (usa portada de catálogo)"}`);
console.log(`🔗 ${url}`);
console.log(`\n--- CAPTION ---\n${cap}`);
console.log(`\n💾 Guardado en social/${baseName}-{A.md, B.html, metricool.json}\n`);
