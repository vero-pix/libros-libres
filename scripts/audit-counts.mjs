import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const now = Date.now();
const d = (days) => new Date(now - days * 864e5).toISOString();

// counts exactos
const tbl = async (name, filter = null) => {
  let q = supa.from(name).select('id', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  return error ? `ERR ${error.message}` : count;
};

console.log('=== COUNTS EXACTOS ===');
console.log(`page_views 1d:   ${await tbl('page_views', q => q.gte('created_at', d(1)))}`);
console.log(`page_views 7d:   ${await tbl('page_views', q => q.gte('created_at', d(7)))}`);
console.log(`page_views 30d:  ${await tbl('page_views', q => q.gte('created_at', d(30)))}`);
console.log(`page_views all:  ${await tbl('page_views')}`);
console.log(`users all:       ${await tbl('users')}`);
console.log(`orders all:      ${await tbl('orders')}`);
console.log(`cart_items all:  ${await tbl('cart_items')}`);
console.log(`listings all:    ${await tbl('listings')}`);
console.log(`reviews all:     ${await tbl('reviews')}`);
console.log(`messages all:    ${await tbl('messages')}`);

// sesiones únicas con distinct (paginado)
console.log('\n=== SESIONES (paginado real) ===');
for (const days of [1, 7, 30]) {
  const sessions = new Set();
  let from = 0;
  while (true) {
    const { data } = await supa.from('page_views').select('session_id').gte('created_at', d(days)).range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const v of data) if (v.session_id) sessions.add(v.session_id);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`${days}d: ${sessions.size} sessions únicas`);
}

// listings rotos (sin book asociado)
const { data: orphan } = await supa.from('listings').select('id, book_id').is('book_id', null);
console.log(`\n=== INTEGRIDAD ===`);
console.log(`listings sin book_id: ${orphan?.length ?? 0}`);

const { data: listingsNoSeller } = await supa.from('listings').select('id').is('seller_id', null);
console.log(`listings sin seller_id: ${listingsNoSeller?.length ?? 0}`);

// Usuarios con username null (URLs caen a /listings/)
const { count: usersNoUser } = await supa.from('users').select('id', { count: 'exact', head: true }).is('username', null);
console.log(`users sin username: ${usersNoUser}`);

// Listings activos sin precio
const { data: listingsNoPrice } = await supa.from('listings').select('id').eq('status', 'active').is('price', null);
console.log(`listings activos sin precio: ${listingsNoPrice?.length ?? 0}`);

// Books sin cover_url y listings sin cover_image_url
const { data: listingsNoCover } = await supa.from('listings').select('id, book_id, cover_image_url, book:books(cover_url)').eq('status', 'active');
const noCover = (listingsNoCover ?? []).filter(l => !l.cover_image_url && !l.book?.cover_url);
console.log(`listings activos sin NINGUNA portada: ${noCover.length} de ${listingsNoCover?.length ?? 0}`);
