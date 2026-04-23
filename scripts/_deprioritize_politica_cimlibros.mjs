import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const APPLY = process.argv.includes('--apply');

// 1) Identificar seller_id de CIMLibros
const { data: users } = await s.from('users').select('id, username, email, full_name').or('username.ilike.%cim%,email.ilike.%cim%,full_name.ilike.%cim%');
console.log('Candidatos CIMLibros:');
for (const u of users || []) console.log(`  ${u.id}  @${u.username || '-'}  ${u.full_name || ''}  ${u.email || ''}`);
const cim = users?.find(u => /cim/i.test(u.username || u.email || u.full_name || ''));
console.log(`\n→ CIMLibros seller_id: ${cim?.id || 'NO ENCONTRADO'}\n`);

// 2) Palabras clave de política a deprioritizar
const POLITICAL_KEYWORDS = [
  'allende', 'pinochet', 'unidad popular', 'dictadura',
  'fidel castro', 'stalin', 'hitler', 'mein kampf',
  'golpe de estado', '11 de septiembre', 'jaime guzmán',
  'frei montalva', 'patricio aylwin', 'bachelet',
  'piñera', 'lagos', 'evo morales', 'lula', 'maduro',
  'comunismo', 'socialismo', 'marxismo', 'capital marx',
  'fascismo', 'nazi', 'militar chile',
];

// 3) Listings a deprioritizar
const { data: allListings } = await s
  .from('listings')
  .select('id, seller_id, deprioritized, book:books(title, author)')
  .eq('status', 'active');

const toDeprioritize = [];
const alreadyDep = [];

for (const l of allListings || []) {
  if (l.deprioritized) {
    alreadyDep.push(l);
    continue;
  }
  const byCim = cim && l.seller_id === cim.id;
  const title = (l.book?.title || '').toLowerCase();
  const author = (l.book?.author || '').toLowerCase();
  // Word-boundary match para evitar falsos positivos (ej. "lula" dentro de "células")
  const matchesKeyword = (text, keyword) => {
    const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(text);
  };
  const byKeyword = POLITICAL_KEYWORDS.some(k => matchesKeyword(title, k) || matchesKeyword(author, k));
  if (byCim || byKeyword) {
    toDeprioritize.push({ ...l, reason: byCim ? 'CIMLibros' : 'política' });
  }
}

console.log(`=== A DEPRIORITIZAR (${toDeprioritize.length}) ===`);
for (const l of toDeprioritize) {
  console.log(`  [${l.reason.padEnd(10)}] ${l.book?.title?.slice(0, 60) || '(sin título)'} — ${l.book?.author?.slice(0, 30) || ''}`);
}

console.log(`\n=== YA ESTABAN DEPRIORITIZADOS (${alreadyDep.length}) ===`);
for (const l of alreadyDep.slice(0, 10)) {
  console.log(`  ${l.book?.title?.slice(0, 60) || '(sin título)'}`);
}

if (!APPLY) {
  console.log('\n⚠️  DRY RUN. Para aplicar, correr con: node scripts/_deprioritize_politica_cimlibros.mjs --apply');
  process.exit(0);
}

if (toDeprioritize.length === 0) {
  console.log('\nNada que hacer.');
  process.exit(0);
}

const ids = toDeprioritize.map(l => l.id);
const { error } = await s.from('listings').update({ deprioritized: true }).in('id', ids);
if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
console.log(`\n✓ ${ids.length} listings marcados como deprioritized.`);
