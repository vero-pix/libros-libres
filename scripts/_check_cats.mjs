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
const { data } = await s.from("books").select("category,subcategory,genre").not("category","is",null);
const cats = new Map();
for (const b of data||[]) {
  const key = `${b.category||"-"} / ${b.subcategory||"-"}`;
  cats.set(key, (cats.get(key)||0)+1);
}
console.log("Top categorías:");
for (const [k,v] of [...cats.entries()].sort((a,b)=>b[1]-a[1]).slice(0,25)) console.log(`  ${v}  ${k}`);
const { data: g } = await s.from("books").select("genre").not("genre","is",null);
const genres = new Map();
for (const b of g||[]) genres.set(b.genre, (genres.get(b.genre)||0)+1);
console.log("\nTop genres:");
for (const [k,v] of [...genres.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15)) console.log(`  ${v}  ${k}`);
