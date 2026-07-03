import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const since=new Date(Date.now()-3*864e5).toISOString(); // últimos 3 días para no perder a nadie
const {data:us}=await s.from("users").select("id,full_name,username,email,city,default_address,mercadopago_access_token,featured,created_at").gte("created_at",since).order("created_at",{ascending:false});
console.log(`=== REGISTROS últimos 3 días: ${us?.length} ===`);
for(const u of (us??[])){
  const {count}=await s.from("listings").select("*",{count:"exact",head:true}).eq("seller_id",u.id).eq("status","active");
  const ageH=Math.round((Date.now()-new Date(u.created_at).getTime())/36e5);
  console.log(`\n• ${u.full_name} (@${u.username}) ${u.email}`);
  console.log(`   registrado hace ${ageH}h | libros activos: ${count} | MP: ${u.mercadopago_access_token?"✅":"❌"} | featured: ${u.featured?"sí":"no"} | comuna: ${u.city??u.default_address?.split(",")[1]?.trim()??"—"}`);
}
