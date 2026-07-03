import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

// registros por día últimos 7
const {data:us}=await s.from("users").select("id,full_name,email,created_at").gte("created_at",new Date(Date.now()-7*864e5).toISOString()).order("created_at",{ascending:false});
const byDay={};
for(const u of (us??[])) byDay[u.created_at.slice(0,10)]=(byDay[u.created_at.slice(0,10)]||0)+1;
console.log("Registros por día (7d):",JSON.stringify(byDay));
console.log("Total 7d:",us?.length,"\n");

// ruta de los 4 más recientes
const recientes=(us??[]).slice(0,4);
for(const u of recientes){
  const {data:pv}=await s.from("page_views").select("path,referrer,created_at").eq("user_id",u.id).order("created_at",{ascending:true}).limit(50);
  const paths=(pv??[]).map(p=>p.path);
  const ref=(pv??[]).map(p=>p.referrer).filter(Boolean)[0]||"(directo)";
  const buscó=paths.filter(p=>p.includes("/search?q=")).map(p=>{try{return decodeURIComponent((p.match(/q=([^&]+)/)||[])[1]||"")}catch{return""}}).filter(Boolean);
  console.log(`\n${u.full_name} — llegó de: ${ref.replace(/^https?:\/\//,"").slice(0,45)}`);
  console.log(`  buscó: ${buscó.length?buscó.join(", "):"(no usó buscador)"}`);
  console.log(`  publicó: ${paths.some(p=>p.startsWith("/publish"))?"SÍ":"no"} | pidió/solicitudes: ${paths.some(p=>p.includes("solicitudes"))?"SÍ":"no"}`);
  console.log(`  rutas: ${[...new Set(paths)].slice(0,8).join(" → ")}`);
}
