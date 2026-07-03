import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: u } = await sb.from('users').select('id, default_address, city').ilike('full_name', '%yllades%');
const id = u[0].id;
console.log('default_address:', JSON.stringify(u[0].default_address));
console.log('city:', u[0].city);
const { data: ls } = await sb.from('listings').select('id, book_id, book:books(id, title, author, category, subcategory)').eq('seller_id', id).eq('status','active');
const toFix = ls.filter(l => !l.book?.category || l.book?.category==='otros' || l.book?.category==='NULL');
console.log(`\n=== ${toFix.length} libros a categorizar (NULL/otros) ===`);
toFix.forEach(l => console.log(`[${l.book.category??'NULL'}] ${l.book.title} — ${l.book.author||'s/a'}  (book:${l.book.id.slice(0,8)})`));
