import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const day=864e5, now=Date.now();
const older=new Date(now-3*day).toISOString(), newer=new Date(now-2*day).toISOString();
const {data:users}=await s.from("users")
  .select("id,email,full_name,created_at,mercadopago_access_token,mercadopago_user_id,on_vacation")
  .gte("created_at",older).lt("created_at",newer)
  .is("mercadopago_access_token",null).is("mercadopago_user_id",null)
  .or("on_vacation.is.null,on_vacation.eq.false");
console.log(`Ventana 48-72h (${older.slice(0,16)} → ${newer.slice(0,16)} UTC)`);
console.log(`Candidatos sin MP: ${users?.length??0}`);
for(const u of users??[]){
  const {count}=await s.from("listings").select("id",{count:"exact",head:true}).eq("seller_id",u.id).eq("status","active");
  console.log(`  ${count?"📧":"⏭️ "} ${u.full_name} · ${u.email} · ${count} libros activos · reg ${new Date(u.created_at).toLocaleString("es-CL")}`);
}
