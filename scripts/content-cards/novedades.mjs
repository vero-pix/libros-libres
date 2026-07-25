/**
 * Alimenta el destacado "Novedades" de Instagram de forma automática.
 *
 *   npm run novedades              # 3 historias (por defecto)
 *   npm run novedades -- 5         # 5 historias
 *   npm run novedades -- 3 "Del catálogo"   # cambia el kicker
 *
 * Autoselecciona los libros MÁS RECIENTES de Vero que tengan FOTO REAL del
 * ejemplar y renderiza una HISTORIA vertical (1080×1920) por cada uno, en la
 * identidad de tuslibros. Salida en content-out/novedades/ + manifest.json.
 *
 * Pensado para correr semanal (scheduled task o cron): siempre deja un lote
 * fresco de historias listas para subir al destacado "Novedades".
 *
 * Se ejecuta con tsx (importa módulos .ts hermanos), igual que generate.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fetchRecentVero } from "./fetchListing.ts";
import { historiaFichaTemplate } from "./templates.ts";
import { svgToPng } from "./render.ts";

const OUT_DIR = path.resolve(process.cwd(), "content-out", "novedades");

function slugify(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

async function main() {
  const count = Math.max(1, Math.min(10, parseInt(process.argv[2] || "3", 10) || 3));
  const kicker = process.argv[3] || "Recién llegado";

  console.log(`\n📚 Novedades → autoseleccionando ${count} libro(s) de Vero con foto real…\n`);
  const listings = await fetchRecentVero(count);

  if (listings.length === 0) {
    console.error("✗ No hay listings de Vero con foto real. Nada que generar.");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];

  listings.forEach((listing, i) => {
    const n = pad2(i + 1);
    const file = `${n}_${slugify(listing.title)}.png`;
    const svg = historiaFichaTemplate({ template: "historia", kicker }, listing);
    fs.writeFileSync(path.join(OUT_DIR, file), svgToPng(svg));
    const precio = listing.price != null ? "$" + listing.price.toLocaleString("es-CL") : "";
    const caption =
      `${listing.title}${listing.author ? " · " + listing.author : ""}${precio ? " — " + precio : ""}\n\n` +
      `Recién llegado a tuslibros.cl 📚 Envío a todo Chile o retiro en mano.`;
    manifest.push({ archivo: file, template: "historia", title: listing.title, price: listing.price, caption });
    console.log(`  ✓ [${n}] ${file}   (${listing.title}${precio ? " · " + precio : ""})`);
  });

  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n📦 ${listings.length} historia(s) → content-out/novedades/  (+ manifest.json)\n`);
}

main().catch((e) => {
  console.error(e?.stack ?? e);
  process.exit(1);
});
