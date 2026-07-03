import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const c=async(f)=>{let q=s.from("listings").select("*",{count:"exact",head:true}).eq("status","active");if(f)q=f(q);const{count}=await q;return count??0;};
console.log("STOCK del sitio (todos los vendedores):");
console.log("  activos totales:", await c());
console.log("  ≤ $3.000:", await c(q=>q.lte("price",3000)));
console.log("  ≤ $5.000:", await c(q=>q.lte("price",5000)));
console.log("  ≤ $10.000:", await c(q=>q.lte("price",10000)));
console.log("  con descuento (original_price > price):", await c(q=>q.not("original_price","is",null)));
