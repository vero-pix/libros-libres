import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const DAYS = parseInt(process.argv[2] || '7', 10);
const since = new Date(Date.now() - DAYS * 864e5).toISOString();

console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  TOP BÚSQUEDAS — últimos ${DAYS} días`);
console.log(`══════════════════════════════════════════════════════════\n`);

const { data: all, error } = await s
  .from('search_queries')
  .select('normalized_query, query, results_count, created_at')
  .gte('created_at', since)
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

if (!all || all.length === 0) {
  console.log('Aún no hay búsquedas registradas en esta ventana.');
  console.log('Si acabas de aplicar la migración, los datos empiezan a entrar después de que alguien busque.\n');
  process.exit(0);
}

console.log(`Total búsquedas: ${all.length}\n`);

// Top queries (normalizadas)
const counts = {};
for (const r of all) {
  const key = r.normalized_query;
  if (!counts[key]) counts[key] = { count: 0, original: r.query, avgResults: 0, withResults: 0, without: 0 };
  counts[key].count += 1;
  counts[key].avgResults += r.results_count;
  if (r.results_count > 0) counts[key].withResults += 1;
  else counts[key].without += 1;
}

const sorted = Object.entries(counts)
  .map(([q, d]) => ({ q, ...d, avgResults: (d.avgResults / d.count).toFixed(1) }))
  .sort((a, b) => b.count - a.count);

console.log('📊 TOP 30 QUERIES:\n');
console.log('  #   veces   resultados   query');
console.log('  ─── ─────── ────────────  ───────────────────────────────────────');
sorted.slice(0, 30).forEach((r, i) => {
  const num = String(i + 1).padStart(3, ' ');
  const cnt = String(r.count).padStart(5, ' ');
  const avg = String(r.avgResults).padStart(5, ' ');
  const marker = r.without === r.count ? ' 🚫' : r.withResults === r.count ? '   ' : ' ⚠️ ';
  console.log(`  ${num}  ${cnt}  prom ${avg}${marker}  ${r.q}`);
});

console.log('\n🚫 = siempre 0 resultados · ⚠️ = a veces 0 resultados');

// Búsquedas sin resultados (gaps del catálogo)
const withoutResults = sorted.filter(r => r.without === r.count);
if (withoutResults.length > 0) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🎯 GAPS DEL CATÁLOGO — buscaron pero no encontraron nada`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log('Son oportunidades: publica libros que respondan a estos queries.\n');
  withoutResults.slice(0, 20).forEach((r, i) => {
    console.log(`  ${String(i + 1).padStart(2, ' ')}. [buscado ${r.count}x]  ${r.q}`);
  });
}

console.log('');
