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

const { data } = await s
  .from("listings")
  .select(`id, price, status, slug, book:books(title, author), seller:users(username)`)
  .eq("seller_id", "2201d163-4423-4971-91f0-f6cebd00d1bd")
  .eq("status", "active")
  .ilike("book.title", "%camino%");

for (const l of data ?? []) {
  if (!l.book) continue;
  const sellerUsername = l.seller?.username;
  const slug = l.slug;
  const url = sellerUsername && slug
    ? `https://tuslibros.cl/libro/${sellerUsername}/${slug}`
    : `https://tuslibros.cl/listings/${l.id}`;
  console.log(`${l.id.slice(0, 8)}  $${l.price}  "${l.book.title}" de ${l.book.author}`);
  console.log(`  URL: ${url}`);
}
