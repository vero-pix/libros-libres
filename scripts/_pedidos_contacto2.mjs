import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:reqs}=await s.from("book_requests").select("title,requester_email,requester_whatsapp,requester_user_id,created_at").eq("fulfilled",false).order("created_at",{ascending:false});
let conEmail=0,conWa=0,conUser=0,sinNada=0;
for(const r of (reqs??[])){
  const e=!!r.requester_email,w=!!r.requester_whatsapp,u=!!r.requester_user_id;
  if(e)conEmail++; if(w)conWa++; if(u)conUser++; if(!e&&!w&&!u)sinNada++;
}
console.log(`De ${reqs?.length} pedidos abiertos:`);
console.log(`  con email: ${conEmail}`);
console.log(`  con whatsapp: ${conWa}`);
console.log(`  usuario logueado (rastreable por su cuenta): ${conUser}`);
console.log(`  contactables de algún modo: ${(reqs??[]).filter(r=>r.requester_email||r.requester_whatsapp||r.requester_user_id).length}`);
console.log(`  SIN NINGÚN contacto: ${sinNada}`);
// los recientes (jun) tienen contacto?
const jun=(reqs??[]).filter(r=>r.created_at>="2026-06-01");
console.log(`\nPedidos de junio: ${jun.length} | contactables: ${jun.filter(r=>r.requester_email||r.requester_whatsapp||r.requester_user_id).length}`);
