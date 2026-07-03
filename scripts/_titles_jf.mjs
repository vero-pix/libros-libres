import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
for(const un of ["fabian.ignacio.sagredo.saez","josefa.cerda"]){
  const {data:u}=await s.from("users").select("id,full_name").eq("username",un).maybeSingle();
  const {data:ls}=await s.from("listings").select("price,status,cover_image_url,book:books(title,author,category)").eq("seller_id",u.id).order("created_at",{ascending:false});
  console.log(`\n━━━ ${u.full_name} (${ls.length}) ━━━`);
  for(const l of ls) console.log(`  $${String(l.price).padStart(6)} ${l.status} cat=${l.book?.category??"NULL"} foto=${l.cover_image_url?"sí":"no"} — "${l.book?.title}" / ${l.book?.author??"?"}`);
}
