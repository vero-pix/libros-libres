import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
// categorías válidas: distinct de books
const { data: cats } = await sb.from('books').select('category').not('category','is',null);
const set = {}; for(const c of cats) set[c.category]=(set[c.category]||0)+1;
console.log('Categorías en uso (con conteo):');
Object.entries(set).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${k}: ${v}`));
// vendedores destacados y sus ranks
const { data: f } = await sb.from('users').select('full_name, featured_rank').eq('featured', true).order('featured_rank',{ascending:true});
console.log('\nVendedores destacados actuales:');
f.forEach(x=>console.log(`  rank ${x.featured_rank}: ${x.full_name}`));
