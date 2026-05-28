import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trimStart().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      // .trim() + quitar comillas envolventes (.env.local suele traer KEY="valor")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const now = Date.now();
const d = (days) => new Date(now - days * 864e5).toISOString();

// Supabase corta en 1000 filas por query → paginar para no sub-reportar.
async function fetchAll(table, select, sinceIso) {
  const all = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    let q = supa.from(table).select(select).order('created_at', { ascending: true }).range(from, from + PAGE - 1);
    if (sinceIso) q = q.gte('created_at', sinceIso);
    const { data, error } = await q;
    if (error) { console.error(`fetch ${table} error:`, error.message); break; }
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

// === VISITAS (page_views) — paginado ===
const pv30 = await fetchAll('page_views', 'session_id, created_at, path, user_id', d(30));
const pv7 = await fetchAll('page_views', 'session_id, created_at, path, user_id', d(7));
const pv1 = await fetchAll('page_views', 'session_id, created_at, path, user_id', d(1));

const uniq = (arr) => new Set(arr.map(v => v.session_id).filter(Boolean)).size;
const topPaths = (arr) => {
  const m = {};
  for (const v of arr) m[v.path] = (m[v.path] || 0) + 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10);
};

console.log('=== VISITANTES ===');
console.log(`últimas 24h:  ${pv1.length} views / ${uniq(pv1)} sessions únicas`);
console.log(`últimos 7d:   ${pv7.length} views / ${uniq(pv7)} sessions únicas`);
console.log(`últimos 30d:  ${pv30.length} views / ${uniq(pv30)} sessions únicas`);
console.log('\n→ top 10 paths (30d):');
for (const [p, n] of topPaths(pv30)) console.log(`  ${n.toString().padStart(4)}  ${p}`);

// === USUARIOS ===
const { count: totalUsers } = await supa.from('users').select('id', { count: 'exact', head: true });
const { data: recentUsers } = await supa.from('users').select('id, full_name, email, created_at').gte('created_at', d(30)).order('created_at', { ascending: false });
console.log(`\n=== USUARIOS ===`);
console.log(`total: ${totalUsers}  |  registrados 30d: ${recentUsers?.length ?? 0}`);

// === ORDERS ===
const { data: orders, error: ordersErr } = await supa.from('orders').select('id, status, total, buyer_id, created_at, listing_id').order('created_at', { ascending: false });
if (ordersErr) console.error('orders error:', ordersErr.message);
const byStatus = {};
for (const o of orders ?? []) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
console.log(`\n=== ORDERS ===`);
console.log(`total: ${orders?.length ?? 0}`);
for (const [s, n] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) console.log(`  ${s.padEnd(14)} ${n}`);

const pending = (orders ?? []).filter(o => ['pending', 'pending_payment', 'awaiting_payment'].includes(o.status));
if (pending.length) {
  console.log(`\n→ ${pending.length} orders pendientes de pago:`);
  for (const o of pending.slice(0, 10)) {
    const age = Math.round((now - new Date(o.created_at).getTime()) / 3600e3);
    console.log(`  ${o.id.slice(0, 8)}  $${o.total}  hace ${age}h`);
  }
}

// === CARRITOS ABANDONADOS ===
const { data: carts } = await supa.from('cart_items').select('id, added_at, user_id, listing_id, listing:listings(price, book:books(title)), user:users(full_name, email)').order('added_at', { ascending: false });
console.log(`\n=== CARRITO ===`);
console.log(`items activos: ${carts?.length ?? 0}`);
const uniqBuyers = new Set((carts ?? []).map(c => c.user_id)).size;
const totalValue = (carts ?? []).reduce((s, c) => s + (c.listing?.price ?? 0), 0);
console.log(`usuarios únicos: ${uniqBuyers}  |  valor total: $${totalValue.toLocaleString('es-CL')}`);

if (carts?.length) {
  console.log('\n→ carritos más antiguos (posibles abandonos):');
  const sorted = [...carts].sort((a, b) => new Date(a.added_at) - new Date(b.added_at));
  for (const c of sorted.slice(0, 10)) {
    const age = Math.round((now - new Date(c.added_at).getTime()) / 3600e3);
    const name = c.user?.full_name ?? c.user?.email ?? '?';
    const title = c.listing?.book?.title ?? '?';
    console.log(`  hace ${age.toString().padStart(4)}h  ${name.padEnd(25).slice(0, 25)}  $${(c.listing?.price ?? 0).toString().padStart(6)}  ${title.slice(0, 40)}`);
  }
}

// === LISTINGS ===
const { data: listings } = await supa.from('listings').select('status');
const byListingStatus = {};
for (const l of listings ?? []) byListingStatus[l.status] = (byListingStatus[l.status] || 0) + 1;
console.log(`\n=== LISTINGS ===`);
for (const [s, n] of Object.entries(byListingStatus).sort((a, b) => b[1] - a[1])) console.log(`  ${s.padEnd(14)} ${n}`);

// === FUNNEL SIMPLE ===
const sessionsWithUser30 = new Set((pv30 ?? []).filter(v => v.user_id).map(v => v.session_id)).size;
const sessions30 = uniq(pv30);
const buyers30 = new Set((orders ?? []).filter(o => new Date(o.created_at) > new Date(d(30))).map(o => o.buyer_id)).size;
console.log(`\n=== FUNNEL 30d ===`);
console.log(`sessions:              ${sessions30}`);
console.log(`sessions con login:    ${sessionsWithUser30}  (${((sessionsWithUser30 / sessions30) * 100).toFixed(1)}%)`);
console.log(`compradores únicos:    ${buyers30}  (${((buyers30 / sessions30) * 100).toFixed(2)}%)`);
