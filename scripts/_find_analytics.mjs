import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
for(const t of ["listing_views","page_views","views","events","analytics","listing_events","product_views"]){
  const {error,count}=await s.from(t).select("*",{count:"exact",head:true});
  console.log(`  ${t}: ${error?"no existe":count+" filas"}`);
}
// trending_score: cuándo se actualizó por última vez para vero
const {data}=await s.from("listings").select("trending_score,updated_at").eq("seller_id","2201d163-4423-4971-91f0-f6cebd00d1bd").order("updated_at",{ascending:false}).limit(3);
console.log("\núltimos updated_at de listings de vero:", (data??[]).map(l=>l.updated_at?.slice(0,16)));
