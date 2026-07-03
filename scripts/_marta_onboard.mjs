import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: u } = await sb.from('users').select('id').ilike('full_name','%yllades%').single();
const id = u.id;

// 1. featured + city
const { error: e1 } = await sb.from('users').update({ featured: true, city: 'Las Condes' }).eq('id', id);
console.log('1. featured=true + city=Las Condes →', e1 ? 'ERROR '+e1.message : 'OK');

// 2. categorizar NULL/otros
const FICCION = ['pijama de rayas','renglones torcidos','balsa de piedra'];
const ACADEMICO = ['tópicos de matemáticas','auditoría administrativa','taller de redacción','introducción a la economía política','economía mexicana más allá','atenea'];
function classify(t){
  const x = t.toLowerCase();
  if (FICCION.some(k=>x.includes(k))) return 'ficcion';
  if (ACADEMICO.some(k=>x.includes(k))) return 'academico';
  return 'no-ficcion';
}
const { data: ls } = await sb.from('listings').select('book:books(id, title, category)').eq('seller_id', id).eq('status','active');
const toFix = ls.filter(l => !l.book?.category || l.book.category==='otros').map(l=>l.book);
let counts={};
for (const b of toFix){
  const cat = classify(b.title);
  const { error } = await sb.from('books').update({ category: cat }).eq('id', b.id);
  if (error) { console.log('  ERR', b.title, error.message); continue; }
  counts[cat]=(counts[cat]||0)+1;
}
console.log('2. categorizados', toFix.length, 'libros →', JSON.stringify(counts));

// 3. verificación final
const { data: ver } = await sb.from('listings').select('book:books(category)').eq('seller_id', id).eq('status','active');
const final={}; for(const l of ver){const c=l.book?.category??'NULL';final[c]=(final[c]||0)+1;}
console.log('3. estado final categorías:', JSON.stringify(final));
