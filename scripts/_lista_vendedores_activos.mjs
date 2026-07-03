import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
// vendedores con >=1 listing activo
let ls=[],from=0;
while(true){const {data}=await s.from("listings").select("seller_id").eq("status","active").range(from,from+999);if(!data||!data.length)break;ls.push(...data);if(data.length<1000)break;from+=1000;}
const counts={};
for(const l of ls) counts[l.seller_id]=(counts[l.seller_id]||0)+1;
const ids=Object.keys(counts);
const {data:us}=await s.from("users").select("id,full_name,email,username").in("id",ids);
const VERO="2201d163-4423-4971-91f0-f6cebd00d1bd";
const validos=(us??[]).filter(u=>u.email && u.id!==VERO && u.email!=="vero@tuslibros.cl" && !/test|noreply/.test(u.email));
console.log(`Vendedores activos con email (excluyendo admin): ${validos.length}\n`);
for(const u of validos.sort((a,b)=>counts[b.id]-counts[a.id])) console.log(`  ${counts[u.id]}× ${u.full_name} <${u.email}>`);
