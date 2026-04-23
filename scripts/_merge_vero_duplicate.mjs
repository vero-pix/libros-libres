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

const DUP = "9bee4b1a-65b4-4f36-a94a-2705380dcabf"; // duplicada
const MAIN = "2201d163-4423-4971-91f0-f6cebd00d1bd"; // vero real, username "vero"

// Confirma seller IDs
const { data: dup } = await s.from("users").select("id, username, full_name, email").eq("id", DUP).single();
const { data: main } = await s.from("users").select("id, username, full_name, email").eq("id", MAIN).single();

console.log("Duplicada:", dup);
console.log("Principal:", main);

if (!dup || !main || main.username !== "vero") {
  console.error("Algo no cuadra, abortando.");
  process.exit(1);
}

const { data: listings } = await s
  .from("listings")
  .select("id, slug, status")
  .eq("seller_id", dup.id)
  .eq("status", "active");

console.log(`\nListings activos a mover: ${listings.length}`);
for (const l of listings) {
  console.log(`  - ${l.slug} (${l.id.slice(0, 8)})`);
}

const { error } = await s
  .from("listings")
  .update({ seller_id: main.id })
  .eq("seller_id", dup.id)
  .eq("status", "active");

if (error) {
  console.error("ERROR:", error);
  process.exit(1);
}

const { data: after } = await s
  .from("listings")
  .select("id, slug, seller:users(username)")
  .in("id", listings.map((l) => l.id));

console.log("\nDESPUES:");
for (const l of after) {
  console.log(`  - ${l.slug} → seller=${l.seller?.username}`);
}
console.log("\nOK");
