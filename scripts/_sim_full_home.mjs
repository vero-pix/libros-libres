import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const SEL=`*, book:books!inner(title, tags), seller:users(id)`;
const SELL=`*, book:books(title), seller:users(id)`;
const sections={};
// featured: curados + descubrimientos
const {data:cur}=await sb.from('listings').select(SELL).eq('status','active').eq('featured',true).order('featured_rank',{ascending:true,nullsFirst:false}).limit(10);
const D=6;const{count}=await sb.from('listings').select('*',{count:'exact',head:true}).eq('status','active').eq('featured',false).neq('deprioritized',true);
const day=Math.floor(Date.now()/86400000);const off=(day*D)%count;
const{data:win}=await sb.from('listings').select(SELL).eq('status','active').eq('featured',false).neq('deprioritized',true).order('created_at',{ascending:true}).range(off,off+D*2-1);
const disc=(win??[]).filter(l=>l.book&&(l.cover_image_url||l.book?.cover_url)).slice(0,D);
const cseen=new Set((cur??[]).map(l=>l.id));
sections.featured=[...(cur??[]),...disc.filter(l=>!cseen.has(l.id))];
// recent
const since=new Date(Date.now()-7*864e5).toISOString();
const{data:rec}=await sb.from('listings').select(SELL).eq('status','active').neq('deprioritized',true).gte('created_at',since).order('created_at',{ascending:false}).limit(40);
sections.recent=(rec??[]).filter(l=>l.book).slice(0,20);
// collectible
const{data:col}=await sb.from('listings').select(SELL).eq('status','active').eq('is_collectible',true).limit(12);
sections.collectible=(col??[]).filter(l=>l.book);
// dedupe rows
const used=new Set();const dr=a=>a.filter(l=>used.has(l.id)?false:(used.add(l.id),true));
sections.featured=dr(sections.featured);sections.recent=dr(sections.recent);sections.collectible=dr(sections.collectible);
// collections
const CFG=['tarde-de-lluvia','literatura-chilena','latinoamerica-contemp','historia-chile','clasicos','novela-negra','filosofia','ensayo','ciencia-divulgacion','para-regalar'];
const raw=await Promise.all(CFG.map(t=>sb.from('listings').select(SEL).eq('status','active').neq('deprioritized',true).contains('book.tags',[t]).order('featured_rank',{ascending:true,nullsFirst:false}).limit(16).then(r=>({t,items:(r.data??[]).filter(l=>l.book)}))));
const cu=new Set();const colls=[];
for(const c of raw){const ls=[];for(const l of c.items){if(cu.has(l.id)||ls.length>=8)continue;cu.add(l.id);ls.push(l);}colls.push({t:c.t,ls:ls.filter(l=>!used.has(l.id))});}
colls.filter(c=>c.ls.length>=3).forEach(c=>sections['col:'+c.t]=c.ls);
// shownAbove
const above=new Set(used);colls.forEach(c=>c.ls.forEach(l=>above.has(l.id)||above.add(l.id)));
// grid p1
const ex=Array.from(above);
let q=sb.from('listings').select(SELL,{count:'exact'}).in('status',['active','completed']).neq('deprioritized',true).order('created_at',{ascending:false});
if(ex.length)q=q.not('id','in',`(${ex.join(',')})`);
const{data:grid}=await q.range(0,19);
sections.grid=grid??[];
// CHECK global
const seen=new Map();let dups=[];
for(const[name,arr]of Object.entries(sections)){for(const l of arr){if(seen.has(l.id))dups.push(`${l.book?.title?.slice(0,30)} en [${seen.get(l.id)}] y [${name}]`);else seen.set(l.id,name);}}
console.log('Secciones y conteos:');
for(const[n,a]of Object.entries(sections))console.log(`  ${n}: ${a.length}`);
console.log('\nGrilla página 1:', sections.grid.length, '(esperado 20)');
console.log('Total libros en portada:', seen.size);
console.log('REPETIDOS:', dups.length===0?'✅ NINGUNO':'❌ '+dups.length);
dups.slice(0,10).forEach(d=>console.log('  -',d));
