import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const VERO_ID = '2201d163-4423-4971-91f0-f6cebd00d1bd';
const DEFAULT_ADDRESS = 'San Pío X 2555, Providencia, Región Metropolitana de Santiago 7500000, Chile';
const LAT = -33.420788;
const LNG = -70.602773;

const IMAGE_PATHS = [
  '/Users/veronicavelasquez/.claude/image-cache/8c871a13-6ec0-4b1c-9d76-cd657924dc39/50.png', // portada
  '/Users/veronicavelasquez/.claude/image-cache/8c871a13-6ec0-4b1c-9d76-cd657924dc39/51.png', // contraportada
  '/Users/veronicavelasquez/.claude/image-cache/8c871a13-6ec0-4b1c-9d76-cd657924dc39/52.png', // página créditos
];

// 1) Crear book
const bookId = randomUUID();
const { error: bookErr } = await s.from('books').insert({
  id: bookId,
  title: 'Los Hermanos Karamazov — Tomo I',
  author: 'Fiódor Dostoyevski',
  description: 'Primera edición chilena de Editorial Andrés Bello (Santiago, enero 1989, 21.000 ejemplares). Traducción de E. Miró. Portada ilustrada por Carlos Rojas Maffioletti (Club de Lectores Andrés Bello). Primera parte de la novela capital del gran escritor ruso, crónica de una familia rusa en una pequeña capital de provincia — la enemistad entre padre e hijo, las complejas relaciones entre hermanos, la pasión llevada a su más elevada potencia. Esta edición partió la novela en dos tomos; este es el Tomo I. Tengo solo este tomo.',
  published_year: 1989,
  publisher: 'Editorial Andrés Bello',
  binding: 'paperback',
  pages: null,
  language: 'es',
  category: 'ficcion',
  subcategory: 'novela',
  tags: ['clásico', 'literatura rusa', 'Dostoyevski'],
  created_by: VERO_ID,
});
if (bookErr) { console.error('Book error:', bookErr); process.exit(1); }
console.log('✓ Book creado:', bookId);

// 2) Generar listing_id y subir las imágenes
const listingId = randomUUID();
async function uploadImage(path, idx) {
  const buf = readFileSync(path);
  const filename = `${Date.now() + idx}-${Math.random().toString(36).slice(2, 10)}.png`;
  const storagePath = `${VERO_ID}/${listingId}/${filename}`;
  const { error } = await s.storage.from('covers').upload(storagePath, buf, {
    contentType: 'image/png',
    upsert: false,
  });
  if (error) throw error;
  const { data: pub } = s.storage.from('covers').getPublicUrl(storagePath);
  return pub.publicUrl;
}

const urls = [];
for (let i = 0; i < IMAGE_PATHS.length; i++) {
  try {
    const url = await uploadImage(IMAGE_PATHS[i], i);
    urls.push(url);
    console.log(`  ✓ Foto ${i + 1}: ${url.slice(-60)}`);
  } catch (e) {
    console.error(`  ✗ Foto ${i + 1}:`, e.message);
  }
}

if (urls.length === 0) { console.error('No se subió ninguna foto, aborto'); process.exit(1); }

// 3) Crear listing
const { error: listingErr } = await s.from('listings').insert({
  id: listingId,
  book_id: bookId,
  seller_id: VERO_ID,
  modality: 'sale',
  price: 5000,
  condition: 'fair',   // según las fotos: portada gastada, amarillento, entero
  notes: 'Primera edición chilena Andrés Bello 1989. Portada desgastada pero libro entero y legible. Solo tengo el Tomo I (no tengo el II).',
  address: DEFAULT_ADDRESS,
  latitude: LAT,
  longitude: LNG,
  status: 'active',
  deprioritized: false,
  slug: 'los-hermanos-karamazov-tomo-i',
  cover_image_url: urls[0],
});
if (listingErr) { console.error('Listing error:', listingErr); process.exit(1); }
console.log('✓ Listing creado:', listingId);

// 4) Registrar fotos adicionales en listing_images
const imagesToInsert = urls.map((url, idx) => ({
  listing_id: listingId,
  image_url: url,
  sort_order: idx,
}));
const { error: imgErr } = await s.from('listing_images').insert(imagesToInsert);
if (imgErr) console.warn('listing_images warn:', imgErr.message);
else console.log(`✓ ${urls.length} fotos registradas en listing_images`);

console.log(`\n→ Ver el libro: https://tuslibros.cl/libro/vero/los-hermanos-karamazov-tomo-i`);
