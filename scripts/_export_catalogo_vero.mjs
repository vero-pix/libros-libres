import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const VERO="2201d163-4423-4971-91f0-f6cebd00d1bd";
const {data}=await s.from("listings")
  .select("price,original_price,condition,slug,is_collectible,book:books(title,author,category,subcategory,isbn,publisher,year)")
  .eq("seller_id",VERO).eq("status","active")
  .order("price",{ascending:false});
const rows=data??[];
console.log("Total activos:",rows.length);

const esc=(v)=>{const x=String(v??"").replace(/"/g,'""');return /[",\n]/.test(x)?`"${x}"`:x;};
const header=["titulo","autor","precio","precio_lleno","estado","categoria","subcategoria","isbn","editorial","ano","coleccionable","url"];
const lines=[header.join(",")];
let suma=0;
for(const r of rows){
  const b=r.book||{};
  suma+=r.price||0;
  const url=r.slug?`https://tuslibros.cl/libro/vero/${r.slug}`:"";
  lines.push([b.title,b.author,r.price,r.original_price??"",r.condition??"",b.category??"",b.subcategory??"",b.isbn??"",b.publisher??"",b.year??"",r.is_collectible?"sí":"",url].map(esc).join(","));
}
fs.writeFileSync("docs/catalogo_vero_comprador.csv",lines.join("\n"));
console.log("CSV → docs/catalogo_vero_comprador.csv");
console.log("Valor total catálogo (suma precios actuales): $"+suma.toLocaleString("es-CL"));
// resumen por categoría
const byCat={};
for(const r of rows){const c=r.book?.category||"sin cat";byCat[c]=(byCat[c]||0)+1;}
console.log("Por categoría:",JSON.stringify(byCat));
const col=rows.filter(r=>r.is_collectible).length;
console.log("Coleccionables:",col);
