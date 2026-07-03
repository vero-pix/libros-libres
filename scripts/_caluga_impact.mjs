import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:sample}=await s.from("page_views").select("*").limit(1);
console.log("Columnas page_views:", Object.keys(sample?.[0]??{}).join(", "));

// traer vistas recientes (últimos 5 días)
const since=new Date(Date.now()-5*864e5).toISOString();
const {data:pv}=await s.from("page_views").select("*").gte("created_at",since).order("created_at",{ascending:false}).limit(5000);
const rows=pv??[];
console.log(`\nVistas totales últimos 5 días: ${rows.length}`);
// detectar la columna de path
const pathKey=Object.keys(rows[0]||{}).find(k=>/path|url|page|route/i.test(k))||"path";
console.log("usando columna path:", pathKey);
const day=(d)=>d?.slice(0,10);
// vistas a /vendedor/vero por día
const vero=rows.filter(r=>String(r[pathKey]??"").includes("/vendedor/vero")||String(r[pathKey]??"").includes("vendedor/2201d163"));
const byDayVero={};
for(const r of vero){const dd=day(r.created_at);byDayVero[dd]=(byDayVero[dd]||0)+1;}
console.log("\n/vendedor/vero por día:", JSON.stringify(byDayVero));
// vistas a fichas de libros de vero (/libro/vero/...)
const fichasVero=rows.filter(r=>String(r[pathKey]??"").includes("/libro/vero/"));
const byDayFichas={};
for(const r of fichasVero){const dd=day(r.created_at);byDayFichas[dd]=(byDayFichas[dd]||0)+1;}
console.log("/libro/vero/* por día:", JSON.stringify(byDayFichas));
// total home por día (para contexto)
const home=rows.filter(r=>String(r[pathKey]??"")==="/"||String(r[pathKey]??"")==="");
const byDayHome={};
for(const r of home){const dd=day(r.created_at);byDayHome[dd]=(byDayHome[dd]||0)+1;}
console.log("home (/) por día:", JSON.stringify(byDayHome));
