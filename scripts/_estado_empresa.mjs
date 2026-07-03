import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const c=async(t,f)=>{let q=s.from(t).select("*",{count:"exact",head:true});if(f)q=f(q);const{count}=await q;return count??0;};
const dISO=(d)=>new Date(Date.now()-d*864e5).toISOString();

console.log("══ CATÁLOGO ══");
console.log("listings activos:", await c("listings",q=>q.eq("status","active")));
console.log("libros (books):", await c("books"));
console.log("nuevos activos 7d:", await c("listings",q=>q.eq("status","active").gte("created_at",dISO(7))));

console.log("\n══ USUARIOS / VENDEDORES ══");
console.log("usuarios totales:", await c("users"));
console.log("nuevos 7d:", await c("users",q=>q.gte("created_at",dISO(7))));
console.log("nuevos 30d:", await c("users",q=>q.gte("created_at",dISO(30))));
console.log("con MercadoPago:", await c("users",q=>q.not("mercadopago_access_token","is",null)));
let ls=[],from=0;
while(true){const {data}=await s.from("listings").select("seller_id").eq("status","active").range(from,from+999);if(!data||!data.length)break;ls.push(...data);if(data.length<1000)break;from+=1000;}
console.log("vendedores con catálogo activo:", new Set(ls.map(l=>l.seller_id)).size);

console.log("\n══ VENTAS / REVENUE ══");
const {data:ords}=await s.from("orders").select("status,book_price,service_fee,created_at");
const paid=(ords??[]).filter(o=>["paid","delivered","shipped"].includes(o.status));
console.log("órdenes totales:", ords?.length, "| pagadas/entregadas:", paid.length);
console.log("GMV (libros vendidos): $"+paid.reduce((a,o)=>a+(o.book_price||0),0).toLocaleString("es-CL"));
console.log("comisión total (service_fee): $"+paid.reduce((a,o)=>a+(o.service_fee||0),0).toLocaleString("es-CL"));
console.log("última venta:", paid.map(o=>o.created_at).sort().pop()?.slice(0,10)??"—");

console.log("\n══ DEMANDA ══");
console.log("pedidos 'Se busca' abiertos:", await c("book_requests",q=>q.eq("fulfilled",false)));
console.log("suscriptores newsletter:", await c("newsletter_subscribers"));
const {count:pv7}=await s.from("page_views").select("*",{count:"exact",head:true}).gte("created_at",dISO(7));
console.log("page_views 7d:", pv7);
