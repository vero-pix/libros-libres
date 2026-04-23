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

// Listings por seller
const { data: bySeller } = await s
  .from("listings")
  .select("seller_id", { count: "exact" })
  .eq("status", "active");

const counts = {};
for (const l of bySeller ?? []) counts[l.seller_id] = (counts[l.seller_id] || 0) + 1;

const sellerIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
const { data: users } = await s.from("users").select("id, full_name, email, username").in("id", sellerIds);
const byId = Object.fromEntries((users ?? []).map((u) => [u.id, u]));

console.log("Sellers con listings activos:\n");
for (const sid of sellerIds) {
  const u = byId[sid];
  console.log(`  ${counts[sid].toString().padStart(4)} listings  |  ${sid.slice(0,8)}  |  ${u?.full_name ?? "?"}  |  @${u?.username ?? "—"}  |  ${u?.email ?? ""}`);
}
