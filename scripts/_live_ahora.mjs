import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

// actividad última hora (page_views) — quién está navegando AHORA
const h1=new Date(Date.now()-60*6e4).toISOString();
const {data:pv}=await s.from("page_views").select("path,user_id,session_id,device,country,referrer,created_at").gte("created_at",h1).order("created_at",{ascending:false}).limit(500);
const rows=pv??[];
console.log(`🔴 EN VIVO — ${rows.length} vistas en la última hora`);

// sesiones distintas
const sesiones={};
for(const r of rows){
  const k=r.session_id||r.user_id||"anon";
  if(!sesiones[k]) sesiones[k]={paths:[],device:r.device,country:r.country,user:r.user_id,ref:r.referrer,last:r.created_at};
  sesiones[k].paths.push(r.path);
}
const lista=Object.entries(sesiones).sort((a,b)=>new Date(b[1].last)-new Date(a[1].last));
console.log(`👥 ${lista.length} visitantes distintos activos\n`);
for(const [sid,v] of lista.slice(0,12)){
  const mins=Math.round((Date.now()-new Date(v.last).getTime())/6e4);
  const ref=(v.ref||"directo").replace(/^https?:\/\//,"").split("/")[0].slice(0,28);
  const logged=v.user?"👤logueado":"👻anónimo";
  console.log(`hace ${mins}min · ${logged} · ${v.device} · ${v.country??"?"} · de:${ref}`);
  console.log(`   ${v.paths.slice(0,6).reverse().join(" → ")}`);
}
