import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: ls } = await s.from("listings").select("seller_id").eq("status","active");
const cnt={}; for(const l of ls) cnt[l.seller_id]=(cnt[l.seller_id]??0)+1;
const ids=Object.keys(cnt);
const { data: users, error } = await s.from("users")
  .select("id,full_name,email,username,city,featured,mercadopago_access_token,created_at")
  .in("id",ids);
if(error){console.log("ERROR:",error.message);process.exit(1);}
const now=Date.now();
const newNoMp = users.filter(u=> u.created_at && (now-new Date(u.created_at).getTime())<30*86400000 && !u.mercadopago_access_token);
for(const u of newNoMp.sort((a,b)=>cnt[b.id]-cnt[a.id])){
  console.log(`${String(cnt[u.id]).padStart(3)} libros · @${u.username??"—"} · ${u.full_name} · ${u.email} · ${u.city??"—"}/${u.comuna??"—"} · feat=${u.featured} · id ${u.id.slice(0,8)}`);
}
