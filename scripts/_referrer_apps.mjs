import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data}=await s.from("page_views").select("referrer").ilike("referrer","android-app%").gte("created_at",new Date(Date.now()-2*864e5).toISOString());
const freq={};
for(const r of (data??[])){const ref=r.referrer||"?";freq[ref]=(freq[ref]||0)+1;}
console.log("Referrers 'android-app' (últimos 2 días):");
for(const [k,v] of Object.entries(freq).sort((a,b)=>b[1]-a[1])) console.log(`  ${v}× ${k}`);
