import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:b}=await s.from("books").select("id").ilike("title","%rorschach%").maybeSingle();
const {data:ls}=await s.from("listings").select("price,status,seller_id,created_at").eq("book_id",b.id);
for(const l of ls){
  const {data:u}=await s.from("users").select("full_name,username").eq("id",l.seller_id).maybeSingle();
  console.log(`  $${l.price} ${l.status} — ${u?.full_name} (@${u?.username}) · creado ${l.created_at}`);
}
