import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: ls } = await s.from("listings").select("seller_id").eq("status","active");
const cnt={}; for(const l of ls) cnt[l.seller_id]=(cnt[l.seller_id]??0)+1;
const ids=Object.keys(cnt);
const { data: users } = await s.from("users").select("id,full_name,username,city,default_address,default_latitude,default_longitude").in("id",ids);

const noCity = users.filter(u=>!u.city || !u.city.trim());
console.log(`Vendedores activos: ${users.length} · SIN ciudad: ${noCity.length}\n`);
console.log("SIN ciudad (¿tienen coords/dirección para deducirla?):");
for(const u of noCity.sort((a,b)=>cnt[b.id]-cnt[a.id])){
  const coords = (u.default_latitude && u.default_longitude) ? `${u.default_latitude.toFixed(4)},${u.default_longitude.toFixed(4)}` : "—";
  console.log(`  ${String(cnt[u.id]).padStart(3)} libros — ${u.full_name} (@${u.username??"—"}) · addr:${u.default_address??"—"} · coords:${coords}`);
}
console.log("\nCON ciudad:");
for(const u of users.filter(u=>u.city&&u.city.trim())) console.log(`  ${u.full_name} → ${u.city}`);
