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
const UID = "fbeedb59-210a-4639-a4ee-6884368058cd";

const { count: total } = await s.from("listings").select("*", {count:"exact",head:true});
console.log(`Total listings en sistema: ${total}`);

const { count: buhardillaCount } = await s.from("listings").select("*", {count:"exact",head:true}).eq("seller_id", UID);
console.log(`Buhardilla listings: ${buhardillaCount}`);

// Últimos 15 por fecha
const { data: recent, error } = await s.from("listings").select("id,status,created_at,seller_id,book_id").order("created_at", {ascending:false}).limit(15);
if (error) { console.error("ERR:", error); }
console.log(`\nÚltimos ${recent?.length} listings:`);
for (const l of recent ?? []) {
  const { data: book } = await s.from("books").select("title").eq("id", l.book_id).single();
  const { data: seller } = await s.from("users").select("username,full_name").eq("id", l.seller_id).single();
  console.log(`  [${l.status}] ${l.created_at.slice(0,19)} · ${seller?.username ?? seller?.full_name ?? "?"} · ${book?.title ?? "?"}`);
}
