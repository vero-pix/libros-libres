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

// Buscar usuario vero
const { data: user } = await supabase
  .from("users")
  .select("id, full_name, username, email")
  .eq("username", "vero")
  .single();

console.log("Usuario:", user);

// Buscar sus listings activos
const { data: listings } = await supabase
  .from("listings")
  .select("id, price, condition, is_collectible, status, book:books(title, author, publisher, published_year, category, subcategory, tags)")
  .eq("seller_id", user.id)
  .eq("status", "active")
  .order("created_at", { ascending: false });

console.log(`\nTotal listings activos: ${listings?.length ?? 0}\n`);

for (const l of listings ?? []) {
  const b = l.book;
  const tags = b.tags?.length ? b.tags.join(", ") : "-";
  const collectible = l.is_collectible ? "⭐ COLECCIONABLE" : "";
  console.log(`${collectible ? collectible + " " : ""}${b.title} — ${b.author ?? "?"} (${b.published_year ?? "?"}) $${l.price?.toLocaleString("es-CL")} [${b.category ?? "-"}/${b.subcategory ?? "-"}] tags: ${tags}`);
}
