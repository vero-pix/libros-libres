/**
 * Plantillas SVG (1080×1080) para las tarjetas de contenido. Cada función
 * devuelve el/los SVG listos para pasar a resvg. Tres plantillas cubren casi
 * todo: `ficha`, `tipografica` y `lista`.
 *
 * Reglas de composición: margen ≥88, nada se corta ni se solapa, dos pesos
 * tipográficos (Playfair 700 + Inter 400/600), portadas con recorte tipo cover.
 */
import {
  CANVAS,
  COLORS,
  FONTS,
  MARGIN,
  backgroundSvg,
  cleanTitle,
  conditionLabel,
  escapeXml,
  footerSvg,
  formatCLP,
  kickerSvg,
  pagerSvg,
  wrapText,
} from "./brand";
import type { Listing } from "./fetchListing";

export type Piece = {
  template: "ficha" | "tipografica" | "lista";
  slug?: string;
  listingId?: string;
  slugs?: string[];
  kicker?: string;
  headline?: string;
  sub?: string;
  caption?: string;
  firstComment?: string;
};

let CLIP_SEQ = 0;

/** Los `\n` literales del JSON (escritos como "\\n") pasan a saltos reales. */
function normalizeBreaks(s: string): string {
  return String(s ?? "").replace(/\\n/g, "\n");
}

/**
 * Portada real recortada tipo object-fit: cover, con sombra suave y borde.
 * Si no hay portada, deja un panel de marca (no rompe el layout).
 */
function coverBox(
  dataUri: string | null,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 18
): string {
  const id = `clip${CLIP_SEQ++}`;
  const shadow = `<rect x="${x + 10}" y="${y + 14}" width="${w}" height="${h}" rx="${radius}" fill="${COLORS.ink}" opacity="0.12"/>`;
  // Marco fino en tinta (ink): enmarca la foto real como una lámina.
  const border = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="none" stroke="${COLORS.ink}" stroke-width="1.5" opacity="0.9"/>`;

  if (!dataUri) {
    return `
      ${shadow}
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${COLORS.creamWarm}"/>
      <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" font-family="${FONTS.sansSemibold}"
            font-size="22" letter-spacing="2" fill="${COLORS.muted}" style="text-transform:uppercase">tuslibros.cl</text>
      ${border}`;
  }

  return `
    ${shadow}
    <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}"/></clipPath>
    <image href="${dataUri}" x="${x}" y="${y}" width="${w}" height="${h}"
           preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>
    ${border}`;
}

/* ─────────────────────────── FICHA ─────────────────────────── */
/** Portada protagonista a la izquierda; a la derecha, texto y precio. */
export function fichaTemplate(piece: Piece, listing: Listing): string {
  const coverX = MARGIN;
  const coverW = 380;
  const coverH = 560;
  const coverY = 250;

  const tx = coverX + coverW + 64; // inicio columna de texto
  const tw = CANVAS - MARGIN - tx; // ancho de texto

  // Auto-escala la fuente del título según su largo: los medianos entran en
  // 2 líneas sin truncarse en la columna angosta, los cortos se ven grandes.
  const cleaned = cleanTitle(listing.title);
  const titleFont =
    cleaned.length > 40 ? 38 : cleaned.length > 24 ? 44 : cleaned.length > 16 ? 52 : 58;
  const titleLH = Math.round(titleFont * 1.14);
  const titleLines = wrapText(cleaned, {
    maxWidth: tw,
    fontSize: titleFont,
    family: "serif",
    maxLines: 2,
  });

  // El bloque de la derecha (kicker + título + autor + precio + condición) se
  // centra verticalmente respecto a la portada, así una ficha de título corto
  // no queda flotando arriba con el tercio inferior vacío.
  const kickerGap = 84; // del kicker al arranque del título
  const authorGap = listing.author ? 74 : 0;
  const priceGap = formatCLP(listing.price) ? 44 : 0;
  const condGap = conditionLabel(listing.condition) ? 40 : 0;
  const blockH =
    kickerGap + titleLines.length * titleLH + authorGap + priceGap + condGap;
  const coverMid = coverY + coverH / 2;
  const kickerY = Math.max(300, Math.round(coverMid - blockH / 2));
  const titleTop = kickerY + kickerGap;

  const titleSvg = titleLines
    .map(
      (ln, i) =>
        `<text x="${tx}" y="${titleTop + i * titleLH}" font-family="${FONTS.serif}" font-weight="700" font-size="${titleFont}" fill="${COLORS.ink}">${escapeXml(ln)}</text>`
    )
    .join("\n");
  const titleBottom = titleTop + (titleLines.length - 1) * titleLH;

  let cursor = titleBottom + 62;
  // Autor recortado a una línea al ancho de la columna (no se desborda del canvas).
  const authorLine = listing.author
    ? wrapText(listing.author, { maxWidth: tw, fontSize: 30, family: "sans", maxLines: 1 })[0]
    : "";
  const authorSvg = authorLine
    ? `<text x="${tx}" y="${cursor}" font-family="${FONTS.sans}" font-style="italic" font-size="30" fill="${COLORS.muted}">${escapeXml(authorLine)}</text>`
    : "";
  if (listing.author) cursor += 74;

  const priceStr = formatCLP(listing.price);
  const priceSvg = priceStr
    ? `<text x="${tx}" y="${cursor}" font-family="${FONTS.sansSemibold}" font-size="52" fill="${COLORS.amber}">${escapeXml(priceStr)}</text>`
    : "";
  if (priceStr) cursor += 44;

  const cond = conditionLabel(listing.condition);
  const condSvg = cond
    ? `<text x="${tx}" y="${cursor}" font-family="${FONTS.sans}" font-size="26" fill="${COLORS.muted}">${escapeXml(cond)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
    ${backgroundSvg(COLORS.cream)}
    ${coverBox(listing.coverDataUri, coverX, coverY, coverW, coverH)}
    ${kickerSvg(piece.kicker || "Recién llegado", tx, kickerY)}
    ${titleSvg}
    ${authorSvg}
    ${priceSvg}
    ${condSvg}
    ${footerSvg(coverX, 936)}
  </svg>`;
}

/* ──────────────────────── TIPOGRÁFICA ──────────────────────── */
/** Frase/dato grande en Playfair sobre crema. Portada chica opcional. */
export function tipograficaTemplate(piece: Piece, listing: Listing | null): string {
  const headline = normalizeBreaks(piece.headline || "");
  const sub = normalizeBreaks(piece.sub || "");

  // Escala el titular según su largo para que respire sin cortarse.
  const longest = headline.split("\n").reduce((m, l) => Math.max(m, l.length), 0);
  const fontSize = longest > 34 ? 66 : longest > 22 ? 80 : 94;
  const lh = Math.round(fontSize * 1.16);

  const lines = wrapText(headline, {
    maxWidth: CANVAS - MARGIN * 2,
    fontSize,
    family: "serif",
    maxLines: 6,
  });

  const blockH = lines.length * lh + (sub ? 70 : 0);
  let y = Math.max(340, Math.round((CANVAS - blockH) / 2) + fontSize); // centrado vertical

  const headlineSvg = lines
    .map((ln, i) => {
      const yy = y + i * lh;
      return `<text x="${MARGIN}" y="${yy}" font-family="${FONTS.serif}" font-weight="700" font-size="${fontSize}" fill="${COLORS.ink}">${escapeXml(ln)}</text>`;
    })
    .join("\n");

  const subY = y + (lines.length - 1) * lh + 66;
  const subSvg = sub
    ? wrapText(sub, { maxWidth: CANVAS - MARGIN * 2, fontSize: 34, family: "sans", maxLines: 3 })
        .map(
          (ln, i) =>
            `<text x="${MARGIN}" y="${subY + i * 46}" font-family="${FONTS.sans}" font-size="34" fill="${COLORS.muted}">${escapeXml(ln)}</text>`
        )
        .join("\n")
    : "";

  // Portada chica opcional en la esquina inferior derecha.
  const cornerCover =
    listing && listing.coverDataUri
      ? coverBox(listing.coverDataUri, CANVAS - MARGIN - 150, CANVAS - MARGIN - 222 - 40, 150, 222, 12)
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
    ${backgroundSvg(COLORS.cream)}
    ${kickerSvg(piece.kicker || "¿Sabías que…?", MARGIN, 210)}
    ${headlineSvg}
    ${subSvg}
    ${cornerCover}
    ${footerSvg(MARGIN, CANVAS - MARGIN + 8)}
  </svg>`;
}

/* ───────────────────────────── LISTA ───────────────────────── */
/** Grilla de portadas reales con precio. Emite varias láminas si hay >6. */
export function listaTemplate(piece: Piece, listings: Listing[]): string[] {
  const perLamina = 6;
  const laminas: Listing[][] = [];
  for (let i = 0; i < listings.length; i += perLamina) {
    laminas.push(listings.slice(i, i + perLamina));
  }
  if (laminas.length === 0) laminas.push([]);

  const total = laminas.length;
  return laminas.map((items, li) => renderLamina(piece, items, li + 1, total));
}

function renderLamina(piece: Piece, items: Listing[], index: number, total: number): string {
  const cols = 3;
  const gap = 40;
  const cellW = Math.floor((CANVAS - MARGIN * 2 - gap * (cols - 1)) / cols); // ~274
  const coverW = 160;
  const coverH = 240; // 2:3, un pelín más chica para dar aire a títulos de 2 líneas
  const cellPadX = Math.floor((cellW - coverW) / 2);

  // Grilla de 2 filas dentro del área útil, dejando ~80px abajo para el footer.
  const gridTop = 210;
  const rowH = 376; // portada (240) + título (hasta 2 líneas) + precio + aire, sin invadir el footer

  const cells = items
    .map((l, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const cellX = MARGIN + c * (cellW + gap);
      const x = cellX + cellPadX;
      const y = gridTop + r * rowH;
      const centerX = cellX + Math.floor(cellW / 2);

      const cover = coverBox(l.coverDataUri, x, y, coverW, coverH, 12);

      const titleLineH = 28;
      const titleLines = wrapText(cleanTitle(l.title), {
        maxWidth: cellW,
        fontSize: 22,
        family: "sans",
        maxLines: 2,
      });
      const titleSvg = titleLines
        .map(
          (ln, ti) =>
            `<text x="${centerX}" y="${y + coverH + 38 + ti * titleLineH}" text-anchor="middle" font-family="${FONTS.sans}" font-size="22" fill="${COLORS.muted}">${escapeXml(ln)}</text>`
        )
        .join("\n");

      // El precio va bajo la última línea del título (1 o 2 líneas).
      const priceY = y + coverH + 38 + (titleLines.length - 1) * titleLineH + 34;
      const priceStr = formatCLP(l.price);
      const priceSvg = priceStr
        ? `<text x="${centerX}" y="${priceY}" text-anchor="middle" font-family="${FONTS.sansSemibold}" font-size="30" fill="${COLORS.amber}">${escapeXml(priceStr)}</text>`
        : "";

      return `${cover}\n${titleSvg}\n${priceSvg}`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
    ${backgroundSvg(COLORS.cream)}
    ${kickerSvg(piece.kicker || "Selección", MARGIN, 190)}
    ${cells}
    ${footerSvg(MARGIN, CANVAS - MARGIN + 8)}
    ${pagerSvg(index, total, CANVAS - MARGIN, CANVAS - MARGIN + 8)}
  </svg>`;
}
