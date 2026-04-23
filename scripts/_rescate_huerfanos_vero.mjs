import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const VERO_ID = '2201d163-4423-4971-91f0-f6cebd00d1bd';
const DEFAULT_ADDRESS = 'San Pío X 2555, Providencia, Región Metropolitana de Santiago 7500000, Chile';
const DEFAULT_LAT = -33.420788;
const DEFAULT_LNG = -70.602773;

const IDS = [
  '6333d7f2-d08b-4835-9f88-c177f8e28c6f','7213fc6a-84cd-4fab-8c02-29e8dde7a57d','359279a4-327e-4a4b-8434-7bcaeb676b0d',
  'f353683a-3e0b-48b0-8939-9671bc70cc12','467af8f3-6179-47fe-aff8-5bfa39421953','32762702-c1b9-486f-90ef-7a3cb0c4489d',
  'dadcffd5-3f0c-4ce5-bc8c-ff30d3087fe0','28f35fee-a5ec-4dc0-9446-b85fe519045d','95dbb92e-e07c-414f-bf16-8082f997fc42',
  '69d295f7-9106-46ff-86d9-9f03d4285f8c','84c1d61b-f802-4816-97b1-a17da6b190ec','9e8afe06-a9c5-4979-98ea-d2b5a705eb09',
  '5e471110-5858-4db9-a903-b131ac5a8162','41f5afba-d9df-4c64-95ad-afb51a1f70b7','3845bafb-64ae-4e7b-b7dc-589bd75def77',
  'a5ef34d8-c9d3-4b40-8584-dd491c4042fc','683272ba-17a8-4c66-a71a-e0a8e3f6ce23','845e7711-5bde-4eaf-902b-7a3e4e3e19ca',
  'e474bf5b-6e54-4d41-8835-e41f48df0e90','9e9b52ca-e789-4271-b57a-83dbf1bfe503','889a6620-c488-44c3-bcc6-acc2106f09cd',
  'cb024fad-f256-4767-b9de-08589aa36c3a','63bdecf2-0a3b-41a5-8387-84dd01da0ba3','22dc3918-3fce-40e7-95aa-db504ebbb262',
  '2d15fc2a-e2b4-4902-8c25-cbc97b37fd1d','eeb6430d-84a5-4208-807b-67dc792df700','123a74bc-c368-4be6-a99f-4c61a7d739c8',
  '61db4fb7-a132-46ad-b003-ef16fc1ba3a4','a9641eed-885e-4b55-b1f6-07d9504c65dc','f231c17b-cddd-46e9-a87a-0467ee0ec05f',
  '026bbd38-2fe6-4edb-90e5-9e414dd1c63a','d67fbff5-868f-4f26-8c81-d35d4645f1b7','76b19e28-dc89-493d-9ce0-0867bb6bec97',
  'b2bb6295-81b5-43c2-9b7c-0d6e9f3e8b44','44b6d7fc-440b-424b-9097-fda306f5607b','f946b915-b7d9-4419-a667-3ea51eec42fe',
  'ea1f90dc-6385-468e-9015-e890169cdd64','a0f3b802-8994-421d-8252-34772475a9ba','978e94a9-401b-4927-826b-78bba45f7063',
  '7018c95e-fae4-43e3-b3e7-4717256b0347','0b17d6e0-52e6-4cc2-ba68-ad77da8f9efb','99a00318-b923-4167-9e4f-6eea2ebe5689',
  '30cf73df-ce74-4093-8d54-ebd5f667a5b4','ff11bd4f-036c-47ca-a9dd-84550c48fc0a','46765a53-06ae-4825-8b0d-36ba075af418',
  '557d89a3-24b9-4916-b4e6-2aa99257956a','b0312085-c391-422b-85a5-2f3824dd7dba','ed1c6a5e-3778-470c-8a03-b7b8943d8dda',
  'ccc23185-63e9-408c-a642-8e64ed7add4a',
];

const APPLY = process.argv.includes('--apply');

// Generar slug desde título
function slugify(s) {
  return (s || 'sin-titulo')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const { data: books } = await s.from('books').select('id, title, author, cover_url').in('id', IDS);
console.log(`Books encontrados: ${books?.length}/${IDS.length}`);

const toCreate = [];
const skipped = [];
for (const b of books || []) {
  // Check si ya tiene listing activo (safety)
  const { data: existing } = await s.from('listings').select('id').eq('book_id', b.id).eq('seller_id', VERO_ID).limit(1);
  if (existing && existing.length > 0) {
    skipped.push({ id: b.id, title: b.title, reason: 'ya tiene listing de vero' });
    continue;
  }
  // Slug único con fragmento del book_id para evitar colisiones
  const slug = `${slugify(b.title)}-${b.id.slice(0, 6)}`;
  toCreate.push({
    book_id: b.id,
    seller_id: VERO_ID,
    modality: 'sale',
    price: null,              // sin precio — vero pone después
    condition: 'good',        // default
    notes: 'Rescatado desde borrador — falta precio y revisión',
    address: DEFAULT_ADDRESS,
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    status: 'active',
    deprioritized: true,      // al fondo hasta que Vero les ponga precio
    slug,
    cover_image_url: b.cover_url || null,
  });
}

console.log(`\nA crear: ${toCreate.length} listings`);
console.log(`Skipped: ${skipped.length}`);
skipped.forEach(x => console.log('  ⊗', x.title, '—', x.reason));

if (!APPLY) {
  console.log('\nDRY RUN. Ejecuta con --apply');
  process.exit(0);
}

if (toCreate.length === 0) {
  console.log('\nNada para crear.');
  process.exit(0);
}

// Insertar en tanda (Supabase acepta hasta 1000 por vez)
const { data: created, error } = await s.from('listings').insert(toCreate).select('id, book_id');
if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log(`\n✓ ${created.length} listings creados (deprioritized=true, sin precio)`);
console.log('  Todos aparecen al fondo del catálogo hasta que les pongas precio.');
console.log('  Edítalos desde /admin o /mis-libros.');
