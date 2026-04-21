import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);

const sql = readFileSync('supabase/migrations/20260421_search_queries.sql', 'utf8');
console.log('Aplicando migración search_queries a Supabase...\n');

// Ejecuto via RPC con exec_sql si existe, o uso REST /rpc. Fallback: imprimir SQL para aplicar manual.
const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sql }),
});

if (!res.ok) {
  console.log('⚠️  No hay función RPC `exec_sql` en este proyecto (es común).');
  console.log('Aplica manualmente en el SQL Editor de Supabase:');
  console.log('https://supabase.com/dashboard/project/tfaqvnsdasaegkcahaal/sql/new\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(sql);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(0);
}

console.log('✓ Migración aplicada');
