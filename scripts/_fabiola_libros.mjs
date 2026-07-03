import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:u}=await s.from("users").select("id").eq("email","flor.rego8@protonmail.com").single();
const {data:ls}=await s.from("listings").select("price,cover_image_url,book:books(title,author,category)").eq("seller_id",u.id);
for(const l of (ls??[])) console.log(`• "${l.book?.title}" — ${l.book?.author??"s/a"} | $${l.price} | cat:${l.book?.category??"❌null"} | foto:${l.cover_image_url?"sí":"no"}`);
