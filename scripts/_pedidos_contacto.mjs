import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:reqs}=await s.from("book_requests").select("title,author,requester_email,requester_whatsapp,requester_name,user_id,created_at").eq("fulfilled",false).order("created_at",{ascending:false});
let conEmail=0,conWa=0,conUser=0,sinNada=0;
console.log("PEDIDOS ABIERTOS y su contacto:\n");
for(const r of (reqs??[])){
  const e=!!r.requester_email,w=!!r.requester_whatsapp,u=!!r.user_id;
  if(e)conEmail++; if(w)conWa++; if(u)conUser++; if(!e&&!w&&!u)sinNada++;
  console.log(`  "${r.title}" ${r.created_at?.slice(0,10)} | email:${e?"✅":"—"} wa:${w?"✅":"—"} userLogueado:${u?"✅":"—"}`);
}
console.log(`\n═══ de ${reqs?.length} pedidos abiertos ═══`);
console.log(`  con email: ${conEmail} | con whatsapp: ${conWa} | usuario logueado (rastreable): ${conUser}`);
console.log(`  SIN NINGÚN contacto (imposible avisar): ${sinNada}`);
