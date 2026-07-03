import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const emails=["fermae96@gmail.com","pablorivera19899812@gmail.com","javieraespejojeraldo@gmail.com","parach2@gmail.com","flor.rego8@protonmail.com","valenzuela.victor@gmail.com","ojopiojo@gmail.com","ariffo@gmail.com"];
const {data:us}=await s.from("users").select("id,full_name,email").in("email",emails);
const map={}; for(const u of us) map[u.id]=u;
// page_views de estos usuarios
for(const u of us){
  const {data:pv}=await s.from("page_views").select("path,created_at").eq("user_id",u.id).order("created_at",{ascending:true}).limit(40);
  const paths=(pv??[]).map(p=>p.path);
  const pidio=paths.some(p=>p.includes("/solicitudes")||p.includes("/publish?title")); // pedir
  const fuePublish=paths.some(p=>p.startsWith("/publish"));
  console.log(`\n${u.full_name}: ${paths.length} vistas`);
  console.log("  rutas:", [...new Set(paths)].slice(0,12).join(" → ")||"(sin tracking)");
  console.log(`  → tocó /publish: ${fuePublish?"SÍ":"no"} | tocó /solicitudes (pedir): ${paths.some(p=>p.includes("solicitudes"))?"SÍ":"no"}`);
}
// agregado: a dónde va la gente nueva
