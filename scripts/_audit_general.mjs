import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trimStart().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const now = Date.now();
const d = (days) => new Date(now - days * 864e5).toISOString();
const clp = (n) => '$' + Math.round(n).toLocaleString('es-CL');

async function fetchAll(table, select, sinceIso, col = 'created_at') {
  const all = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    let q = supa.from(table).select(select).range(from, from + PAGE - 1);
    if (sinceIso) q = q.gte(col, sinceIso);
    const { data, error } = await q;
    if (error) { console.error(`  fetch ${table}:`, error.message); break; }
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return all;
}
const P = (t) => console.log(`\n━━━━━━ ${t} ━━━━━━`);

// ── LISTINGS / LIBROS VENDIDOS ──
P('LIBROS Y VENTAS (listings)');
const listings = await fetchAll('listings', 'id, status, price, seller_id, created_at, updated_at, book_id');
const byStatus = {};
for (const l of listings) byStatus[l.status ?? 'null'] = (byStatus[l.status ?? 'null'] ?? 0) + 1;
console.log(`  Total: ${listings.length} · por status: ${JSON.stringify(byStatus)}`);
const sold = listings.filter(l => (l.status ?? '').toLowerCase() === 'sold');
console.log(`  Marcados vendidos: ${sold.length} · valor listado ${clp(sold.reduce((s, l) => s + (l.price ?? 0), 0))}`);
const soldRecent = sold.filter(l => (l.updated_at ?? '') >= d(30)).sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
console.log(`  Vendidos (updated_at 30d): ${soldRecent.length}`);
// títulos vía books
const bookIds = [...new Set(soldRecent.map(l => l.book_id).filter(Boolean))].slice(0, 200);
const books = bookIds.length ? await supa.from('books').select('id, title').in('id', bookIds) : { data: [] };
const titleOf = Object.fromEntries((books.data ?? []).map(b => [b.id, b.title]));
soldRecent.slice(0, 20).forEach(l => console.log(`    ${(l.updated_at ?? '').slice(0, 10)} · ${clp(l.price ?? 0)} · ${(titleOf[l.book_id] ?? l.book_id ?? '').slice(0, 50)}`));

// ── ORDERS / PÉRDIDAS (off-platform vs MP) ──
P('ORDERS (30d) — pérdidas / off-platform');
const orders = await fetchAll('orders', 'id, status, total, book_price, service_fee, created_at, bundle_id, mercadopago_payment_id', d(30));
const oByStatus = {};
for (const o of orders) oByStatus[o.status ?? 'null'] = (oByStatus[o.status ?? 'null'] ?? 0) + 1;
console.log(`  Total orders 30d: ${orders.length} · por status: ${JSON.stringify(oByStatus)}`);
const paid = orders.filter(o => ['paid', 'approved', 'completed', 'shipped', 'delivered'].includes((o.status ?? '').toLowerCase()) || o.mercadopago_payment_id);
console.log(`  Pagadas/con MP payment: ${paid.length} · GMV ${clp(paid.reduce((s, o) => s + (o.total ?? 0), 0))} · fee recaudado ${clp(paid.reduce((s, o) => s + (o.service_fee ?? 0), 0))}`);
const stuck = orders.filter(o => !o.mercadopago_payment_id && (o.status ?? '').toLowerCase() === 'pending');
console.log(`  Pending sin MP payment (abandono/fuga): ${stuck.length}`);

// ── FLUJOS / SALIDAS (funnel) ──
P('FUNNEL / FLUJOS (7d)');
const pv7 = await fetchAll('page_views', 'session_id, path, created_at', d(7));
const sessions = new Set(pv7.map(v => v.session_id).filter(Boolean));
const perSession = {};
for (const v of pv7) perSession[v.session_id] = (perSession[v.session_id] ?? 0) + 1;
const bounced = Object.values(perSession).filter(n => n === 1).length;
console.log(`  ${pv7.length} vistas · ${sessions.size} sesiones · bounce ${sessions.size ? Math.round(bounced / sessions.size * 100) : 0}%`);
const fichaViews = pv7.filter(v => /^\/(libro|listings|vendedor)\//.test(v.path ?? '')).length;
const cartViews = pv7.filter(v => (v.path ?? '').startsWith('/carrito') || (v.path ?? '').startsWith('/cart')).length;
const checkoutViews = pv7.filter(v => (v.path ?? '').startsWith('/checkout')).length;
console.log(`  fichas: ${fichaViews} · carrito: ${cartViews} · checkout: ${checkoutViews}`);
// Salidas: última página por sesión
const lastPath = {};
for (const v of [...pv7].sort((a, b) => (a.created_at).localeCompare(b.created_at))) lastPath[v.session_id] = v.path;
const exitCounts = {};
for (const p of Object.values(lastPath)) { const k = (p ?? '/').split('?')[0]; exitCounts[k] = (exitCounts[k] ?? 0) + 1; }
console.log('  Top páginas de SALIDA (7d):');
Object.entries(exitCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([p, n]) => console.log(`    ${n}  ${p}`));

// ── CARRITOS ABANDONADOS ──
P('CARRITOS ABANDONADOS');
const cart = await fetchAll('cart_items', 'id, listing_id, user_id, added_at', d(30), 'added_at');
console.log(`  cart_items últimos 30d: ${cart.length} · usuarios distintos: ${new Set(cart.map(c => c.user_id)).size}`);

// ── INTENCIONES (solicitudes / economía inversa) ──
P('INTENCIONES / SOLICITUDES (book_requests)');
const reqs = await fetchAll('book_requests', 'id, title, fulfilled, fulfilled_at, created_at');
const req30 = reqs.filter(r => r.created_at >= d(30));
console.log(`  Total: ${reqs.length} · últimos 30d: ${req30.length} · cumplidas: ${reqs.filter(r => r.fulfilled).length}`);
reqs.filter(r => !r.fulfilled).sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).slice(0, 8)
  .forEach(r => console.log(`    ${(r.created_at ?? '').slice(0, 10)} · ${(r.title ?? '').slice(0, 50)}`));

// ── LIMPIEZAS (bots) ──
P('LIMPIEZAS');
const subs = await fetchAll('newsletter_subscribers', 'email, subscribed_at, unsubscribed_at');
const active = subs.filter(s => !s.unsubscribed_at);
const botLike = active.filter(s => /(\+|sms|otp|@qq\.|\.ru$|\.cn$|xn--|mailinator|guerrilla)/i.test(s.email ?? ''));
console.log(`  newsletter_subscribers: ${subs.length} (activos ${active.length}) · sospechosos bot: ${botLike.length}`);
const users = await fetchAll('users', 'id, username, mercadopago_access_token, city, created_at');
console.log(`  users: ${users.length} · con MP: ${users.filter(u => u.mercadopago_access_token).length} · sin username: ${users.filter(u => !u.username).length}`);

// ── SELLERS ACTIVOS ──
P('VENDEDORES');
const activeSellers = new Set(listings.filter(l => (l.status ?? '') === 'active').map(l => l.seller_id));
console.log(`  con ≥1 listing activo: ${activeSellers.size}`);
const recentSignups = users.filter(u => u.created_at >= d(14));
console.log(`  registros últimos 14d: ${recentSignups.length}`);

console.log('\n✅ auditoría lista');
