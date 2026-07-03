import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: ls } = await sb.from('listings')
  .select('id, featured, featured_rank, book:books(title, author), seller:users(full_name)')
  .eq('status','active');
const PAT = {
  nazi: /\b(nazi|nazismo|mein kampf|hitler|tercer reich|f[üu]hrer|gestapo|waffen|esv[áa]sti|swastika|nacional ?socialis|goebbels|himmler|auschwitz)\b/i,
  pinochet: /\b(pinochet|junta militar|r[ée]gimen militar|11 de septiembre de 1973|merino)\b/i,
  disruptivo: /\b(kamasutra|kama ?sutra|sat[áa]nic|supremac[íi]a blanca|ku klux)\b/i,
};
const hits=[];
for(const l of ls){ if(!l.book)continue; const b=`${l.book.title} ${l.book.author||''} `; const t=[]; for(const[k,r]of Object.entries(PAT))if(r.test(b))t.push(k); if(t.length)hits.push({...l,t}); }
const feat = hits.filter(h=>h.featured);
console.log(`=== ${feat.length} de ${hits.length} coincidencias están DESTACADAS (featured=true) ===\n`);
for(const h of feat) console.log(`⭐ rank ${h.featured_rank ?? '-'} [${h.t.join(',')}] "${h.book.title.slice(0,50)}" — ${h.book.author||'s/a'} · ${h.seller?.full_name}`);
if(!feat.length) console.log('(ninguno está destacado actualmente)');
