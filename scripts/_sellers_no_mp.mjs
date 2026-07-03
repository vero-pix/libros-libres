import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: ls } = await s.from("listings").select("seller_id").eq("status","active");
const cnt={}; for(const l of ls) cnt[l.seller_id]=(cnt[l.seller_id]??0)+1;
const ids=Object.keys(cnt);

const { data: users, error } = await s.from("users").select("id,full_name,username,mercadopago_access_token,mercadopago_connected_at").in("id",ids);
if(error){console.log("ERROR:",error.message);process.exit(1);}
const noMp = users.filter(u => !u.mercadopago_access_token);
const withMp = users.filter(u => u.mercadopago_access_token);

console.log(`Vendedores con al menos 1 libro ACTIVO: ${users.length}`);
console.log(`  Con MercadoPago:  ${withMp.length}`);
console.log(`  SIN MercadoPago:  ${noMp.length}\n`);
console.log("SIN MP (ordenados por # libros activos):");
for(const u of noMp.sort((a,b)=>cnt[b.id]-cnt[a.id]))
  console.log(`  ${String(cnt[u.id]).padStart(3)} libros — ${u.full_name} (@${u.username??"—"})`);
