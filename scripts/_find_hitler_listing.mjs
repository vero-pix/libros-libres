import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const c = fs.readFileSync(envPath, "utf-8");
for (const line of c.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const terms = ["hitler", "nazi", "führer", "fuhrer", "tercer reich", "mein kampf", "goebbels", "himmler", "eichmann", "auschwitz", "genocidio"];

const results = [];
for (const t of terms) {
  const { data: books } = await s
    .from("books")
    .select("id, title, author")
    .ilike("title", `%${t}%`);
  if (books && books.length > 0) {
    for (const b of books) {
      const { data: listings } = await s
        .from("listings")
        .select("id, status, deprioritized, price, seller:users!seller_id(username)")
        .eq("book_id", b.id);
      if (listings && listings.length > 0) {
        for (const l of listings) {
          results.push({
            term: t,
            listing_id: l.id,
            title: b.title,
            author: b.author,
            status: l.status,
            deprioritized: l.deprioritized,
            price: l.price,
            seller: l.seller?.username,
          });
        }
      }
    }
  }
}

console.log(JSON.stringify(results, null, 2));
