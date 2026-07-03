import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data}=await s.from("books").select("category,subcategory").limit(5000);
const cat={},sub={};
for(const b of (data??[])){ if(b.category)cat[b.category]=(cat[b.category]||0)+1; if(b.subcategory)sub[b.subcategory]=(sub[b.subcategory]||0)+1; }
console.log("CATEGORÍAS:", Object.entries(cat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}(${v})`).join("  "));
console.log("\nSUBCATEGORÍAS:", Object.entries(sub).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}(${v})`).join("  "));
