import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data}=await s.from("users").select("username,full_name,on_vacation,vacation_message").eq("on_vacation",true);
console.log(`En modo vacaciones: ${data?.length??0}`);
for(const u of data??[]) console.log(`  @${u.username} — ${u.full_name} · msg: ${u.vacation_message??"—"}`);
