import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
// buscar el listing destacado de "De Balmaceda a Pinochet"
const { data: ls } = await sb.from('listings').select('id, featured, featured_rank, book:books!inner(title)').eq('status','active').eq('featured',true).ilike('book.title','%Balmaceda a Pinochet%');
if(!ls?.length){ console.log('no encontrado destacado'); process.exit(0); }
const t = ls[0];
const { error } = await sb.from('listings').update({ featured: false, featured_rank: null }).eq('id', t.id);
console.log(`"${t.book.title}" → featured ${t.featured}→false, rank ${t.featured_rank}→null`, error?'❌ '+error.message:'✅');
// reverificar
const { data: all } = await sb.from('listings').select('book:books(title, author)').eq('status','active').eq('featured', true);
const PAT=/\b(nazi|hitler|mein kampf|pinochet|junta militar|merino|kamasutra|auschwitz)\b/i;
const still = (all||[]).filter(l=>l.book && PAT.test(`${l.book.title} ${l.book.author||''}`));
console.log(`Sensibles aún destacados: ${still.length}`);
