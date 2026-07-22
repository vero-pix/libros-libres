/**
 * Identidad de las tarjetas de contenido de tuslibros.cl — un solo módulo.
 * Tokens de color, rutas de fuentes y helpers de texto/SVG compartidos por
 * todas las plantillas. Nada de colores ni fuentes hardcodeados fuera de acá.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Paleta de marca. Prohibido neón y fondos oscuros. */
export const COLORS = {
  cream: "#faf7f2", // fondo
  creamWarm: "#f3e9d8", // fondo alterno / paneles
  ink: "#2a1f14", // tinta (titulares, texto fuerte)
  amber: "#c08a12", // acento (precio, kicker, reglas)
  muted: "#8a7a63", // texto secundario
  line: "#e7ddcd", // bordes suaves
  white: "#ffffff",
} as const;

/**
 * Familias tal como quedan registradas en los TTF (fontsource separa cada peso
 * en una familia propia). resvg hace match por este string exacto.
 */
export const FONTS = {
  serif: "Playfair Display", // titulares, 700
  sans: "Inter", // cuerpo, 400
  sansSemibold: "Inter SemiBold", // kickers, precio, etiquetas
  files: [
    path.join(HERE, "fonts", "PlayfairDisplay-Bold.ttf"),
    path.join(HERE, "fonts", "Inter-Regular.ttf"),
    path.join(HERE, "fonts", "Inter-SemiBold.ttf"),
  ],
} as const;

/** Lienzo Instagram cuadrado. */
export const CANVAS = 1080;
/** Margen de seguridad (el encargo pide ≥80). */
export const MARGIN = 88;

const CONDITION_LABELS: Record<string, string> = {
  new: "Como nuevo",
  good: "Buen estado",
  fair: "Estado regular",
  poor: "Muy usado",
};

export function conditionLabel(c?: string | null): string | null {
  if (!c) return null;
  return CONDITION_LABELS[c] ?? null;
}

/** Precio en pesos chilenos: 4500 → "$4.500". null si no hay precio. */
export function formatCLP(price?: number | null): string | null {
  if (price == null || Number.isNaN(price)) return null;
  return "$" + Math.round(price).toLocaleString("es-CL");
}

/** Escapa texto para insertarlo seguro en XML/SVG. */
export function escapeXml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Envuelve texto por ancho aproximado (SVG no autoajusta). Sin métricas exactas
 * usamos un factor de ancho medio por familia; somos conservadores para que
 * nunca se corte ni se solape. Respeta saltos "\n" ya presentes.
 *
 * @returns líneas ya recortadas a maxLines (con "…" si sobró).
 */
export function wrapText(
  text: string,
  opts: { maxWidth: number; fontSize: number; family?: "serif" | "sans"; maxLines?: number }
): string[] {
  const { maxWidth, fontSize, family = "sans", maxLines = 6 } = opts;
  // Ancho medio de glifo relativo al tamaño de fuente (empírico, conservador).
  const factor = family === "serif" ? 0.55 : 0.56;
  const maxChars = Math.max(6, Math.floor(maxWidth / (fontSize * factor)));

  const paragraphs = String(text ?? "").split(/\n/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    let cur = "";
    for (const w of words) {
      const candidate = cur ? `${cur} ${w}` : w;
      if (candidate.length > maxChars && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    lines.push(cur);
  }

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = kept[maxLines - 1].replace(/[.,;:\s]*$/, "") + "…";
  return kept;
}

/** Kicker: etiqueta ámbar en versalitas con tracking, sobre una regla fina. */
export function kickerSvg(text: string, x: number, y: number): string {
  if (!text) return "";
  return `
    <text x="${x}" y="${y}" font-family="${FONTS.sansSemibold}" font-size="24"
          letter-spacing="4" fill="${COLORS.amber}"
          style="text-transform:uppercase">${escapeXml(text.toUpperCase())}</text>
    <rect x="${x}" y="${y + 16}" width="64" height="4" rx="2" fill="${COLORS.amber}"/>`;
}

/** Firma de marca abajo a la izquierda. */
export function footerSvg(x: number, y: number): string {
  return `
    <text x="${x}" y="${y}" font-family="${FONTS.sansSemibold}" font-size="26"
          letter-spacing="1" fill="${COLORS.ink}">tuslibros<tspan fill="${COLORS.amber}">.cl</tspan></text>`;
}

/** Pager de carrusel "0X · 0N" abajo a la derecha. */
export function pagerSvg(index: number, total: number, xRight: number, y: number): string {
  if (total <= 1) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `
    <text x="${xRight}" y="${y}" text-anchor="end" font-family="${FONTS.sansSemibold}"
          font-size="24" letter-spacing="2" fill="${COLORS.muted}">${pad(index)} · ${pad(total)}</text>`;
}

/** Fondo base crema con un borde interior sutil (marca la caja de seguridad). */
export function backgroundSvg(color: string = COLORS.cream): string {
  return `
    <rect width="${CANVAS}" height="${CANVAS}" fill="${color}"/>
    <rect x="24" y="24" width="${CANVAS - 48}" height="${CANVAS - 48}" rx="28"
          fill="none" stroke="${COLORS.line}" stroke-width="2"/>`;
}
