import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const since=new Date(Date.now()-12*864e5/24).toISOString(); // últimas 12h
const {data:us}=await s.from("users").select("id,full_name,username,email,created_at,city,mercadopago_access_token").gte("created_at",since).order("created_at",{ascending:false});
console.log(`=== REGISTROS últimas 12h: ${us?.length} ===\n`);
for(const u of (us??[])){
  const mins=Math.round((Date.now()-new Date(u.created_at).getTime())/6e4);
  // actividad: page_views
  const {count:pv}=await s.from("page_views").select("*",{count:"exact",head:true}).eq("user_id",u.id);
  const {count:lst}=await s.from("listings").select("*",{count:"exact",head:true}).eq("seller_id",u.id);
  // señal bot: email sospechoso
  const sospechoso=/[0-9]{4,}@|@(mail\.ru|qq\.com|yandex)/.test(u.email||"")||/^[a-z]{8,}$/.test(u.username||"");
  console.log(`${mins<60?mins+"min":Math.round(mins/60)+"h"} · ${u.full_name} · ${u.email} ${sospechoso?"⚠️BOT?":""}`);
  console.log(`     vistas:${pv} libros:${lst} ciudad:${u.city??"—"} MP:${u.mercadopago_access_token?"✅":"—"}`);
}
