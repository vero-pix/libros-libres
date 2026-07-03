import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

const norm=(x)=>(x||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();

// 1. pedidos abiertos
const {data:reqs}=await s.from("book_requests").select("id,title,author,requester_email,requester_whatsapp,created_at").eq("fulfilled",false);
console.log(`Pedidos abiertos: ${reqs?.length}\n`);

// 2. catálogo activo (libros)
let listings=[],from=0;
while(true){
  const {data}=await s.from("listings").select("id,slug,price,seller:users(username),book:books(title,author)").eq("status","active").range(from,from+499);
  if(!data||!data.length)break; listings.push(...data); if(data.length<500)break; from+=500;
}
console.log(`Catálogo activo: ${listings.length} libros\n`);

let conMatch=0, conEmail=0;
for(const r of (reqs??[])){
  const rt=norm(r.title);
  if(rt.length<4) continue;
  const matches=listings.filter(l=>{
    const lt=norm(l.book?.title);
    return lt && (lt.includes(rt)||rt.includes(lt));
  });
  if(matches.length){
    conMatch++;
    const tieneEmail=!!r.requester_email;
    if(tieneEmail) conEmail++;
    console.log(`🎯 PEDIDO: "${r.title}" ${r.author?`(${r.author})`:""} ${tieneEmail?"📧 "+r.requester_email:"❌ sin email"}`);
    for(const m of matches.slice(0,3)){
      const url=m.slug&&m.seller?.username?`/libro/${m.seller.username}/${m.slug}`:`/listings/${m.id}`;
      console.log(`     → YA EXISTE: "${m.book?.title}" $${m.price}  tuslibros.cl${url}`);
    }
  }
}
console.log(`\n═══ RESUMEN ═══`);
console.log(`Pedidos con libro YA disponible en catálogo: ${conMatch} de ${reqs?.length}`);
console.log(`...de esos, con email para avisar: ${conEmail}`);
