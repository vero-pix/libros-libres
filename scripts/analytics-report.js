import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Leer .env.local a mano
const env = fs.readFileSync(".env.local", "utf8");
const getEnv = (key) => env.split("\n").find(line => line.startsWith(key))?.split("=")[1]?.trim()?.replace(/["']/g, "");

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- ACTUALIZANDO DESTACADOS ---");
  const { error: updateError } = await supabase
    .from("users")
    .update({ featured: false })
    .ilike("full_name", "%Huertas%");

  if (updateError) console.error("Error quitando a Huertas:", updateError);
  else console.log("✅ Huertas ya no es destacado.");

  console.log("\n--- REPORTE DE VISITAS (Últimos 7 días) ---");
  const { data: views, error: viewError } = await supabase
    .from("page_views")
    .select("listing_id, created_at")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (viewError) {
    console.error("Error en reporte:", viewError);
    return;
  }

  const listingIds = Array.from(new Set(views.map(v => v.listing_id).filter(Boolean)));
  const { data: listings } = await supabase
    .from("listings")
    .select("id, seller_id, users(full_name)")
    .in("id", listingIds);

  const sellerMap = new Map();
  listings?.forEach(l => {
    sellerMap.set(l.id, l.users?.full_name || "Desconocido");
  });

  const stats = {};
  views.forEach(v => {
    const seller = sellerMap.get(v.listing_id || "");
    if (seller) stats[seller] = (stats[seller] || 0) + 1;
  });

  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  console.log("Ranking de vendedores por visitas:");
  sorted.slice(0, 10).forEach(([name, count], i) => {
    console.log(`${i + 1}. ${name}: ${count} visitas`);
  });
}

run();
