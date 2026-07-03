import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

// vendedores con al menos 1 libro activo
const { data: ls } = await s.from("listings").select("seller_id").eq("status","active");
const cnt={}; for(const l of ls) cnt[l.seller_id]=(cnt[l.seller_id]??0)+1;
const ids=Object.keys(cnt);

const { data: users, error } = await s.from("users")
  .select("id,full_name,username,city,created_at,mercadopago_access_token,mercadopago_connected_at,on_vacation")
  .in("id",ids);
if(error){console.log("ERROR:",error.message);process.exit(1);}

const now = Date.now();
const DAYS = 30;
const isNew = (u)=> u.created_at && (now - new Date(u.created_at).getTime()) < DAYS*86400000;

const withMp = users.filter(u => u.mercadopago_access_token);
const newSellers = users.filter(isNew);
const newWithMp = newSellers.filter(u => u.mercadopago_access_token);

console.log(`━━━ VENDEDORES ACTIVOS (≥1 libro activo) ━━━`);
console.log(`Total activos:        ${users.length}`);
console.log(`  Con MercadoPago:    ${withMp.length}`);
console.log(`  Sin MercadoPago:    ${users.length - withMp.length}\n`);

console.log(`━━━ NUEVOS (registrados últimos ${DAYS} días) ━━━`);
console.log(`Nuevos activos:       ${newSellers.length}`);
console.log(`  Con MercadoPago:    ${newWithMp.length}`);
console.log(`  Sin MercadoPago:    ${newSellers.length - newWithMp.length}\n`);

console.log("Detalle nuevos (más reciente primero):");
for(const u of newSellers.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at))){
  const d = new Date(u.created_at).toLocaleDateString("es-CL");
  console.log(`  ${cnt[u.id]?String(cnt[u.id]).padStart(3):"  ?"} libros · ${d} · ${u.mercadopago_access_token?"✅ MP":"❌ MP"}${u.on_vacation?" 🌴":""} — ${u.full_name} (@${u.username??"—"}, ${u.city??"—"})`);
}
