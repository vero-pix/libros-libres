import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const CFG=['tarde-de-lluvia','literatura-chilena','latinoamerica-contemp','historia-chile','clasicos','novela-negra','filosofia','ensayo','ciencia-divulgacion','para-regalar'];
const SEL=`*, book:books!inner(title), seller:users(id)`;
const raw=await Promise.all(CFG.map(t=>sb.from('listings').select(SEL).eq('status','active').neq('deprioritized',true).contains('book.tags',[t]).order('featured_rank',{ascending:true,nullsFirst:false}).limit(16).then(r=>({t,items:(r.data??[]).filter(l=>l.book)}))));
// ANTES (sin dedupe): contar repetidos
const allBefore={}; for(const c of raw) for(const l of c.items.slice(0,8)){allBefore[l.id]=(allBefore[l.id]||0)+1;}
const dupBefore=Object.values(allBefore).filter(n=>n>1).length;
// DESPUÉS (con dedupe)
const used=new Set(); const out=[];
for(const c of raw){const ls=[];for(const l of c.items){if(used.has(l.id)||ls.length>=8)continue;used.add(l.id);ls.push(l);}out.push({t:c.t,n:ls.length,titles:ls.map(x=>x.book.title)});}
const allAfter=[...used];
console.log('ANTES: libros que aparecían en ≥2 colecciones:', dupBefore);
console.log('DESPUÉS: total únicos:', allAfter.length, '| ¿algún repetido?', allAfter.length===new Set(allAfter).size?'✅ NO':'❌ SÍ');
console.log('\nColecciones (mostradas si ≥3):');
out.forEach(c=>console.log(`  ${c.n>=3?'✅':'⚠️ <3'} ${c.t}: ${c.n} libros`));
