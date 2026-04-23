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

// Libros de CIMLibros que NO son políticos — revertir a estado normal
// Criterio: historia general, filosofía, ciencia, literatura, autoayuda, esoterismo
const TITLES_TO_REVERT = [
  'Canción Valiente',
  'Magallanes En Su Primer Centenario',
  'Vivir O Morir',
  'Menéndez Rey De La Patagonia',
  'La Asertividad',
  'Sangre De Hermanos',
  'Lecciones De Ciencias Ocultas',
  'El 8° Hábito',
  'La Revolución Reflexiva',
  'El Reino De Araucanía Y Patagonia',
  'OVNIS Desde Chile',
  'Transformación En La Convivencia',
  'Relatos Históricos',
  'Lucila',
  'Ventura De Pedro De Valdivia',
  'Inés De Suárez La Condoresa',
  'Tiempos Modernos',
  'A Hombros De Gigantes',
  'El Misterio De La Virgen De Guadalupe',
  'Darwin En El País Desconocido',
];

// Libros que se QUEDAN deprioritized (política / militarismo / controversiales)
const POLITICAL_TITLES_KEEP = [
  'Soldados De Una Guerra Que No Fue',     // militar
  'Las Respuestas De Corbalán',            // represión DINA
  'Para Recuperar La Memoria Histórica',   // política izquierda
  'Los Años De Allende',                   // política
  'Pensar El Siglo XX',                    // filosofía política Judt
  'Actualidad Del Anarquismo',             // política radical
  'Los Mitos De La Democracia Chilena',    // política chilena
  'Ajuste De Cuentas',                     // ensayo político Tironi
  'América Latina',                        // Lagos (ya estaba marcado)
  'Mein kampf',                            // ya estaba marcado
];

const { data: dep } = await s
  .from('listings')
  .select('id, book:books(title, author)')
  .eq('deprioritized', true);

const toRevert = (dep || []).filter(l => {
  const title = l.book?.title || '';
  return TITLES_TO_REVERT.some(t => title.toLowerCase() === t.toLowerCase());
});

console.log(`=== A REVERTIR (no políticos) — ${toRevert.length} libros ===`);
toRevert.forEach(l => console.log(`  ✓ ${l.book?.title}`));

const stillDep = (dep || []).filter(l => {
  const title = l.book?.title || '';
  return POLITICAL_TITLES_KEEP.some(t => title.toLowerCase().includes(t.toLowerCase()));
});
console.log(`\n=== SE QUEDAN DEPRIORITIZADOS (políticos) — ${stillDep.length} libros ===`);
stillDep.forEach(l => console.log(`  🚫 ${l.book?.title}`));

const unclassified = (dep || []).filter(l => !toRevert.includes(l) && !stillDep.includes(l));
if (unclassified.length > 0) {
  console.log(`\n⚠️  Sin clasificar (${unclassified.length}):`);
  unclassified.forEach(l => console.log(`  ? ${l.book?.title}`));
}

if (!APPLY) {
  console.log('\nDRY RUN. Para aplicar: node scripts/_revert_cimlibros_no_politicos.mjs --apply');
  process.exit(0);
}

if (toRevert.length === 0) {
  console.log('\nNada que revertir.');
  process.exit(0);
}

const ids = toRevert.map(l => l.id);
const { error } = await s.from('listings').update({ deprioritized: false }).in('id', ids);
if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
console.log(`\n✓ ${ids.length} listings revertidos a estado normal.`);
