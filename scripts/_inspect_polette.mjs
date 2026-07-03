import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:u}=await s.from("users").select("*").eq("email","poletteatenas@gmail.com").single();
console.log("=== POLETTE ===");
console.log("id:",u.id,"| @",u.username,"| ciudad:",u.city,"| comuna(default):",u.default_address);
console.log("MP token:",u.mercadopago_access_token?"SÍ ✅":"NO ❌","| featured:",u.featured,"| plan:",u.plan,"| phone:",u.phone??"—","| instagram:",u.instagram??"—");
const {data:ls}=await s.from("listings").select("id,price,original_price,status,cover_image_url,city_id,book:books(title,author,category,subcategory,tags,cover_url)").eq("seller_id",u.id).order("created_at",{ascending:false});
console.log(`\n=== ${ls.length} LIBROS ===`);
for(const l of ls){
  const b=l.book;
  console.log(`• "${b?.title}" — ${b?.author??"s/a"}`);
  console.log(`    $${l.price} | cat:${b?.category??"❌null"}/${b?.subcategory??"—"} | tags:${(b?.tags??[]).length} | foto:${l.cover_image_url||b?.cover_url?"sí":"❌NO"} | status:${l.status}`);
}
