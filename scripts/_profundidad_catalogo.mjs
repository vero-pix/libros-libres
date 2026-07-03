import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
// listings activos con book
let ls=[],from=0;
while(true){const {data}=await s.from("listings").select("book:books(author,category,subcategory,tags)").eq("status","active").range(from,from+999);if(!data||!data.length)break;ls.push(...data);if(data.length<1000)break;from+=1000;}
const norm=(x)=>(x||"").trim();
const byAuthor={},byCat={},bySub={},byTag={};
for(const l of ls){const b=l.book;if(!b)continue;
  if(b.author){const a=norm(b.author);byAuthor[a]=(byAuthor[a]||0)+1;}
  if(b.category)byCat[b.category]=(byCat[b.category]||0)+1;
  if(b.subcategory)bySub[b.subcategory]=(bySub[b.subcategory]||0)+1;
  for(const t of (b.tags||[]))byTag[t]=(byTag[t]||0)+1;
}
const top=(o,n=15)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>`${v}× ${k}`);
console.log("TOP AUTORES (profundidad):\n  "+top(byAuthor,18).join("\n  "));
console.log("\nTOP SUBCATEGORÍAS:\n  "+top(bySub,12).join("\n  "));
console.log("\nTOP TAGS:\n  "+top(byTag,18).join("\n  "));
