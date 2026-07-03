import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
let ls=[],from=0;
while(true){const {data}=await s.from("listings").select("book:books(title,author,subcategory,tags)").eq("status","active").range(from,from+999);if(!data||!data.length)break;ls.push(...data);if(data.length<1000)break;from+=1000;}
const norm=(x)=>(x||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const mx=ls.filter(l=>norm(l.book?.author).includes("maxwell")).length;
const NEG=["simenon","camilleri","mankell","vazquez montalban","vázquez montalbán","benjamin black","raymond chandler","dashiell hammett","james ellroy","henning","jo nesbo","jo nesbø","patricia highsmith","novela negra","policial","maigret","agatha christie","hercule poirot","comisario","detective"];
const neg=ls.filter(l=>{const h=norm(`${l.book?.title} ${l.book?.author}`);const tag=(l.book?.tags||[]).some(t=>/negra|policial|suspenso/i.test(t));return tag||NEG.some(n=>h.includes(norm(n)));}).length;
console.log("Megan Maxwell:",mx,"| Novela negra/policial:",neg);
