import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const now=Date.now();
const {data}=await s.from("orders").select("status,created_at,total_amount").order("created_at",{ascending:false}).limit(200);
const win=(d)=>(data??[]).filter(o=>now-new Date(o.created_at).getTime()<d*864e5);
const paid=(arr)=>arr.filter(o=>!["pending","cancelled","expired","failed"].includes(o.status));
for(const d of [1,7,30]){const w=win(d);const p=paid(w);console.log(`últimos ${d}d: ${w.length} órdenes (${p.length} pagadas/enviadas) · status: ${[...new Set(w.map(o=>o.status))].join(", ")||"—"}`);}
console.log("\núltimas 5 órdenes:");
(data??[]).slice(0,5).forEach(o=>console.log(`  ${o.created_at?.slice(0,10)} · ${o.status} · $${o.total_amount??"?"}`));
