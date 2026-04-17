import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const c = fs.readFileSync(envPath, "utf-8");
  for (const line of c.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const k = line.slice(0, idx).trim();
    if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
  }
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SELLER_ID = "88db8053-3ade-4a1b-99b5-30438ff49369";

const { data: listings, error } = await s
  .from("listings")
  .select("id, slug, price, status, deprioritized")
  .eq("seller_id", SELLER_ID);

if (error) {
  console.error("ERROR:", error);
  process.exit(1);
}

console.log("Listings de Nicolás:");
for (const l of listings || []) {
  console.log({ slug: l.slug, status: l.status, deprioritized: l.deprioritized });
}
