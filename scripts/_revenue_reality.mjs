import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

// columnas reales de orders
const {data:sample}=await s.from("orders").select("*").limit(1);
console.log("Columnas orders:", Object.keys(sample?.[0]??{}).join(", "));

// TODAS las órdenes (histórico completo)
const {data:orders}=await s.from("orders").select("*").order("created_at",{ascending:true});
const all=orders??[];
const byStatus={};
for(const o of all) byStatus[o.status]=(byStatus[o.status]||0)+1;
console.log(`\nÓRDENES TOTALES (histórico): ${all.length}`);
console.log("Por status:", JSON.stringify(byStatus));

const paid=all.filter(o=>["paid","delivered","shipped"].includes(o.status));
console.log(`\nÓrdenes pagadas/entregadas (ventas reales): ${paid.length}`);
let gmv=0, fee=0;
for(const o of paid){
  const amt=o.total_amount??o.amount??o.total??0; gmv+=Number(amt)||0;
  const f=o.marketplace_fee??o.fee??0; fee+=Number(f)||0;
  console.log(`  ${o.created_at?.slice(0,10)} · ${o.status} · total=$${amt} · fee=$${f}`);
}
console.log(`\nGMV (lo que movieron los compradores): $${gmv.toLocaleString("es-CL")}`);
console.log(`Tu comisión total (marketplace_fee): $${fee.toLocaleString("es-CL")}`);

// CARRITOS
const {data:carts}=await s.from("cart_items").select("id, added_at, user_id");
const cn=(carts??[]).length;
const users=new Set((carts??[]).map(c=>c.user_id)).size;
console.log(`\nCARRITOS: ${cn} items en carrito, de ${users} usuarios distintos`);
const recent=(carts??[]).filter(c=>Date.now()-new Date(c.added_at).getTime()<7*864e5).length;
console.log(`  agregados últimos 7d: ${recent}`);

// MP conectados
const {count:mpYes}=await s.from("users").select("*",{count:"exact",head:true}).not("mercadopago_access_token","is",null);
const {count:sellers}=await s.from("listings").select("seller_id",{count:"exact",head:true}).eq("status","active");
console.log(`\nVendedores con MP conectado: ${mpYes}`);
