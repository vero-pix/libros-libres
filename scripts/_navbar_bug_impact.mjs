import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const SINCE="2026-06-22T00:00:00Z"; // navbar nuevo salió el 22

// paginar todas las page_views desde el 22
let all=[],from=0;
while(true){
  const {data}=await s.from("page_views").select("user_id,device,path,created_at").gte("created_at",SINCE).range(from,from+999);
  if(!data||!data.length)break; all.push(...data); if(data.length<1000)break; from+=1000;
}
console.log(`page_views desde 22 jun: ${all.length}`);

// device breakdown
const dev={};
for(const r of all) dev[r.device||"?"]=(dev[r.device||"?"]||0)+1;
console.log("Por device (todas):", JSON.stringify(dev));

// usuarios LOGUEADOS (user_id != null) por device → los afectados son los no-desktop
const logged=all.filter(r=>r.user_id);
const byDevUsers={};
for(const r of logged){ (byDevUsers[r.device||"?"] ??= new Set()).add(r.user_id); }
console.log("\nUsuarios LOGUEADOS distintos por device:");
for(const [d,set] of Object.entries(byDevUsers)) console.log(`  ${d}: ${set.size} usuarios`);

const afectados=new Set();
for(const r of logged){ if(r.device && r.device!=="desktop") afectados.add(r.user_id); }
console.log(`\n👉 Usuarios logueados en device NO-desktop (probablemente afectados): ${afectados.size}`);
