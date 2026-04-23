import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const ordRes = await s.from('orders').select('id, status, total, book_price, shipping_cost, service_fee, created_at, buyer_id, bundle_id, seller_id').order('created_at', { ascending: false });
if (ordRes.error) { console.error('Orders error:', ordRes.error); process.exit(1); }
const orders = ordRes.data || [];
console.log('=== ORDERS ===');
console.log('Total:', orders.length);
const byStatus = {};
for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
console.log('By status:', byStatus);
console.log('\nDetalle:');
for (const o of orders) {
  console.log(`  ${o.created_at?.slice(0,10)}  ${o.status.padEnd(12)}  $${(o.total||0).toLocaleString('es-CL')}  book=$${(o.book_price||0).toLocaleString('es-CL')}  fee=$${(o.service_fee||0).toLocaleString('es-CL')}  ship=$${(o.shipping_cost||0).toLocaleString('es-CL')}  bundle=${o.bundle_id?.slice(0,8) || '-'}`);
}
const paid = orders.filter(o => ['paid','completed','shipped','delivered'].includes(o.status));
const gmv = paid.reduce((s,o) => s + (o.total||0), 0);
const grossBookRevenue = paid.reduce((s,o) => s + (o.book_price||0), 0);
const feesCollected = paid.reduce((s,o) => s + (o.service_fee||0), 0);
const shippingCollected = paid.reduce((s,o) => s + (o.shipping_cost||0), 0);
console.log('\nGross book revenue (sin envío/fee):', '$' + grossBookRevenue.toLocaleString('es-CL'));
console.log('Fees cobrados (comisión):', '$' + feesCollected.toLocaleString('es-CL'));
console.log('Shipping cobrado:', '$' + shippingCollected.toLocaleString('es-CL'));
console.log('\nGMV pagado:', '$' + gmv.toLocaleString('es-CL'));
console.log('Órdenes pagadas:', paid.length);
const uniqueBundles = new Set(paid.map(o => o.bundle_id).filter(Boolean));
console.log('Bundles pagados únicos:', uniqueBundles.size);
const uniqueBuyers = new Set(paid.map(o => o.buyer_id).filter(Boolean));
console.log('Compradores únicos pagados:', uniqueBuyers.size);
const uniqueSellers = new Set(paid.map(o => o.seller_id).filter(Boolean));
console.log('Vendedores con al menos 1 venta:', uniqueSellers.size);

const { data: users } = await s.from('users').select('id, email, username, created_at').order('created_at', { ascending: false });
console.log('\n=== USERS ===');
console.log('Total:', users.length);
console.log('Con username:', users.filter(u => u.username).length);

const { data: listings } = await s.from('listings').select('seller_id, status, price');
const activeListings = listings.filter(l => l.status === 'active');
const bySeller = {};
for (const l of activeListings) bySeller[l.seller_id] = (bySeller[l.seller_id] || 0) + 1;
console.log('\n=== LISTINGS ===');
console.log('Activos:', activeListings.length);
console.log('Vendedores con listings activos:', Object.keys(bySeller).length);
const sellerCounts = Object.values(bySeller).sort((a,b) => b-a);
console.log('Distribución (top 5):', sellerCounts.slice(0, 5));
const avgPrice = activeListings.reduce((s, l) => s + (l.price||0), 0) / activeListings.length;
console.log('Precio promedio listing activo:', '$' + Math.round(avgPrice).toLocaleString('es-CL'));
const totalInventoryValue = activeListings.reduce((s, l) => s + (l.price||0), 0);
console.log('Valor total inventario catálogo:', '$' + totalInventoryValue.toLocaleString('es-CL'));

const { data: books } = await s.from('books').select('id, is_collectible');
console.log('\n=== BOOKS ===');
console.log('Total:', books.length);
console.log('Coleccionables:', books.filter(b => b.is_collectible).length);

const { data: signups30d } = await s.from('users').select('id, created_at').gte('created_at', new Date(Date.now() - 30*864e5).toISOString());
console.log('\n=== CRECIMIENTO 30d ===');
console.log('Nuevos usuarios 30d:', signups30d.length);

const weekly = {};
for (const u of users) {
  const week = u.created_at?.slice(0, 10);
  if (!week) continue;
  weekly[week] = (weekly[week] || 0) + 1;
}
console.log('\nSignups por día:');
const sortedDays = Object.entries(weekly).sort((a,b) => a[0].localeCompare(b[0]));
for (const [day, count] of sortedDays) console.log(`  ${day}: ${count}`);
