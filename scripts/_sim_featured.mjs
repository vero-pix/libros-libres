import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const SEL=`*, book:books(*), seller:users(id, username)`;
const { data: curated } = await sb.from('listings').select(SEL).eq('status','active').eq('featured',true).order('featured_rank',{ascending:true,nullsFirst:false}).limit(10);
const D=6;
const { count } = await sb.from('listings').select('*',{count:'exact',head:true}).eq('status','active').eq('featured',false);
const day=Math.floor(Date.now()/86400000); const offset=(day*D)%count;
const { data: win } = await sb.from('listings').select(SEL).eq('status','active').eq('featured',false).order('created_at',{ascending:true}).range(offset, offset+D*2-1);
const disc=(win??[]).filter(l=>l.book&&(l.cover_image_url||l.book.cover_url)).slice(0,D);
const seen=new Set((curated??[]).map(l=>l.id));
const merged=[...(curated??[]),...disc.filter(l=>!seen.has(l.id))];
console.log('curados:',curated.length,'| descubrimientos:',disc.length,'| total fila:',merged.length);
console.log('IDs únicos:', new Set(merged.map(l=>l.id)).size===merged.length ? '✅ sin duplicados' : '❌ HAY DUPLICADOS');
console.log('\nDescubrimientos de hoy (día '+day+', offset '+offset+'/'+count+'):');
disc.forEach(l=>console.log('  -', (l.book.title||'').slice(0,45), '· @'+(l.seller?.username||'?')));
