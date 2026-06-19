/**
 * Utilidades compartidas para los scripts de SEO vía Google Search Console API.
 *
 * - Carga .env.local a mano (mismo patrón que el resto de scripts del repo,
 *   sin sumar dependencia de dotenv).
 * - Crea el cliente autenticado de Search Console con service account.
 * - Helpers de normalización y de carpetas de salida.
 */
import fs from "fs";
import path from "path";
import { google } from "googleapis";

/** Carga .env.local en process.env sin pisar lo que ya venga del entorno. */
export function loadEnv(): void {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf-8");
  for (const line of raw.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    if (!process.env[key]) process.env[key] = line.slice(i + 1).trim();
  }
}

/** siteUrl de GSC. Por defecto propiedad de dominio; ajustable por env. */
export function siteUrl(): string {
  const s = process.env.GSC_SITE_URL;
  if (!s) {
    throw new Error(
      "Falta GSC_SITE_URL en .env.local (ej: sc-domain:tuslibros.cl). " +
        "Si tu propiedad es de tipo prefijo, usa https://tuslibros.cl/"
    );
  }
  return s;
}

/** Cliente autenticado de Search Console (solo lectura). */
export function searchConsole() {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFile) {
    throw new Error(
      "Falta GOOGLE_APPLICATION_CREDENTIALS en .env.local (ruta absoluta al JSON " +
        "del service account). Ver scripts/seo/README.md → Setup manual previo."
    );
  }
  if (!fs.existsSync(keyFile)) {
    throw new Error(`No se encontró el archivo de credenciales en: ${keyFile}`);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  return google.searchconsole({ version: "v1", auth });
}

/**
 * Normaliza un término: minúsculas, sin tildes/ñ, espacios colapsados.
 * Para hacer match exacto entre baseline y filas de GSC sin perder por acentos.
 */
export function normalizeQuery(q: string): string {
  return q
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Fecha YYYY-MM-DD a N días de hoy (default hoy). */
export function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Asegura scripts/seo/output y devuelve la ruta absoluta de un archivo ahí. */
export function outputPath(filename: string): string {
  const dir = path.resolve(process.cwd(), "scripts/seo/output");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, filename);
}

/** Asegura scripts/seo/input y devuelve la ruta absoluta de un archivo ahí. */
export function inputPath(filename: string): string {
  const dir = path.resolve(process.cwd(), "scripts/seo/input");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, filename);
}

/** Parser CSV mínimo (sin comillas anidadas) → array de objetos por header. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** Escapa un valor para CSV. */
export function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
