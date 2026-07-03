import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const norm=(x)=>(x||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();

// 1. todas las búsquedas /search?q= últimos 30 días
let pv=[],from=0;
const since=new Date(Date.now()-30*864e5).toISOString();
while(true){
  const {data}=await s.from("page_views").select("path,created_at").ilike("path","/search?q=%").gte("created_at",since).range(from,from+999);
  if(!data||!data.length)break; pv.push(...data); if(data.length<1000)break; from+=1000;
}
// contar frecuencia por query normalizada
const freq={};
for(const p of pv){
  let q=(p.path.match(/[?&]q=([^&]+)/)||[])[1]||"";
  try{q=decodeURIComponent(q.replace(/\+/g," "));}catch{}
  q=q.trim(); if(!q||q.length<2)continue;
  const key=norm(q);
  if(!freq[key]) freq[key]={display:q,count:0};
  freq[key].count++;
}

// 2. catálogo (títulos+autores) para saber qué SÍ existe
let books=[],bf=0;
while(true){
  const {data}=await s.from("books").select("title,author").range(bf,bf+999);
  if(!data||!data.length)break; books.push(...data); if(data.length<1000)break; bf+=1000;
}
const blob=books.map(b=>norm(b.title)+" "+norm(b.author)).join(" | ");

// 3. clasificar: ¿la búsqueda tiene match en catálogo?
const sinResultado=[], conResultado=[];
for(const k of Object.keys(freq)){
  const {display,count}=freq[k];
  const hit=blob.includes(k);
  (hit?conResultado:sinResultado).push({q:display,count,key:k});
}
sinResultado.sort((a,b)=>b.count-a.count);
console.log(`Búsquedas distintas (30d): ${Object.keys(freq).length} | con stock: ${conResultado.length} | SIN stock: ${sinResultado.length}\n`);
console.log("══ DEMANDA INSATISFECHA (lo que buscaron y NO teníamos) ══");
for(const r of sinResultado) console.log(`  ${String(r.count).padStart(2)}× ${r.q}`);
