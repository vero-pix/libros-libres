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

const BOOKS = [
  {
    bookId: 'a5ef34d8-c9d3-4b40-8584-dd491c4042fc',
    slug: 'hhhh-binet',
    title: 'HHhH',
    price: 8990,
    condition: 'good',
    notes: 'Editorial Seix Barral — Biblioteca Formentor. Novela premiada con el Goncourt de primera novela. Narra la Operación Anthropoid: la misión checoslovaca para asesinar a Reinhard Heydrich, jefe de la Gestapo, en Praga 1942. Himmler decía "Himmlers Hirn heisst Heydrich" (el cerebro de Himmler se llama Heydrich) — de ahí el título HHhH. Libro físico usado en buen estado.',
    photos: ['/tmp/karamazov_fotos/IMG_8940.jpg', '/tmp/karamazov_fotos/IMG_8941.jpg'],
  },
  {
    bookId: 'a0f3b802-8994-421d-8252-34772475a9ba',
    slug: 'antigua-luz-banville',
    title: 'Antigua Luz',
    price: 9990,
    condition: 'good',
    notes: 'Editorial Alfaguara. Traducción de Damià Alou. Alexander Cleave, viejo actor de teatro, recuerda su fugaz e intenso primer amor. Un rodaje cinematográfico lo llevará a intimar con una joven actriz cuya vida se ha asomado al abismo. Banville (Premio Booker) demuestra su talento para escribir sobre la verdadera textura del erotismo. Libro físico usado en buen estado (con sticker de librería).',
    photos: ['/tmp/karamazov_fotos/IMG_8942.jpg', '/tmp/karamazov_fotos/IMG_8943.jpg'],
  },
  {
    bookId: '978e94a9-401b-4927-826b-78bba45f7063',
    slug: 'rapsodia-gourmet-barbery',
    title: 'Rapsodia Gourmet',
    price: 8990,
    condition: 'good',
    notes: 'Editorial Seix Barral — Biblioteca Formentor. Primera novela de Muriel Barbery (autora de La elegancia del erizo). En el corazón de París, Pierre Arthens, el crítico gastronómico más célebre del mundo, está a punto de morir. En sus últimas horas de vida busca desesperadamente un sabor único, el sabor que un día lo hizo feliz. Libro físico usado en buen estado (con sticker de librería).',
    photos: ['/tmp/karamazov_fotos/IMG_8944.jpg', '/tmp/karamazov_fotos/IMG_8945.jpg'],
  },
  {
    bookId: '01d3cdfb-2242-43aa-a3c7-da907848b6ad',
    slug: 'la-dadiva-nabokov',
    title: 'La dádiva',
    price: 10990,
    condition: 'good',
    notes: 'Editorial Anagrama — Biblioteca Nabokov, colección Panorama de narrativas. Una de las novelas más ambiciosas y complejas de Nabokov, "la mejor de sus novelas rusas" en palabras del autor. Sigue a un joven escritor emigrado ruso en el Berlín de entreguerras, cuya inmortalidad reside en el arte creativo. Tema central: la formación literaria del protagonista. Para quien quiera leer al mejor Nabokov. Libro físico usado en buen estado.',
    photos: ['/tmp/karamazov_fotos/IMG_8946.jpg', '/tmp/karamazov_fotos/IMG_8947.jpg'],
  },
];

for (const bk of BOOKS) {
  console.log(`\n═══ ${bk.title} ═══`);
  const listingId = randomUUID();
  const urls = [];
  for (let i = 0; i < bk.photos.length; i++) {
    const buf = readFileSync(bk.photos[i]);
    const filename = `${bk.slug}-${i + 1}.jpg`;
    const fullPath = `${VERO_ID}/${listingId}/${filename}`;
    const { error } = await s.storage.from('covers').upload(fullPath, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`  ✗ Foto ${i+1}:`, error.message); continue; }
    const { data: pub } = s.storage.from('covers').getPublicUrl(fullPath);
    urls.push(pub.publicUrl);
    console.log(`  ✓ Foto ${i+1} subida`);
  }
  if (urls.length === 0) { console.log('  ✗ Sin fotos, skip'); continue; }

  const { error: lErr } = await s.from('listings').insert({
    id: listingId,
    book_id: bk.bookId,
    seller_id: VERO_ID,
    modality: 'sale',
    price: bk.price,
    condition: bk.condition,
    notes: bk.notes,
    address: DEFAULT_ADDRESS,
    latitude: LAT,
    longitude: LNG,
    status: 'active',
    deprioritized: false,
    slug: bk.slug,
    cover_image_url: urls[0],
  });
  if (lErr) { console.log('  ✗ Listing error:', lErr.message); continue; }

  const { error: iErr } = await s.from('listing_images').insert(
    urls.map((url, idx) => ({ listing_id: listingId, image_url: url, sort_order: idx }))
  );
  if (iErr) console.warn('  ⚠️  listing_images:', iErr.message);
  console.log(`  ✓ Listing creado: https://tuslibros.cl/libro/vero/${bk.slug}  · $${bk.price.toLocaleString('es-CL')}`);
}
