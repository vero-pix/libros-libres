import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const VERO="2201d163-4423-4971-91f0-f6cebd00d1bd";
const {data,count}=await s.from("listings").select("status",{count:"exact"}).eq("seller_id",VERO);
const by={};
for(const r of (data??[])) by[r.status]=(by[r.status]||0)+1;
console.log("Total listings de vero:",count,"| por status:",JSON.stringify(by));
