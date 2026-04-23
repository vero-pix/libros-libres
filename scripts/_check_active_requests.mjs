import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await sb
  .from('book_requests')
  .select('id, title, author, requester_location, created_at, fulfilled')
  .eq('fulfilled', false)
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error(error);
  process.exit(1);
}
console.log('Solicitudes activas:', data.length);
data.forEach((r, i) =>
  console.log(`${i + 1}. "${r.title}" — ${r.author || '?'} · ${r.requester_location || 'sin ubicación'}`)
);
