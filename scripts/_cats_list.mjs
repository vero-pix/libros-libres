import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:cats}=await s.from("categories").select("slug,name").order("slug");
if(cats) for(const c of cats) console.log(`${c.slug} — ${c.name}`);
else {
  const {data:bs}=await s.from("books").select("category");
  const set={}; for(const b of bs) set[b.category??"NULL"]=(set[b.category??"NULL"]??0)+1;
  console.log(Object.entries(set).sort((a,b)=>b[1]-a[1]));
}
