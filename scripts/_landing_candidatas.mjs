import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const norm=(x)=>(x||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
// búsquedas 30d
let pv=[],from=0;
while(true){const {data}=await s.from("page_views").select("path").ilike("path","/search?q=%").gte("created_at",new Date(Date.now()-30*864e5).toISOString()).range(from,from+999);if(!data||!data.length)break;pv.push(...data);if(data.length<1000)break;from+=1000;}
const queries=pv.map(p=>{let q=(p.path.match(/[?&]q=([^&]+)/)||[])[1]||"";try{q=decodeURIComponent(q.replace(/\+/g," "));}catch{}return norm(q);}).filter(Boolean);
const buscado=(term)=>queries.filter(q=>q.includes(norm(term))).length;
// candidatas: [nombre, term de búsqueda]
const cand=[["Megan Maxwell","maxwell"],["Danielle Steel","danielle"],["Nicholas Sparks","sparks"],["Novela negra / policial","negra"],["Historia de Chile","chile"],["Carlos Fuentes","fuentes"],["Sarah J. Maas","maas"],["Clásicos","clasic"]];
console.log("CANDIDATA → búsquedas (30d) que la mencionan:");
for(const [n,t] of cand) console.log(`  ${String(buscado(t)).padStart(3)} búsq · ${n}`);
