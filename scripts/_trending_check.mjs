import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local","utf-8");
for (const l of env.split("\n")){ if(l.startsWith("#")||!l.includes("="))continue; const i=l.indexOf("="); const k=l.slice(0,i).trim(); if(!process.env[k])process.env[k]=l.slice(i+1).trim(); }
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await s.from("listings")
  .select("trending_score, created_at, book:books(title, author)")
  .eq("seller_id","2201d163-4423-4971-91f0-f6cebd00d1bd").eq("status","active");
const rows = data??[];
const withTs = rows.filter(r=>r.trending_score!=null && r.trending_score>0);
console.log(`activos=${rows.length} | con trending_score>0=${withTs.length}`);
console.log("\nTOP 8 por trending_score:");
[...rows].sort((a,b)=>(b.trending_score??0)-(a.trending_score??0)).slice(0,8).forEach(r=>console.log(`  ${(r.trending_score??0).toFixed(1).padStart(7)}  ${r.book?.title}`));
console.log("\nLos 'pinochet/dictadura' y su score + fecha:");
rows.filter(r=>/pinochet|allende|dictadura|golpe|unidad popular/i.test(`${r.book?.title} ${r.book?.author}`))
  .forEach(r=>console.log(`  ts=${(r.trending_score??0).toFixed(1)}  ${r.created_at?.slice(0,10)}  ${r.book?.title}`));
