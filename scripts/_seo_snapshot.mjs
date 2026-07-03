import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const now=Date.now(),day=864e5;
const iso=ms=>new Date(ms).toISOString();
const d7=iso(now-7*day), d30=iso(now-30*day), prev7=iso(now-14*day);

async function page(since,until){
  const rows=[]; const P=1000;
  for(let f=0;f<60000;f+=P){
    let q=s.from("page_views").select("session_id,path,referrer,created_at").gte("created_at",since).order("created_at",{ascending:false}).range(f,f+P-1);
    if(until) q=q.lt("created_at",until);
    const {data}=await q; if(!data||!data.length)break; rows.push(...data); if(data.length<P)break;
  }
  return rows;
}
const v7=await page(d7);
const vPrev=await page(prev7,d7);
const sess=r=>new Set(r.map(x=>x.session_id)).size;
const bounce=r=>{const m=new Map();for(const x of r)m.set(x.session_id,(m.get(x.session_id)??0)+1);const b=[...m.values()].filter(n=>n===1).length;const t=m.size;return t?Math.round(b/t*100):0;};
const {count:pv30}=await s.from("page_views").select("id",{count:"exact",head:true}).gte("created_at",d30);

console.log(`━━━ TRÁFICO (tracking propio) ━━━`);
console.log(`Vistas 7d:    ${v7.length}   (semana previa: ${vPrev.length}, ${v7.length>=vPrev.length?"▲":"▼"} ${Math.round((v7.length-vPrev.length)/Math.max(vPrev.length,1)*100)}%)`);
console.log(`Sesiones 7d:  ${sess(v7)}   (previa: ${sess(vPrev)})`);
console.log(`Vistas 30d:   ${pv30}`);
console.log(`Bounce 7d:    ${bounce(v7)}%   ·   ${(v7.length/Math.max(sess(v7),1)).toFixed(1)} pág/sesión`);

// Fuentes
const firstRef=new Map();
for(const r of [...v7].sort((a,b)=>a.created_at<b.created_at?-1:1)){
  if(!firstRef.has(r.session_id)){let ref=(r.referrer??"").replace(/^https?:\/\//,"").replace(/\/.*$/,"");if(!ref||ref.includes("tuslibros.cl"))ref="(directo/interno)";firstRef.set(r.session_id,ref);}
}
const rc={}; for(const v of firstRef.values())rc[v]=(rc[v]??0)+1;
console.log(`\n━━━ FUENTES 7d (por sesión) ━━━`);
for(const [k,n] of Object.entries(rc).sort((a,b)=>b[1]-a[1]).slice(0,8)) console.log(`  ${String(n).padStart(4)}  ${k}`);

// Top páginas
const pc={}; for(const r of v7){const p=(r.path??"/").split("?")[0];pc[p]=(pc[p]??0)+1;}
console.log(`\n━━━ TOP PÁGINAS 7d ━━━`);
for(const [k,n] of Object.entries(pc).sort((a,b)=>b[1]-a[1]).slice(0,12)) console.log(`  ${String(n).padStart(4)}  ${k}`);

// Landings SEO específicas
console.log(`\n━━━ LANDINGS SEO 7d ━━━`);
const seoPaths=Object.entries(pc).filter(([k])=>/vender-libros|comprar-libros|libros-usados/.test(k)).sort((a,b)=>b[1]-a[1]);
if(seoPaths.length) for(const [k,n] of seoPaths) console.log(`  ${String(n).padStart(4)}  ${k}`); else console.log("  (sin visitas a landings SEO esta semana)");

// Google orgánico
const g=Object.entries(rc).filter(([k])=>/google|bing|duckduckgo|search/i.test(k)).reduce((a,[,n])=>a+n,0);
console.log(`\nSesiones desde buscadores (7d): ${g}`);
