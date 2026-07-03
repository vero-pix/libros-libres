import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data}=await s.from("books").select("title,author,category").or("title.ilike.%rorschach%,title.ilike.%psicolog%,title.ilike.%psicológ%,author.ilike.%rorschach%");
console.log(`Coincidencias psicología/rorschach: ${data?.length??0}`);
for(const b of data??[]) console.log(`  [${b.category??"NULL"}] "${b.title}" — ${b.author}`);
