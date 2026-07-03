import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) { if (line.startsWith("#")||!line.includes("=")) continue; const i=line.indexOf("="); const k=line.slice(0,i).trim(); if(!process.env[k]) process.env[k]=line.slice(i+1).trim(); }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const VERO="2201d163-4423-4971-91f0-f6cebd00d1bd";
const { data, count } = await s.from("listings")
  .select("id, cover_image_url, price, original_price, book:books(title, cover_url)", { count: "exact" })
  .eq("seller_id", VERO).eq("status","active").not("original_price","is",null).order("price",{ascending:false}).limit(6);
console.log("count con original_price:", count);
for (const l of (data??[])) console.log(`  cover_image_url=${l.cover_image_url?"Y":"-"} book.cover_url=${l.book?.cover_url?"Y":"-"}  "${l.book?.title}"`);
