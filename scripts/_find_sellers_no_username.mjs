import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const c = fs.readFileSync(envPath, "utf-8");
for (const line of c.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get active listings where seller has no username
const { data: listings } = await s
  .from("listings")
  .select("id, slug, seller_id, seller:users(username, full_name, email)")
  .eq("status", "active");

const noUsername = listings.filter((l) => !l.seller?.username);

console.log(`Listings activos sin username de seller: ${noUsername.length}\n`);
for (const l of noUsername) {
  console.log(`- listing_id=${l.id.slice(0, 8)} slug=${l.slug}`);
  console.log(`  seller_id=${l.seller_id.slice(0, 8)}`);
  console.log(`  seller_name="${l.seller?.full_name ?? "-"}"`);
  console.log(`  seller_email=${l.seller?.email ?? "-"}`);
  console.log();
}

// Unique sellers
const uniqSellers = new Map();
for (const l of noUsername) {
  if (!uniqSellers.has(l.seller_id)) {
    uniqSellers.set(l.seller_id, l.seller);
  }
}
console.log(`\nVendedores únicos sin username (activos): ${uniqSellers.size}`);
for (const [id, u] of uniqSellers) {
  console.log(`  ${id.slice(0, 8)}  ${u.full_name ?? "-"}  ${u.email ?? "-"}`);
}
