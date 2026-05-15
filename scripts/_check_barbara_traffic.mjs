import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Buscar Barbara
const { data: barbara } = await supabase
  .from("users")
  .select("id, full_name, username")
  .eq("username", "barbara")
  .single();

console.log("Seller:", barbara?.full_name, "@" + barbara?.username);

// Sus listings
const { data: listings } = await supabase
  .from("listings")
  .select("id, book:books(title), created_at")
  .eq("seller_id", barbara.id)
  .order("created_at", { ascending: false });

const listingIds = listings?.map(l => l.id) ?? [];
console.log(`\nTotal listings de Barbara: ${listingIds.length}`);
listings?.forEach(l => console.log(`  - ${l.book?.title}`));

if (listingIds.length === 0) process.exit(0);

// Tráfico a sus fichas desde ayer
const since = new Date();
since.setHours(since.getHours() - 30); // últimas 30h

const { data: views } = await supabase
  .from("page_views")
  .select("listing_id, created_at, session_id")
  .in("listing_id", listingIds)
  .gte("created_at", since.toISOString());

console.log(`\nVistas a fichas de Barbara (últimas 30h): ${views?.length ?? 0}`);

// Agrupar por listing
const byListing = {};
for (const v of views ?? []) {
  byListing[v.listing_id] = (byListing[v.listing_id] ?? 0) + 1;
}

for (const [lid, count] of Object.entries(byListing).sort((a,b) => b[1]-a[1])) {
  const listing = listings?.find(l => l.id === lid);
  console.log(`  ${count} vista(s) — ${listing?.book?.title ?? lid}`);
}

// También ver búsquedas relacionadas con infantil/escolar
const { data: searches } = await supabase
  .from("search_queries")
  .select("query, created_at, results_count")
  .gte("created_at", since.toISOString())
  .or("query.ilike.%infantil%,query.ilike.%escolar%,query.ilike.%niño%,query.ilike.%colegio%,query.ilike.%lectura%,query.ilike.%basico%,query.ilike.%medio%")
  .order("created_at", { ascending: false });

console.log(`\nBúsquedas relacionadas con lectura/escolar (últimas 30h): ${searches?.length ?? 0}`);
searches?.forEach(s => console.log(`  "${s.query}" — ${s.results_count} resultados — ${new Date(s.created_at).toLocaleTimeString("es-CL")}`));
