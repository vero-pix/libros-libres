import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  if (line && !line.startsWith("#")) {
    const [key, value] = line.split("=");
    if (key && value) process.env[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function topListingsThisWeek() {
  // Get page views from all time (no date filter)
  const { data: views } = await supabase
    .from("page_views")
    .select("listing_id");

  // Aggregate by listing_id
  const viewMap = {};
  for (const v of views ?? []) {
    if (!v.listing_id) continue;
    viewMap[v.listing_id] = (viewMap[v.listing_id] ?? 0) + 1;
  }

  // Get top 20 listing IDs
  const topIds = Object.entries(viewMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([id]) => id);

  // Fetch full listing data
  const { data: listings } = await supabase
    .from("listings")
    .select(`
      id,
      price,
      status,
      book:books(title, author),
      seller:users(full_name, username)
    `)
    .in("id", topIds);

  console.log("\n📚 TOP LIBROS VISITADOS DE TODOS LOS TIEMPOS\n");
  console.log(
    "Rank | Visitas | Precio  | Título                                | Autor                    | Vendedor"
  );
  console.log("-".repeat(130));

  let rank = 1;
  for (const id of topIds) {
    const listing = listings?.find((l) => l.id === id);
    if (!listing) continue;
    const views = viewMap[id];
    const title = listing.book?.title || "N/A";
    const author = listing.book?.author || "N/A";
    const vendor = listing.seller?.username || listing.seller?.full_name || "Anónimo";
    const price = `$${listing.price.toLocaleString("es-CL")}`;

    console.log(
      `${String(rank).padStart(3)}. | ${String(views).padStart(6)} | ${price.padEnd(7)} | ${title.substring(0, 36).padEnd(36)} | ${author.substring(0, 24).padEnd(24)} | ${vendor}`
    );
    rank++;
  }

  console.log("\n✅ Total listings con visitas esta semana:", Object.keys(viewMap).length);
}

topListingsThisWeek().catch(console.error);
