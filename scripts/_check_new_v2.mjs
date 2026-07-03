import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
for(const un of ["lorena.cortes","nicolas"]){
  const {data:u}=await s.from("users").select("full_name,featured,city,mercadopago_access_token,mercadopago_connected_at").eq("username",un).maybeSingle();
  console.log(`@${un}: featured=${u.featured} · MP=${u.mercadopago_access_token?"✅ conectado "+(u.mercadopago_connected_at??""):"❌ no"} · ciudad=${u.city??"—"}`);
}
// Probar un write para ver el error real
const {error}=await s.from("users").update({featured:true}).eq("username","nicolas");
console.log(`\nTEST update featured nicolas → ${error?"❌ "+JSON.stringify(error):"✅ sin error"}`);
const {data:after}=await s.from("users").select("featured").eq("username","nicolas").maybeSingle();
console.log(`featured nicolas después del test: ${after.featured}`);
