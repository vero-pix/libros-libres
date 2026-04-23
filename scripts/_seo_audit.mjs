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

// Active listings + slug + seller username
const { data: listings } = await s
  .from("listings")
  .select("id, slug, status, seller:users(username, full_name)")
  .eq("status", "active");

const total = listings.length;
const withSlug = listings.filter((l) => !!l.slug).length;
const withUsername = listings.filter((l) => !!l.seller?.username).length;
const withBoth = listings.filter((l) => !!l.slug && !!l.seller?.username).length;
const withOnlySlugButNoUser = listings.filter((l) => !!l.slug && !l.seller?.username).length;
const withNoSlug = listings.filter((l) => !l.slug).length;
const withNoSlugNoUser = listings.filter((l) => !l.slug && !l.seller?.username).length;

console.log("=== LISTINGS activos ===");
console.log(`Total:                          ${total}`);
console.log(`Con slug:                       ${withSlug}`);
console.log(`Con username del seller:        ${withUsername}`);
console.log(`Con slug + username (URL bonita): ${withBoth}  ← ${((withBoth / total) * 100).toFixed(0)}% del catálogo`);
console.log(`Slug pero seller sin username:  ${withOnlySlugButNoUser}`);
console.log(`Sin slug (fallback /listings/uuid): ${withNoSlug}`);

// Sellers
const { data: sellers } = await s
  .from("users")
  .select("id, username, full_name");

const sellersTotal = sellers.length;
const sellersConUsername = sellers.filter((u) => !!u.username).length;
const sellersSinUsername = sellers.filter((u) => !u.username);

console.log("\n=== USERS ===");
console.log(`Total:                          ${sellersTotal}`);
console.log(`Con username:                   ${sellersConUsername}`);
console.log(`Sin username:                   ${sellersSinUsername.length}`);
if (sellersSinUsername.length) {
  console.log("  Ejemplos:");
  for (const u of sellersSinUsername.slice(0, 10)) {
    console.log(`    - ${u.id.slice(0, 8)} ${u.full_name ?? "(sin nombre)"}`);
  }
}

// Books con description vs sin
const { data: books } = await s
  .from("books")
  .select("id, description");

const withDesc = books.filter((b) => b.description && b.description.length > 30).length;
console.log(`\n=== BOOKS ===`);
console.log(`Total:                          ${books.length}`);
console.log(`Con description útil (>30c):    ${withDesc}  ← ${((withDesc / books.length) * 100).toFixed(0)}%`);
console.log(`Sin description o muy corta:    ${books.length - withDesc}`);
