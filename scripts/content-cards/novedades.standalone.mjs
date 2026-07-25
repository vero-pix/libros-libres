/**
 * COPIA AUTÓNOMA del generador de "Novedades" — pensada para la automatización
 * semanal (entorno Linux de tareas programadas, sin tsx ni los binarios nativos
 * del Mac). Es autocontenida: no importa módulos .ts hermanos, solo `@resvg` y
 * `@supabase`. En tu Mac corre igual con `node`; en la nube corre con NODE_PATH
 * apuntando a un node_modules Linux.
 *
 * La lógica de diseño y selección debe mantenerse en sincronía con
 * templates.ts (historiaFichaTemplate) y fetchListing.ts (fetchRecentVero).
 * Si cambias el diseño en un lado, replícalo aquí.
 *
 * Variables de entorno:
 *   NOV_REPO  — raíz del repo (default: cwd). De ahí lee .env.local y las fuentes.
 *   NOV_OUT   — carpeta de salida (default: <repo>/content-out/novedades).
 *   NOV_COUNT — cuántas historias (default 3). NOV_KICKER — kicker (default "Recién llegado").
 */
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { createClient } from "@supabase/supabase-js";

const REPO = process.env.NOV_REPO || process.cwd();
const OUT = process.env.NOV_OUT || path.join(REPO, "content-out", "novedades");
const COUNT = Math.max(1, Math.min(10, parseInt(process.env.NOV_COUNT || "3", 10) || 3));
const KICKER = process.env.NOV_KICKER || "Recién llegado";
const VERO = "2201d163-4423-4971-91f0-f6cebd00d1bd";

const COLORS = { cream: "#faf7f2", creamWarm: "#f3e9d8", ink: "#2a1f14", amber: "#c08a12", muted: "#8a7a63", line: "#e7ddcd" };
const FONTS = { serif: "Playfair Display", sans: "Inter", sansSemibold: "Inter SemiBold" };
const MARGIN = 88, W = 1080, H = 1920;

function loadEnv() {
  const file = path.join(REPO, ".env.local");
  const env = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
      const i = line.indexOf("=");
      if (line.startsWith("#") || i < 0) continue;
      env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return env;
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const formatCLP = (p) => (p == null || Number.isNaN(p) ? null : "$" + Math.round(p).toLocaleString("es-CL"));
const isGeneric = (u) => !u || /covers\.openlibrary\.org/i.test(u);

function cleanTitle(raw) {
  let t = String(raw ?? "").trim();
  t = t.replace(/\s*\((?:1[5-9]\d\d|20\d\d)\)\s*/g, " ");
  t = t.replace(/\s*[-–—·|]?\s*(?:tomos?|vol\.?|volumen)\s+[ivxlcdm\d]+(?:\s*[-–y]\s*[ivxlcdm\d]+)?\.?\s*$/i, "");
  t = t.replace(/\s*[-–—·|:,]\s*$/, "").replace(/\s{2,}/g, " ").trim();
  return t || String(raw ?? "").trim();
}

function wrapText(text, { maxWidth, fontSize, family = "sans", maxLines = 6 }) {
  const factor = family === "serif" ? 0.55 : 0.56;
  const mc = Math.max(6, Math.floor(maxWidth / (fontSize * factor)));
  const out = [];
  for (const para of String(text ?? "").split(/\n/)) {
    const ws = para.split(/\s+/).filter(Boolean);
    let c = "";
    for (const w of ws) {
      const cand = c ? c + " " + w : w;
      if (cand.length > mc && c) { out.push(c); c = w; } else c = cand;
    }
    out.push(c);
  }
  if (out.length <= maxLines) return out;
  const k = out.slice(0, maxLines);
  k[maxLines - 1] = k[maxLines - 1].replace(/[\s.,;:·|–—-]*$/, "") + "…";
  return k;
}

async function toDataUri(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const b = Buffer.from(await r.arrayBuffer());
    let mime = "image/jpeg";
    if (b[0] === 0x89 && b[1] === 0x50) mime = "image/png";
    else if (b[0] === 0xff && b[1] === 0xd8) mime = "image/jpeg";
    else if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") mime = "image/webp";
    else if (b[0] === 0x47 && b[1] === 0x49) mime = "image/gif";
    return `data:${mime};base64,${b.toString("base64")}`;
  } catch { return null; }
}

function coverBox(uri, x, y, w, h, r = 18) {
  const id = "c" + Math.random().toString(36).slice(2);
  const shadow = `<rect x="${x + 10}" y="${y + 14}" width="${w}" height="${h}" rx="${r}" fill="${COLORS.ink}" opacity="0.12"/>`;
  const border = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${COLORS.ink}" stroke-width="1.5" opacity="0.9"/>`;
  if (!uri) return `${shadow}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${COLORS.creamWarm}"/>${border}`;
  return `${shadow}<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath><image href="${uri}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>${border}`;
}

function historia(listing, kicker) {
  const cx = W / 2;
  const bg = `<rect width="${W}" height="${H}" fill="${COLORS.cream}"/><rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="28" fill="none" stroke="${COLORS.line}" stroke-width="2"/>`;
  const ky = 300;
  const ks = `<text x="${cx}" y="${ky}" text-anchor="middle" font-family="${FONTS.sansSemibold}" font-size="30" letter-spacing="6" fill="${COLORS.amber}">${esc(kicker.toUpperCase())}</text><rect x="${cx - 40}" y="${ky + 20}" width="80" height="4" rx="2" fill="${COLORS.amber}"/>`;
  const cw = 560, ch = 840, cxx = cx - cw / 2, cy = 400;
  const cover = coverBox(listing.coverDataUri, cxx, cy, cw, ch, 18);
  let y = cy + ch + 110;
  const cleaned = cleanTitle(listing.title);
  const tf = cleaned.length > 40 ? 54 : cleaned.length > 22 ? 64 : 74;
  const tlh = Math.round(tf * 1.14);
  const tl = wrapText(cleaned, { maxWidth: W - MARGIN * 2, fontSize: tf, family: "serif", maxLines: 2 });
  const ts = tl.map((ln, i) => `<text x="${cx}" y="${y + i * tlh}" text-anchor="middle" font-family="${FONTS.serif}" font-weight="700" font-size="${tf}" fill="${COLORS.ink}">${esc(ln)}</text>`).join("\n");
  y += (tl.length - 1) * tlh + 70;
  const al = listing.author ? wrapText(listing.author, { maxWidth: W - MARGIN * 2, fontSize: 34, family: "sans", maxLines: 1 })[0] : "";
  const as = al ? `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${FONTS.sans}" font-style="italic" font-size="34" fill="${COLORS.muted}">${esc(al)}</text>` : "";
  if (al) y += 74;
  const ps = formatCLP(listing.price);
  const pr = ps ? `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${FONTS.sansSemibold}" font-size="60" fill="${COLORS.amber}">${esc(ps)}</text>` : "";
  const ft = `<text x="${cx}" y="1600" text-anchor="middle" font-family="${FONTS.sansSemibold}" font-size="30" letter-spacing="1" fill="${COLORS.ink}">tuslibros<tspan fill="${COLORS.amber}">.cl</tspan></text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bg}${ks}${cover}${ts}${as}${pr}${ft}</svg>`;
}

function slugify(s) {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Faltan credenciales de Supabase (.env.local)");
  const sb = createClient(url, anon, { auth: { persistSession: false } });

  const { data: rows } = await sb.from("listings").select("id,created_at").eq("seller_id", VERO).eq("status", "active").order("created_at", { ascending: false }).limit(40);
  const picks = [];
  for (const r of rows ?? []) {
    if (picks.length >= COUNT) break;
    const { data: row } = await sb.from("listings").select("id,slug,price,condition,cover_image_url,book:books(title,author,cover_url)").eq("id", r.id).maybeSingle();
    if (!row) continue;
    const book = Array.isArray(row.book) ? row.book[0] : row.book;
    const { data: imgs } = await sb.from("listing_images").select("image_url,sort_order").eq("listing_id", row.id).order("sort_order", { ascending: true });
    const main = (imgs ?? []).find((x) => x.sort_order === 0) ?? (imgs ?? [])[0];
    let cover = null;
    for (const u of [main?.image_url, row.cover_image_url, book?.cover_url]) { if (u && !isGeneric(u)) { cover = u; break; } }
    if (!cover) continue;
    picks.push({ title: book?.title ?? "(sin título)", author: book?.author ?? null, price: row.price, coverDataUri: await toDataUri(cover) });
  }

  if (picks.length === 0) { console.error("✗ Sin novedades de Vero con foto real."); process.exit(1); }

  fs.mkdirSync(OUT, { recursive: true });
  const fontFiles = ["PlayfairDisplay-Bold.ttf", "Inter-Regular.ttf", "Inter-SemiBold.ttf"].map((f) => path.join(REPO, "scripts", "content-cards", "fonts", f));
  const manifest = [];
  picks.forEach((p, i) => {
    const n = String(i + 1).padStart(2, "0");
    const file = `${n}_${slugify(p.title)}.png`;
    const png = new Resvg(historia(p, KICKER), { fitTo: { mode: "width", value: W }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Inter" } }).render().asPng();
    fs.writeFileSync(path.join(OUT, file), png);
    const precio = p.price != null ? "$" + p.price.toLocaleString("es-CL") : "";
    manifest.push({ archivo: file, title: p.title, price: p.price, caption: `${p.title}${p.author ? " · " + p.author : ""}${precio ? " — " + precio : ""}\n\nRecién llegado a tuslibros.cl 📚 Envío a todo Chile o retiro en mano.` });
    console.log(`  ✓ ${file}  (${p.title}${precio ? " · " + precio : ""})`);
  });
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n📦 ${picks.length} historia(s) → ${OUT}`);
}

main().catch((e) => { console.error(e?.stack ?? e); process.exit(1); });
