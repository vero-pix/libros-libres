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

const ids = ["lorena.cortes","nicolas"];
for (const un of ids) {
  const { data: u } = await s.from("users").select("*").eq("username", un).maybeSingle();
  if (!u) { console.log(`@${un}: no encontrado`); continue; }
  console.log(`\n━━━ ${u.full_name} (@${u.username}) ━━━`);
  console.log(`  email: ${u.email}`);
  console.log(`  tel: ${u.phone ?? "—"}  ·  ciudad: ${u.city ?? "—"}  ·  comuna: ${u.comuna ?? "—"}`);
  console.log(`  MP conectado: ${u.mp_access_token ? "✅ sí" : "❌ no"}`);
  console.log(`  destacado: ${u.is_featured ? "✅" : "no"}  ·  vacaciones: ${u.on_vacation ? "🌴" : "no"}`);

  const { data: ls } = await s.from("listings").select("price, status, cover_image_url, book:books(title, author, description, category, isbn)").eq("seller_id", u.id).order("created_at",{ascending:false});
  console.log(`  ${ls.length} listings:`);
  for (const l of ls) {
    const f=[];
    if(!l.cover_image_url) f.push("sin foto propia");
    if(!l.book?.description||l.book.description.length<30) f.push("sin sinopsis");
    if(!l.book?.category) f.push("sin cat");
    if(!l.price||l.price<=0) f.push("❌sin precio");
    console.log(`    $${String(l.price).padStart(7)} ${l.status.padEnd(8)} "${(l.book?.title??"?").slice(0,38)}" ${f.length?"["+f.join(", ")+"]":"✅"}`);
  }
}
