import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("="); const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1) Lorena: los 24 son novelas (Sparks, Steel, Maxwell, Moccia, Cass, Rice,
//    Duras, Ondaatje) → categoría ficcion a los que están sin categoría.
const { data: lorena } = await s.from("users").select("id").eq("username", "lorena.cortes").maybeSingle();
const { data: ls } = await s.from("listings").select("book_id, book:books(category)").eq("seller_id", lorena.id);
const toFix = ls.filter((l) => !l.book?.category).map((l) => l.book_id);
console.log(`Lorena: ${toFix.length} libros sin categoría → ficcion`);
if (toFix.length) {
  const { error } = await s.from("books").update({ category: "ficcion" }).in("id", toFix);
  console.log(error ? "  ❌ " + error.message : "  ✅ categorizados");
}

// 2) Destacar a ambos vendedores nuevos (columna correcta: featured)
for (const un of ["lorena.cortes", "nicolas"]) {
  const { error } = await s.from("users").update({ featured: true }).eq("username", un);
  console.log(`featured @${un}: ${error ? "❌ " + error.message : "✅"}`);
}

// 3) Verificación final
const { data: u } = await s.from("users").select("username, featured").in("username", ["lorena.cortes", "nicolas"]);
const { data: ls2 } = await s.from("listings").select("book:books(category)").eq("seller_id", lorena.id);
const c = {}; for (const l of ls2) c[l.book?.category ?? "NULL"] = (c[l.book?.category ?? "NULL"] ?? 0) + 1;
console.log("\nfeatured:", u);
console.log("categorías Lorena:", c);
