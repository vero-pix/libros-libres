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

const { data: orders } = await s
  .from("orders")
  .select("id, listing_id, book_price, status, bundle_id")
  .eq("buyer_id", "131b2d7c-7ac1-44be-a7f9-943d5a57aa23")
  .order("created_at", { ascending: true });

const listingIds = (orders ?? []).map((o) => o.listing_id);
const { data: listings } = await s
  .from("listings")
  .select("id, book:books(title, author, category)")
  .in("id", listingIds);
const byId = Object.fromEntries((listings ?? []).map((l) => [l.id, l]));

console.log(`Órdenes de Camilo: ${orders?.length}\n`);
for (const o of orders ?? []) {
  const l = byId[o.listing_id];
  console.log(`  $${o.book_price}  ${o.status.padEnd(10)}  "${l?.book?.title}" — ${l?.book?.author}`);
  console.log(`     categoría: ${l?.book?.category ?? "?"}`);
}
