import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const cnt=async(path,from,to)=>{
  let q=s.from("page_views").select("*",{count:"exact",head:true}).eq("path",path);
  if(from)q=q.gte("created_at",from); if(to)q=q.lt("created_at",to);
  const {count}=await q; return count??0;
};
const d=(s)=>s+"T00:00:00Z";
console.log("VISTAS a /vendedor/vero:");
console.log("  19 jun:", await cnt("/vendedor/vero",d("2026-06-19"),d("2026-06-20")));
console.log("  20 jun:", await cnt("/vendedor/vero",d("2026-06-20"),d("2026-06-21")));
console.log("  21 jun:", await cnt("/vendedor/vero",d("2026-06-21"),d("2026-06-22")));
console.log("  22 jun (caluga LIVE):", await cnt("/vendedor/vero",d("2026-06-22"),d("2026-06-23")));
console.log("  23 jun (hoy, parcial):", await cnt("/vendedor/vero",d("2026-06-23"),d("2026-06-24")));
// referrers de las visitas a /vendedor/vero el 22-23
const {data:refs}=await s.from("page_views").select("referrer,created_at").eq("path","/vendedor/vero").gte("created_at",d("2026-06-22")).limit(200);
const byRef={};
for(const r of (refs??[])){const k=(r.referrer||"(directo/sin referrer)").replace(/^https?:\/\/[^/]+/,"").slice(0,40)||"/";byRef[k]=(byRef[k]||0)+1;}
console.log("\nDe dónde llegaron a /vendedor/vero (22-23 jun):");
Object.entries(byRef).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${v}× ${k}`));
