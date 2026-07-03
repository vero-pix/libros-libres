import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const VERO="2201d163-4423-4971-91f0-f6cebd00d1bd";

// paginar para traer todo
let rows=[],from=0;
while(true){
  const {data}=await s.from("listings")
    .select("price,original_price,condition,slug,is_collectible,book_id")
    .eq("seller_id",VERO).eq("status","active").range(from,from+199);
  if(!data||!data.length)break; rows.push(...data); if(data.length<200)break; from+=200;
}
// traer books
const ids=[...new Set(rows.map(r=>r.book_id))];
const books={};
for(let i=0;i<ids.length;i+=100){
  const {data:bs}=await s.from("books").select("id,title,author,category,subcategory,isbn,publisher,year").in("id",ids.slice(i,i+100));
  for(const b of (bs??[])) books[b.id]=b;
}
rows.sort((a,b)=>(b.price||0)-(a.price||0));
const esc=(v)=>{const x=String(v??"").replace(/"/g,'""');return /[",\n]/.test(x)?`"${x}"`:x;};
const header=["titulo","autor","precio_liquidacion","precio_normal","estado","categoria","isbn","editorial","ano","coleccionable","url"];
const lines=[header.join(",")];
let suma=0,sumaLleno=0,col=0;
for(const r of rows){
  const b=books[r.book_id]||{};
  suma+=r.price||0; sumaLleno+=(r.original_price||r.price||0); if(r.is_collectible)col++;
  const url=r.slug?`https://tuslibros.cl/libro/vero/${r.slug}`:"";
  lines.push([b.title,b.author,r.price,r.original_price??"",r.condition??"",b.category??"",b.isbn??"",b.publisher??"",b.year??"",r.is_collectible?"sí":"",url].map(esc).join(","));
}
fs.writeFileSync("docs/catalogo_vero_comprador.csv",lines.join("\n"));
console.log("Libros exportados:",rows.length);
console.log("CSV → docs/catalogo_vero_comprador.csv");
console.log("Valor a precio LIQUIDACIÓN (lo que pagaría hoy): $"+suma.toLocaleString("es-CL"));
console.log("Valor a precio NORMAL: $"+sumaLleno.toLocaleString("es-CL"));
console.log("Coleccionables/raros:",col);
