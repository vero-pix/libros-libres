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

const { data: listings } = await s
  .from("listings")
  .select("id, book_id, book:books(title, author, description)")
  .eq("id", "66881156-96fa-4ce4-8d64-b60a2b75ccc9")
  .limit(1);

if (!listings?.length) {
  // buscar por slug
  const { data: alt } = await s
    .from("listings")
    .select("id, book_id, slug, book:books(title, author, description)")
    .eq("slug", "camino-al-futuro")
    .limit(3);
  console.log("Por slug:", JSON.stringify(alt, null, 2));
  process.exit(1);
}

const l = listings[0];
console.log(`Listing: ${l.id}`);
console.log(`Book id: ${l.book_id}`);
console.log(`Título: ${l.book?.title}`);
console.log(`Autor: ${l.book?.author}`);
console.log(`Description actual:`);
console.log("---");
console.log(l.book?.description ?? "(sin descripción)");
console.log("---");
