/**
 * Plantillas SVG para las tarjetas de contenido. Cada función devuelve el/los
 * SVG listos para pasar a resvg. Tres plantillas cubren casi todo: `ficha`,
 * `tipografica` y `lista`, todas en el lienzo del feed (1080×1350, 4:5).
 * `historia` es aparte y sigue en 1080×1920.
 *
 * Reglas de composición: nada crítico dentro de SAFE_X (la grilla del perfil
 * recorta los bordes laterales), nada se corta ni se solapa, dos pesos
 * tipográficos (Playfair 700 + Inter 400/600), portadas con recorte tipo cover.
 *
 * El precio NO va en la imagen: una tarjeta con precio se lee como aviso y no
 * se guarda ni se comparte. Va en el caption del post (ver README).
 */
import {
  CANVAS_H,
  CANVAS_W,
  COLORS,
  FONTS,
  MARGIN,
  SAFE_X,
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
  template: "ficha" | "tipografica" | "lista" | "historia";
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
  radius = 18,
  /** Anclaje del recorte. "xMidYMin" conserva la parte alta de la portada
   *  (donde suelen ir título y autor) cuando la caja es más ancha que la foto. */
  align: "xMidYMid" | "xMidYMin" = "xMidYMid"
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
           preserveAspectRatio="${align} slice" clip-path="url(#${id})"/>
    ${border}`;
}

/* ─────────────────────────── FICHA ─────────────────────────── */
/**
 * Vertical: portada protagonista arriba ocupando todo el ancho útil, texto
 * abajo. La versión cuadrada ponía la portada como miniatura al costado de una
 * columna de texto y dejaba media tarjeta en blanco — en la grilla del perfil
 * eso se leía como un post vacío.
 */
export function fichaTemplate(piece: Piece, listing: Listing): string {
  const coverX = SAFE_X;
  const coverW = CANVAS_W - SAFE_X * 2; // 820
  const coverY = 190;
  const coverH = 760; // ~56% del alto: la portada manda
  const tw = coverW; // el texto usa el mismo ancho útil

  // Auto-escala la fuente del título según su largo. La columna ahora es ancha
  // (820 y no 568), así que los tamaños suben respecto de la versión cuadrada.
  const cleaned = cleanTitle(listing.title);
  const titleFont =
    cleaned.length > 60 ? 46 : cleaned.length > 40 ? 52 : cleaned.length > 24 ? 58 : 64;
  const titleLH = Math.round(titleFont * 1.14);
  const titleLines = wrapText(cleaned, {
    maxWidth: tw,
    fontSize: titleFont,
    family: "serif",
    maxLines: 2,
  });

  const kickerY = 128;
  const titleTop = coverY + coverH + 78;

  const titleSvg = titleLines
    .map(
      (ln, i) =>
        `<text x="${SAFE_X}" y="${titleTop + i * titleLH}" font-family="${FONTS.serif}" font-weight="700" font-size="${titleFont}" fill="${COLORS.ink}">${escapeXml(ln)}</text>`
    )
    .join("\n");

  let cursor = titleTop + (titleLines.length - 1) * titleLH + 56;

  // Autor recortado a una línea al ancho útil (no se desborda del canvas).
  const authorLine = listing.author
    ? wrapText(listing.author, { maxWidth: tw, fontSize: 32, family: "sans", maxLines: 1 })[0]
    : "";
  const authorSvg = authorLine
    ? `<text x="${SAFE_X}" y="${cursor}" font-family="${FONTS.sans}" font-style="italic" font-size="32" fill="${COLORS.muted}">${escapeXml(authorLine)}</text>`
    : "";
  if (authorLine) cursor += 54;

  const cond = conditionLabel(listing.condition);
  const condSvg = cond
    ? `<text x="${SAFE_X}" y="${cursor}" font-family="${FONTS.sans}" font-size="26" fill="${COLORS.muted}">${escapeXml(cond)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
    ${backgroundSvg(COLORS.cream)}
    ${kickerSvg(piece.kicker || "Recién llegado", SAFE_X, kickerY)}
    ${coverBox(listing.coverDataUri, coverX, coverY, coverW, coverH, 18, "xMidYMin")}
    ${titleSvg}
    ${authorSvg}
    ${condSvg}
    ${footerSvg(SAFE_X, CANVAS_H - 80)}
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

  const textW = CANVAS_W - SAFE_X * 2;
  const lines = wrapText(headline, {
    maxWidth: textW,
    fontSize,
    family: "serif",
    maxLines: 6,
  });

  const blockH = lines.length * lh + (sub ? 70 : 0);
  let y = Math.max(400, Math.round((CANVAS_H - blockH) / 2) + fontSize); // centrado vertical

  const headlineSvg = lines
    .map((ln, i) => {
      const yy = y + i * lh;
      return `<text x="${SAFE_X}" y="${yy}" font-family="${FONTS.serif}" font-weight="700" font-size="${fontSize}" fill="${COLORS.ink}">${escapeXml(ln)}</text>`;
    })
    .join("\n");

  const subY = y + (lines.length - 1) * lh + 66;
  const subSvg = sub
    ? wrapText(sub, { maxWidth: textW, fontSize: 34, family: "sans", maxLines: 3 })
        .map(
          (ln, i) =>
            `<text x="${SAFE_X}" y="${subY + i * 46}" font-family="${FONTS.sans}" font-size="34" fill="${COLORS.muted}">${escapeXml(ln)}</text>`
        )
        .join("\n")
    : "";

  // Portada chica opcional en la esquina inferior derecha, dentro de la zona segura.
  const cornerCover =
    listing && listing.coverDataUri
      ? coverBox(listing.coverDataUri, CANVAS_W - SAFE_X - 150, CANVAS_H - 190 - 222, 150, 222, 12)
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
    ${backgroundSvg(COLORS.cream)}
    ${kickerSvg(piece.kicker || "¿Sabías que…?", SAFE_X, 240)}
    ${headlineSvg}
    ${subSvg}
    ${cornerCover}
    ${footerSvg(SAFE_X, CANVAS_H - 80)}
  </svg>`;
}

/* ─────────────────────────── HISTORIA ──────────────────────── */
/**
 * Formato HISTORIA vertical (1080×1920) para IG Stories / destacado "Novedades".
 * La FOTO REAL del ejemplar es protagonista, centrada; debajo van título, autor
 * y precio. Todo dentro de la zona segura de historias (evita el tercio inferior
 * que tapa la UI de Instagram). Es la pieza dinámica con imagen (no solo texto).
 */
const STORY_W = 1080;
const STORY_H = 1920;

export function historiaFichaTemplate(piece: Piece, listing: Listing): string {
  const cx = STORY_W / 2;

  // Fondo crema con borde interior sutil (marco de la caja de seguridad).
  const bg = `
    <rect width="${STORY_W}" height="${STORY_H}" fill="${COLORS.cream}"/>
    <rect x="24" y="24" width="${STORY_W - 48}" height="${STORY_H - 48}" rx="28"
          fill="none" stroke="${COLORS.line}" stroke-width="2"/>`;

  // Kicker centrado arriba, con regla fina bajo el texto.
  const kicker = (piece.kicker || "Recién llegado").toUpperCase();
  const kickerY = 300;
  const kickerSvgC = `
    <text x="${cx}" y="${kickerY}" text-anchor="middle" font-family="${FONTS.sansSemibold}"
          font-size="30" letter-spacing="6" fill="${COLORS.amber}">${escapeXml(kicker)}</text>
    <rect x="${cx - 40}" y="${kickerY + 20}" width="80" height="4" rx="2" fill="${COLORS.amber}"/>`;

  // Portada real, centrada, proporción 2:3.
  const coverW = 560;
  const coverH = 840;
  const coverX = cx - coverW / 2;
  const coverY = 400;
  const cover = coverBox(listing.coverDataUri, coverX, coverY, coverW, coverH, 18);

  // Bloque de texto bajo la portada.
  let y = coverY + coverH + 110; // ~1350

  const cleaned = cleanTitle(listing.title);
  const titleFont = cleaned.length > 40 ? 54 : cleaned.length > 22 ? 64 : 74;
  const titleLH = Math.round(titleFont * 1.14);
  const titleLines = wrapText(cleaned, {
    maxWidth: STORY_W - MARGIN * 2,
    fontSize: titleFont,
    family: "serif",
    maxLines: 2,
  });
  const titleSvg = titleLines
    .map(
      (ln, i) =>
        `<text x="${cx}" y="${y + i * titleLH}" text-anchor="middle" font-family="${FONTS.serif}" font-weight="700" font-size="${titleFont}" fill="${COLORS.ink}">${escapeXml(ln)}</text>`
    )
    .join("\n");
  y += (titleLines.length - 1) * titleLH + 70;

  const authorLine = listing.author
    ? wrapText(listing.author, { maxWidth: STORY_W - MARGIN * 2, fontSize: 34, family: "sans", maxLines: 1 })[0]
    : "";
  const authorSvg = authorLine
    ? `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${FONTS.sans}" font-style="italic" font-size="34" fill="${COLORS.muted}">${escapeXml(authorLine)}</text>`
    : "";
  if (authorLine) y += 74;

  const priceStr = formatCLP(listing.price);
  const priceSvg = priceStr
    ? `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${FONTS.sansSemibold}" font-size="60" fill="${COLORS.amber}">${escapeXml(priceStr)}</text>`
    : "";

  // Footer de marca, centrado, dentro de la zona segura.
  const footer = `
    <text x="${cx}" y="1600" text-anchor="middle" font-family="${FONTS.sansSemibold}" font-size="30"
          letter-spacing="1" fill="${COLORS.ink}">tuslibros<tspan fill="${COLORS.amber}">.cl</tspan></text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}" viewBox="0 0 ${STORY_W} ${STORY_H}">
    ${bg}
    ${kickerSvgC}
    ${cover}
    ${titleSvg}
    ${authorSvg}
    ${priceSvg}
    ${footer}
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
  const gap = 36;
  const cellW = Math.floor((CANVAS_W - SAFE_X * 2 - gap * (cols - 1)) / cols); // ~249
  const coverW = 200;
  const coverH = 300; // 2:3; el lienzo vertical da espacio para portadas más grandes
  const cellPadX = Math.floor((cellW - coverW) / 2);

  // Grilla de 2 filas centrada entre el kicker y el footer.
  const gridTop = 320;
  const rowH = 416; // portada (300) + título (hasta 2 líneas) + aire, sin invadir el footer

  const cells = items
    .map((l, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const cellX = SAFE_X + c * (cellW + gap);
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

      // Sin precio: la grilla es una selección para mirar, no un catálogo de
      // ofertas. Los precios van en el caption.
      return `${cover}\n${titleSvg}`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
    ${backgroundSvg(COLORS.cream)}
    ${kickerSvg(piece.kicker || "Selección", SAFE_X, 200)}
    ${cells}
    ${footerSvg(SAFE_X, CANVAS_H - 80)}
    ${pagerSvg(index, total, CANVAS_W - SAFE_X, CANVAS_H - 80)}
  </svg>`;
}
