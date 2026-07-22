/**
 * Trae datos + portada real de un libro desde Supabase (cliente anon, solo
 * lectura) para compositar las tarjetas. Usa EXACTAMENTE la misma fuente de
 * portada que el sitio: `listing.cover_image_url ?? book.cover_url`.
 *
 * Referencia de pieza:
 *   - "username/slug"  (ej. "vero/ayer")  → resuelve vendedor y luego el listing
 *   - un UUID de listing                  → busca por id directo
 */
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Carga .env.local sin pisar el entorno (mismo patrón que el resto del repo). */
function loadEnv(): void {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    if (!process.env[key]) process.env[key] = line.slice(i + 1).trim();
  }
}

let _client: SupabaseClient | null = null;
function client(): SupabaseClient {
  if (_client) return _client;
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
    );
  }
  _client = createClient(url, anon, { auth: { persistSession: false } });
  return _client;
}

export type Listing = {
  ref: string;
  title: string;
  author: string | null;
  price: number | null;
  condition: string | null;
  coverUrl: string | null;
  /** Portada ya descargada como data: URI, lista para el <image> del SVG. */
  coverDataUri: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SELECT = `id, slug, price, condition, cover_image_url, book:books(title, author, cover_url)`;

/** Resuelve la referencia de pieza a un registro de listing (o null si no está). */
export async function fetchListing(ref: string): Promise<Listing | null> {
  const sb = client();
  let row: any = null;

  if (UUID_RE.test(ref)) {
    const { data } = await sb.from("listings").select(SELECT).eq("id", ref).maybeSingle();
    row = data;
  } else if (ref.includes("/")) {
    const [username, slug] = ref.split("/");
    const { data: seller } = await sb
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!seller) return null;
    const { data } = await sb
      .from("listings")
      .select(SELECT)
      .eq("slug", slug)
      .eq("seller_id", seller.id)
      .maybeSingle();
    row = data;
  } else {
    // slug suelto (sin username): último intento por slug único.
    const { data } = await sb.from("listings").select(SELECT).eq("slug", ref).maybeSingle();
    row = data;
  }

  if (!row) return null;

  const book = Array.isArray(row.book) ? row.book[0] : row.book;
  const coverUrl: string | null = row.cover_image_url ?? book?.cover_url ?? null;

  return {
    ref,
    title: book?.title ?? "(sin título)",
    author: book?.author ?? null,
    price: row.price ?? null,
    condition: row.condition ?? null,
    coverUrl,
    coverDataUri: coverUrl ? await toDataUri(coverUrl) : null,
  };
}

/** Descarga una imagen remota y la devuelve como data: URI (o null si falla). */
export async function toDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // El content-type del storage no es confiable (Supabase sirve PNGs
    // etiquetados como image/webp). Detectamos el formato por los magic bytes.
    const mime = sniffMime(buf) ?? res.headers.get("content-type") ?? "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Detecta el mime real por la firma de los bytes (o null si no reconoce). */
function sniffMime(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP")
    return "image/webp";
  return null;
}
