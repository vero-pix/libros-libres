import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

// Traer todos los listings activos con su libro y vendedor
const { data: ls } = await sb.from('listings')
  .select('id, status, book:books(id, title, author, description), seller:users(full_name, username)')
  .eq('status','active');

const PATTERNS = {
  nazi: /\b(nazi|nazis|nazismo|mein kampf|hitler|tercer reich|3er reich|f[üu]hrer|gestapo|wehrmacht|waffen|sv?ásti|esv[áa]sti|swastika|nacional ?socialis|goebbels|himmler|h[eé]rmann g[öo]ring|auschwitz|arios?|raza aria|ss nazi)\b/i,
  pinochet: /\b(pinochet|augusto pinochet|junta militar|d[ií]na\b|caravana de la muerte|r[ée]gimen militar|gobierno militar 1973|11 de septiembre de 1973)\b/i,
  disruptivo: /\b(kamasutra|kama ?sutra|mein kampf|sat[áa]nic|anarquista bomba|c[óo]mo fabricar|manifiesto fascista|supremac[íi]a blanca|ku klux)\b/i,
};

const hits = [];
for (const l of ls) {
  if (!l.book) continue;
  const blob = `${l.book.title||''} || ${l.book.author||''} || ${l.book.description||''}`;
  const tags = [];
  for (const [k, re] of Object.entries(PATTERNS)) if (re.test(blob)) tags.push(k);
  if (tags.length) hits.push({ tags, title: l.book.title, author: l.book.author, seller: l.seller?.full_name, lid: l.id, bid: l.book.id });
}
console.log(`=== ${hits.length} coincidencias sobre ${ls.length} listings activos ===\n`);
for (const h of hits) {
  console.log(`[${h.tags.join(',')}] "${(h.title||'').slice(0,55)}" — ${h.author||'s/a'}`);
  console.log(`    vendedor: ${h.seller} · listing ${h.lid.slice(0,8)}`);
}
