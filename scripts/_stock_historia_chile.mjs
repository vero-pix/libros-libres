import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
let ls=[],from=0;
while(true){const {data}=await s.from("listings").select("book:books(title,author,subcategory,tags)").eq("status","active").range(from,from+999);if(!data||!data.length)break;ls.push(...data);if(data.length<1000)break;from+=1000;}
const NEEDLES=["chile","chilena","chileno","pinochet","allende","unidad popular","dictadura","guerra del pacifico","mapuche","santiago antiguo","valparaiso","historia de chile","frias valenzuela","villalobos","jocelyn-holt","gabriel salazar","araucan","conquista","independencia de chile","o'higgins","balmaceda","portales"];
const norm=(x)=>(x||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const match=ls.filter(l=>{const b=l.book;if(!b)return false;
  const hay=norm(`${b.title} ${b.author}`);
  const esHist=b.subcategory==="no-ficcion-historia"||(b.tags||[]).some(t=>/histor/i.test(t));
  const esChile=NEEDLES.some(n=>hay.includes(norm(n)));
  return esChile && (esHist || esChile); // chileno suficiente
});
console.log("Libros que matchean Historia de Chile:",match.length);
console.log("\nMuestra (15):");
for(const m of match.slice(0,15)) console.log(`  • ${m.book?.title} — ${m.book?.author??""}`);
