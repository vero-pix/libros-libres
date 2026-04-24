import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findMatches() {
  console.log("🔍 Buscando coincidencias entre pedidos y libros disponibles...");

  const { data: requests } = await supabase
    .from("book_requests")
    .select("id, title, author, user_id, email")
    .eq("status", "pending");

  const { data: listings } = await supabase
    .from("listings")
    .select("id, book:books(title, author), seller_id")
    .eq("status", "active");

  if (!requests || !listings) return;

  const matches: any[] = [];

  requests.forEach(req => {
    listings.forEach(listing => {
      const reqTitle = req.title.toLowerCase();
      const listTitle = (listing.book as any).title.toLowerCase();
      
      if (listTitle.includes(reqTitle) || reqTitle.includes(listTitle)) {
        matches.push({
          request: req,
          listing: listing
        });
      }
    });
  });

  console.log(`\nSe encontraron ${matches.length} posibles coincidencias.`);
  matches.forEach(m => {
    console.log(`- Pedido: "${m.request.title}" matchea con Libro: "${(m.listing.book as any).title}"`);
  });
}

findMatches();
