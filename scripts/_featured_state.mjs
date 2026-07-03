import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const { count: total } = await sb.from('listings').select('*',{count:'exact',head:true}).eq('status','active');
const { count: feat } = await sb.from('listings').select('*',{count:'exact',head:true}).eq('status','active').eq('featured',true);
console.log('Listings activos:', total, '| featured=true:', feat);
// cuántos tienen 0 page_views (enterrados)
const { data: pv } = await sb.from('page_views').select('listing_id').not('listing_id','is',null);
const seen = new Set(pv.map(p=>p.listing_id));
const { data: act } = await sb.from('listings').select('id').eq('status','active');
const buried = act.filter(l=>!seen.has(l.id)).length;
console.log('Activos sin NINGUNA page_view registrada:', buried, 'de', act.length);
