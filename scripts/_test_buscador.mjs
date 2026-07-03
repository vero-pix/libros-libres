import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
// ¿qué libros con "tolkien" o "anillos" hay activos?
const {data:bs}=await s.from("books").select("id,title,author").or("title.ilike.%tolkien%,author.ilike.%tolkien%,title.ilike.%anillos%");
console.log("Libros con tolkien/anillos en BD:");
for(const b of (bs??[])){
  const {count}=await s.from("listings").select("*",{count:"exact",head:true}).eq("book_id",b.id).eq("status","active");
  console.log(`  "${b.title}" — ${b.author} | activos:${count}`);
}
// términos de búsqueda recientes que dieron 0 (de page_views con /search?q=)
const {data:pv}=await s.from("page_views").select("path").ilike("path","/search?q=%").order("created_at",{ascending:false}).limit(200);
const queries=[...new Set((pv??[]).map(p=>decodeURIComponent((p.path.match(/q=([^&]+)/)||[])[1]||"")).filter(Boolean))];
console.log(`\nBúsquedas recientes (${queries.length} distintas):`, queries.slice(0,25).join(" · "));
