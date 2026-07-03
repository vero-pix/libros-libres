import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
// libros de apología por título+autor exactos detectados antes
const NEEDLES = [
  {t:'Mein kampf', a:'Hitler'},
  {t:'El día decisivo', a:'Pinochet'},
  {t:'Política, politiquería', a:'Pinochet'},
  {t:'Pack 2 Libros', a:'Pinochet'},
  {t:'Memoria De Gobierno 1973-1990', a:'Pinochet'},
  {t:'Bitácora De Un Almirante', a:'Merino'},
];
const { data: ls } = await sb.from('listings').select('id, deprioritized, featured, book:books(title, author)').eq('status','active');
let done=0;
for(const l of ls){
  if(!l.book) continue;
  const blob=`${l.book.title} ${l.book.author||''}`.toLowerCase();
  const match=NEEDLES.find(n=>blob.includes(n.t.toLowerCase())&&blob.includes(n.a.toLowerCase()));
  if(!match) continue;
  const { error }=await sb.from('listings').update({ deprioritized: true, featured: false }).eq('id', l.id);
  console.log((error?'❌ ':'✅ ')+`"${l.book.title.slice(0,42)}" — ${l.book.author} (antes deprioritized=${l.deprioritized})`);
  if(!error) done++;
}
console.log(`\n${done} libros de apología marcados deprioritized=true (siguen vendibles, fuera de promoción)`);
