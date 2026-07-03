import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:u}=await s.from("users").select("full_name,on_vacation,vacation_message").eq("username","buhardilla").maybeSingle();
const {count}=await s.from("listings").select("id",{count:"exact",head:true}).eq("seller_id",(await s.from("users").select("id").eq("username","buhardilla").maybeSingle()).data.id).eq("status","active");
console.log(`Buhardilla — ${u.full_name}: on_vacation=${u.on_vacation}, msg=${u.vacation_message??"null"}, ${count} listings activos`);
