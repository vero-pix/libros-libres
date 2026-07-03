import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:lorena}=await s.from("users").select("id").eq("username","lorena.cortes").maybeSingle();
const {data:ls}=await s.from("listings").select("book:books(title,author,category)").eq("seller_id",lorena.id).order("created_at",{ascending:true});
console.log(`${ls.length} libros:\n`);
for(const l of ls){
  const b=l.book;
  console.log(`  [${(b?.category??"NULL").padEnd(10)}] "${(b?.title??"?").slice(0,45)}" — ${(b?.author??"?").slice(0,30)}`);
}
