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

const VERO_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";

// Top vendedores por cantidad de listings, excluyendo vero
const { data: allListings } = await s
  .from("listings")
  .select("seller_id, status, created_at");

const bySeller = new Map();
for (const l of allListings ?? []) {
  if (l.seller_id === VERO_ID) continue;
  if (!bySeller.has(l.seller_id)) {
    bySeller.set(l.seller_id, { count: 0, active: 0, completed: 0, last: null });
  }
  const e = bySeller.get(l.seller_id);
  e.count++;
  if (l.status === "active") e.active++;
  if (l.status === "completed") e.completed++;
  if (!e.last || l.created_at > e.last) e.last = l.created_at;
}

const top = [...bySeller.entries()]
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 5);

console.log("═══ TOP 5 VENDEDORES (excluyendo @vero) ═══");
for (const [id, info] of top) {
  const { data: u } = await s
    .from("users")
    .select("full_name, username, email, phone, featured, created_at")
    .eq("id", id)
    .single();
  const daysSinceLast = Math.floor((Date.now() - new Date(info.last).getTime()) / 86400000);
  console.log(`\n📚 ${u?.full_name ?? "(sin nombre)"} (@${u?.username ?? "sin username"}) ${u?.featured ? "⭐" : ""}`);
  console.log(`   ${id.slice(0, 8)} · ${u?.email} · ${u?.phone ?? "sin tel"}`);
  console.log(`   Listings: ${info.count} (activos ${info.active}, vendidos ${info.completed})`);
  console.log(`   Último publicado: ${info.last?.slice(0, 10)} (hace ${daysSinceLast} días)`);
  console.log(`   Registro: ${u?.created_at?.slice(0, 10)}`);

  // Mensajes recibidos sin responder
  const { data: convos } = await s
    .from("conversations")
    .select("id, buyer_id, created_at, last_message_at")
    .eq("seller_id", id)
    .order("last_message_at", { ascending: false })
    .limit(5);
  if (convos && convos.length > 0) {
    console.log(`   Conversaciones: ${convos.length}`);
    for (const c of convos.slice(0, 3)) {
      console.log(`     - ${c.last_message_at?.slice(0, 10) ?? "?"} con buyer ${c.buyer_id?.slice(0, 8)}`);
    }
  }

  // Carritos con sus libros (listings activos en cart_items)
  const { data: myListings } = await s
    .from("listings")
    .select("id")
    .eq("seller_id", id)
    .eq("status", "active");
  const listingIds = (myListings ?? []).map((l) => l.id);
  if (listingIds.length > 0) {
    const { data: carts } = await s
      .from("cart_items")
      .select("user_id, added_at, listing_id")
      .in("listing_id", listingIds);
    if (carts && carts.length > 0) {
      console.log(`   📦 Libros suyos en carritos ajenos: ${carts.length}`);
    }
  }

  // Órdenes recibidas
  const { data: ordersGot } = await s
    .from("orders")
    .select("id, status, total, created_at")
    .eq("seller_id", id)
    .order("created_at", { ascending: false });
  if (ordersGot && ordersGot.length > 0) {
    console.log(`   💰 Órdenes recibidas: ${ordersGot.length}`);
    for (const o of ordersGot.slice(0, 3)) {
      console.log(`     - ${o.created_at?.slice(0, 10)} · $${o.total} · ${o.status}`);
    }
  } else {
    console.log(`   💸 Sin órdenes recibidas`);
  }

  // MP conectado
  const { data: profile } = await s
    .from("users")
    .select("mercadopago_connected_at, default_address")
    .eq("id", id)
    .single();
  console.log(`   MP conectado: ${profile?.mercadopago_connected_at ? "SÍ " + profile.mercadopago_connected_at.slice(0,10) : "NO"}`);
  console.log(`   Dirección: ${profile?.default_address ?? "sin dirección"}`);
}
