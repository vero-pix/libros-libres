import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: u } = await sb.from('users').select('id, full_name, username, city, featured, mercadopago_access_token, created_at, email').ilike('full_name', '%yllades%');
console.log('=== USUARIA ===');
for (const x of u) console.log({ id: x.id.slice(0,8), name: x.full_name, user: x.username, city: x.city, featured: x.featured, mp: !!x.mercadopago_access_token, email: x.email });
if (!u?.length) { console.log('no encontrada'); process.exit(0); }
const id = u[0].id;
const { data: ls } = await sb.from('listings').select('id, status, book:books(title, category)').eq('seller_id', id);
const active = ls.filter(l => l.status === 'active');
console.log(`\n=== LISTINGS: ${ls.length} total, ${active.length} activos ===`);
const cats = {};
for (const l of active) { const c = l.book?.category ?? 'NULL'; cats[c] = (cats[c]||0)+1; }
console.log('Categorías:', cats);
console.log('\nMuestra de títulos:');
active.slice(0, 12).forEach(l => console.log('  -', (l.book?.title||'').slice(0,45), '·', l.book?.category ?? 'NULL'));
