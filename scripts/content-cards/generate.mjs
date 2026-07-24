/**
 * CLI del generador de tarjetas de contenido.
 *
 *   npm run cards                                # usa content/cards/lote-1.json
 *   npm run cards -- content/cards/otro.json     # spec explícito
 *
 * Por cada pieza del spec: arma el/los SVG con su plantilla, los pasa a PNG con
 * resvg y escribe content-out/NN_template_slug.png. Al final deja
 * content-out/manifest.json con una entrada por pieza (= un post futuro),
 * pensado para el auto-posteo con la Graph API de Meta.
 *
 * Nota: se ejecuta con tsx (no node pelado) para poder importar los módulos .ts
 * hermanos — misma convención que el resto de scripts del repo (seo, bulk-upload).
 */
import fs from "node:fs";
import path from "node:path";
import { fetchListing } from "./fetchListing.ts";
import { fichaTemplate, tipograficaTemplate, listaTemplate } from "./templates.ts";
import { svgToPng } from "./render.ts";

const OUT_DIR = path.resolve(process.cwd(), "content-out");

function slugify(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

async function main() {
  const specPath = process.argv[2] || "content/cards/lote-1.json";
  const abs = path.resolve(process.cwd(), specPath);
  if (!fs.existsSync(abs)) {
    console.error(`✗ No encuentro el spec: ${specPath}`);
    process.exit(1);
  }

  const spec = JSON.parse(fs.readFileSync(abs, "utf-8"));
  const pieces = Array.isArray(spec.pieces) ? spec.pieces : [];
  if (pieces.length === 0) {
    console.error("✗ El spec no tiene 'pieces'.");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`\n🎨 Generando ${pieces.length} pieza(s) desde ${specPath}\n`);

  const manifest = [];

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const n = pad2(i + 1);
    const tpl = piece.template;
    const archivos = [];

    try {
      if (tpl === "ficha") {
        const ref = piece.slug || piece.listingId;
        const listing = ref ? await fetchListing(ref) : null;
        if (!listing) {
          console.warn(`  ⚠ [${n}] ficha: no se encontró "${ref}" en el catálogo — se omite.`);
          continue;
        }
        const file = `${n}_ficha_${slugify(piece.slug || listing.title)}.png`;
        fs.writeFileSync(path.join(OUT_DIR, file), svgToPng(fichaTemplate(piece, listing)));
        archivos.push(file);
        console.log(`  ✓ [${n}] ficha  → ${file}   (${listing.title}${listing.coverDataUri ? "" : " · SIN portada"})`);
      } else if (tpl === "tipografica") {
        const listing = piece.slug ? await fetchListing(piece.slug) : null;
        const file = `${n}_tipografica_${slugify(piece.kicker || piece.headline || "frase")}.png`;
        fs.writeFileSync(path.join(OUT_DIR, file), svgToPng(tipograficaTemplate(piece, listing)));
        archivos.push(file);
        console.log(`  ✓ [${n}] tipografica  → ${file}`);
      } else if (tpl === "lista") {
        const refs = Array.isArray(piece.slugs) ? piece.slugs : [];
        const fetched = (await Promise.all(refs.map((r) => fetchListing(r)))).filter(Boolean);
        if (fetched.length === 0) {
          console.warn(`  ⚠ [${n}] lista: ninguno de los slugs existe — se omite.`);
          continue;
        }
        const svgs = listaTemplate(piece, fetched);
        svgs.forEach((svg, li) => {
          const file = `${n}_lista_${pad2(li + 1)}.png`;
          fs.writeFileSync(path.join(OUT_DIR, file), svgToPng(svg));
          archivos.push(file);
        });
        console.log(`  ✓ [${n}] lista  → ${archivos.length} lámina(s)   (${fetched.length}/${refs.length} portadas)`);
      } else {
        console.warn(`  ⚠ [${n}] plantilla desconocida: "${tpl}" — se omite.`);
        continue;
      }
    } catch (e) {
      console.error(`  ✗ [${n}] ${tpl}: ${e?.message ?? e}`);
      continue;
    }

    manifest.push({
      archivo: archivos[0],
      archivos, // todas las imágenes de la pieza (carrusel = un post)
      template: tpl,
      caption: piece.caption ?? "",
      primer_comentario: piece.firstComment ?? null,
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n📦 manifest.json con ${manifest.length} pieza(s) → content-out/manifest.json\n`);
}

main().catch((e) => {
  console.error(e?.stack ?? e);
  process.exit(1);
});
