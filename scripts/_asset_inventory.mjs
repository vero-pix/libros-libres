import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const c=async(t,f)=>{let q=s.from(t).select("*",{count:"exact",head:true});if(f)q=f(q);const {count}=await q;return count??0;};

console.log("CATÁLOGO");
console.log("  listings activos:", await c("listings",q=>q.eq("status","active")));
console.log("  listings totales:", await c("listings"));
console.log("  libros (books):", await c("books"));

// sellers distintos con listing activo
const {data:ls}=await s.from("listings").select("seller_id").eq("status","active");
const sellers=new Set((ls??[]).map(l=>l.seller_id));
console.log("  vendedores con catálogo activo:", sellers.size);

console.log("\nUSUARIOS");
console.log("  registrados totales:", await c("users"));
console.log("  con MercadoPago conectado:", await c("users",q=>q.not("mercadopago_access_token","is",null)));
console.log("  destacados:", await c("users",q=>q.eq("featured",true)));

console.log("\nDEMANDA / FEATURES");
console.log("  pedidos 'Se busca' abiertos:", await c("book_requests",q=>q.eq("fulfilled",false)));
console.log("  suscriptores newsletter:", await c("newsletter_subscribers").catch(()=>"(tabla?)"));
console.log("  reviews:", await c("reviews"));
console.log("  ciudades con landing geo:", await c("cities").catch(()=>"?"));
