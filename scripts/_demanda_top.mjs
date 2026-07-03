import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const norm=(x)=>(x||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();

let pv=[],from=0;
const since=new Date(Date.now()-30*864e5).toISOString();
while(true){const {data}=await s.from("page_views").select("path").ilike("path","/search?q=%").gte("created_at",since).range(from,from+999);if(!data||!data.length)break;pv.push(...data);if(data.length<1000)break;from+=1000;}
const freq={};
for(const p of pv){let q=(p.path.match(/[?&]q=([^&]+)/)||[])[1]||"";try{q=decodeURIComponent(q.replace(/\+/g," "));}catch{}q=q.trim();if(q.length<3)continue;const k=norm(q);if(!freq[k])freq[k]={display:q,count:0};freq[k].count++;}

let books=[],bf=0;
while(true){const {data}=await s.from("books").select("title,author").range(bf,bf+999);if(!data||!data.length)break;books.push(...data);if(data.length<1000)break;bf+=1000;}
const blob=books.map(b=>norm(b.title)+" "+norm(b.author)).join(" | ");

// solo sin stock, ordenadas por frecuencia, mín 2 búsquedas, quitar términos genéricos
const ruido=new Set(["cine","libros","libro","novela","romance","derecho","enfermeria","historia","arte","pdf"]);
const sin=Object.values(freq).filter(f=>!blob.includes(norm(f.display))&&f.count>=2&&!ruido.has(norm(f.display))&&f.display.length>=4);
sin.sort((a,b)=>b.count-a.count);
console.log("TOP demanda insatisfecha (≥2 búsquedas, sin stock):\n");
for(const r of sin.slice(0,35)) console.log(`  ${String(r.count).padStart(2)}× ${r.display}`);
