import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data}=await s.from("orders").select("created_at,status,book_price,shipping_cost,service_fee,total,discount_amount,seller_id").in("status",["paid","delivered","shipped"]).order("created_at");
let gmv=0,fee=0,ship=0;
console.log("VENTAS REALES:");
for(const o of (data??[])){
  gmv+=Number(o.book_price||0); fee+=Number(o.service_fee||0); ship+=Number(o.shipping_cost||0);
  console.log(`  ${o.created_at?.slice(0,10)} ${o.status} · libro=$${o.book_price} envío=$${o.shipping_cost} service_fee=$${o.service_fee} total=$${o.total}`);
}
console.log(`\nValor de libros vendidos: $${gmv.toLocaleString("es-CL")}`);
console.log(`Comisión tuslibros (service_fee): $${fee.toLocaleString("es-CL")}`);
// quién vendió
const {data:sellers}=await s.from("orders").select("seller_id, status").in("status",["paid","delivered","shipped"]);
const bySeller={};
for(const o of (sellers??[])) bySeller[o.seller_id]=(bySeller[o.seller_id]||0)+1;
const ids=Object.keys(bySeller);
const {data:us}=await s.from("users").select("id,full_name,username").in("id",ids);
console.log("\nVendedores que han vendido:");
for(const u of (us??[])) console.log(`  ${bySeller[u.id]}× ${u.full_name} (@${u.username})`);
