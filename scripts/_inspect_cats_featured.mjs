import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#")||!line.includes("=")) continue;
  const i=line.indexOf("="); const k=line.slice(0,i).trim();
  if(!process.env[k]) process.env[k]=line.slice(i+1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Categorías existentes (distinct) y conteo
const { data } = await s.from("books").select("category").not("category","is",null);
const c={}; for(const b of data) c[b.category]=(c[b.category]??0)+1;
console.log("Categorías en uso (slug → #libros):");
for(const [k,n] of Object.entries(c).sort((a,b)=>b[1]-a[1])) console.log(`  ${k.padEnd(28)} ${n}`);

// Cómo se marca featured: ver columnas de users con 'featur'
const { data: u } = await s.from("users").select("*").eq("is_featured", true).limit(3);
console.log(`\nVendedores featured (is_featured=true): ${u?.length ?? 0}`);
for(const x of u??[]) console.log(`  @${x.username} — ${x.full_name} (featured_order=${x.featured_order ?? "—"})`);
