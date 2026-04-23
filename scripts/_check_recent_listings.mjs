import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SELLER = "2201d163-4423-4971-91f0-f6cebd00d1bd";

// Últimos 20 listings del seller TusLibros
const { data } = await s
  .from("listings")
  .select("id, price, status, slug, cover_image_url, created_at, book:books(title, author, description, isbn, category)")
  .eq("seller_id", SELLER)
  .order("created_at", { ascending: false })
  .limit(20);

console.log(`Últimos 20 listings de TusLibros:\n`);

const now = Date.now();
for (const l of data ?? []) {
  const ageH = Math.round((now - new Date(l.created_at).getTime()) / 3600e3);
  const age = ageH < 24 ? `hace ${ageH}h` : `hace ${Math.round(ageH / 24)}d`;
  const flags = [];
  if (!l.cover_image_url && !(l.book?.title)) flags.push("❌ sin portada");
  if (!l.book?.description || l.book.description.length < 30) flags.push("⚠️ sin sinopsis");
  if (!l.book?.category) flags.push("⚠️ sin categoría");
  if (!l.book?.isbn) flags.push("sin ISBN");
  if (!l.price || l.price <= 0) flags.push("❌ sin precio");
  if (!l.slug) flags.push("⚠️ sin slug");

  const flagStr = flags.length ? "  [" + flags.join(", ") + "]" : "  ✅";
  console.log(`${age.padEnd(9)}  ${l.status.padEnd(9)}  $${String(l.price).padStart(6)}  "${(l.book?.title ?? "?").slice(0, 40)}" — ${(l.book?.author ?? "?").slice(0, 25)}${flagStr}`);
}
