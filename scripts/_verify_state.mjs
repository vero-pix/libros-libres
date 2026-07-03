import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:u}=await s.from("users").select("username,full_name,featured").in("username",["lorena.cortes","nicolas"]);
console.log("featured:",u);
const {data:lorena}=await s.from("users").select("id").eq("username","lorena.cortes").maybeSingle();
const {data:ls}=await s.from("listings").select("book:books(category)").eq("seller_id",lorena.id);
const c={}; for(const l of ls)c[l.book?.category??"NULL"]=(c[l.book?.category??"NULL"]??0)+1;
console.log("Categorías de Lorena:",c);
