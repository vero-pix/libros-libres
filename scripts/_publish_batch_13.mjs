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
const IMG = '/tmp/tanda_ellroy';

const BOOKS = [
  {
    title: 'Negra espalda del tiempo',
    author: 'Javier Marías',
    publisher: 'Alfaguara',
    category: 'ficcion',
    subcategory: 'novela',
    tags: ['literatura española','Javier Marías'],
    slug: 'negra-espalda-del-tiempo',
    price: 11800,
    condition: 'good',
    notes: 'Editorial Alfaguara. Novela de Javier Marías que mezcla memoria, literatura y ficción autobiográfica. Libro físico usado en buen estado.',
    photos: ['IMG_8951.jpg','IMG_8952.jpg'],
  },
  {
    title: 'Crónica de las ideas — para comprender un fin de siglo',
    author: 'Jaime Antúnez Aldunate',
    publisher: 'Editorial Andrés Bello',
    category: 'no-ficcion',
    subcategory: null,
    tags: ['ensayo','historia de las ideas'],
    slug: 'cronica-de-las-ideas',
    price: 8990,
    condition: 'good',
    notes: 'Editorial Andrés Bello, 2ª edición. Prólogo de Vinitia Horta. Entrevistas a Jaime Antúnez con pensadores actuales. Tapa blanda, libro físico usado en buen estado.',
    photos: ['IMG_8953.jpg','IMG_8954.jpg'],
  },
  {
    title: 'Un espía perfecto',
    author: 'John Le Carré',
    publisher: 'Plaza & Janés',
    category: 'ficcion',
    subcategory: 'novela-negra',
    tags: ['espionaje','novela','Le Carré'],
    slug: 'un-espia-perfecto',
    price: 8990,
    condition: 'good',
    notes: 'Plaza & Janés, 3ª edición (80.000 ejemplares vendidos en un mes). La enigmática figura de un espía doble puesta al desnudo por el mejor autor del género. Libro físico usado en buen estado.',
    photos: ['IMG_8955.jpg','IMG_8956.jpg'],
  },
  {
    title: 'Una pequeña ciudad de Alemania',
    author: 'John Le Carré',
    publisher: 'Bruguera · Libro Amigo',
    category: 'ficcion',
    subcategory: 'novela-negra',
    tags: ['espionaje','Le Carré','Bruguera'],
    slug: 'una-pequena-ciudad-de-alemania',
    price: 6500,
    condition: 'fair',
    notes: 'Bruguera, colección Libro Amigo. Leo Haring, humilde empleado de la Embajada Británica en Bonn, desaparece con un dossier secreto. Edición de bolsillo antigua, con marcas de uso.',
    photos: ['IMG_8957.jpg','IMG_8958.jpg'],
  },
  {
    title: 'Heterodoxia',
    author: 'Ernesto Sábato',
    publisher: 'Seix Barral · Biblioteca Breve',
    category: 'no-ficcion',
    subcategory: null,
    tags: ['ensayo','Sábato','filosofía'],
    slug: 'heterodoxia-sabato',
    price: 9990,
    condition: 'good',
    notes: 'Seix Barral — Biblioteca Breve. "Diccionario" del hombre en crisis, como señalaba Sábato, originalmente publicado en 1953. Uno y el universo (1945), Hombres y engranajes (1951) y Heterodoxia componen la obra como ensayista del gran escritor argentino. Libro físico usado en buen estado.',
    photos: ['IMG_8959.jpg','IMG_8960.jpg'],
  },
  {
    title: 'Noticias de la noche',
    author: 'Petros Márkaris',
    publisher: 'Punto de Lectura',
    category: 'ficcion',
    subcategory: 'novela-negra',
    tags: ['novela negra','Márkaris','Grecia'],
    slug: 'noticias-de-la-noche',
    price: 7990,
    condition: 'good',
    notes: 'Punto de Lectura. Primera novela del comisario Jaritos. Matrimonio albanés asesinado en Atenas, organización clandestina, dos nuevos homicidios sin escrúpulos. Márkaris es uno de los grandes de la novela negra europea. Libro físico usado en buen estado.',
    photos: ['IMG_8961.jpg','IMG_8962.jpg'],
  },
  {
    title: 'El eco negro',
    author: 'Michael Connelly',
    publisher: 'Byblos · Ediciones B',
    category: 'ficcion',
    subcategory: 'novela-negra',
    tags: ['novela negra','Harry Bosch','policial'],
    slug: 'el-eco-negro-connelly',
    price: 6990,
    condition: 'good',
    notes: 'Byblos — Ediciones B, colección Thriller. Primera novela de Harry Bosch, detective de Los Ángeles, hijo de una prostituta asesinada, veterano de Vietnam. Premio Edgar. "Una de las novelas policíacas más auténticas que he leído" — James Lee Burke. Libro físico usado en buen estado.',
    photos: ['IMG_8963.jpg','IMG_8964.jpg'],
  },
  {
    title: 'El arco y la lira',
    author: 'Octavio Paz',
    publisher: 'Fondo de Cultura Económica',
    category: 'no-ficcion',
    subcategory: 'filosofia',
    tags: ['poesía','ensayo','Octavio Paz','FCE'],
    slug: 'el-arco-y-la-lira-paz',
    price: 11990,
    condition: 'fair',
    notes: 'Fondo de Cultura Económica, colección Lengua y Estudios Literarios. Reflexiones de Octavio Paz sobre el fenómeno poético. Obra capital del premio Nobel mexicano. Edición antigua, amarillenta por el tiempo pero entera y legible.',
    photos: ['IMG_8965.jpg','IMG_8966.jpg'],
  },
  {
    title: 'Breviario de podredumbre',
    author: 'E. M. Cioran',
    publisher: 'Taurus Bolsillo',
    category: 'no-ficcion',
    subcategory: 'filosofia',
    tags: ['filosofía','aforismos','Cioran'],
    slug: 'breviario-de-podredumbre',
    price: 8990,
    condition: 'good',
    notes: 'Taurus Bolsillo. Los aforismos de Cioran que hicieron famoso al filósofo rumano en el exilio parisino. "Éste no es un libro como el que está al lado, ni como el de más allá. No se trata de una golosina cultural". Libro físico usado en buen estado.',
    photos: ['IMG_8967.jpg','IMG_8968.jpg'],
  },
  {
    title: 'El ministerio del miedo',
    author: 'Graham Greene',
    publisher: 'Emecé · Literatura Universal',
    category: 'ficcion',
    subcategory: 'novela',
    tags: ['Graham Greene','novela','literatura universal'],
    slug: 'el-ministerio-del-miedo',
    price: 7990,
    condition: 'fair',
    notes: 'Emecé, colección Literatura Universal. Arthur Rowe en la atmósfera del Londres bombardeado de la Segunda Guerra Mundial. Excelente trama de intriga y suspenso, una magnífica novela psicológica. Edición antigua, amarillenta pero entera.',
    photos: ['IMG_8969.jpg','IMG_8970.jpg'],
  },
  {
    title: 'El hombre de mi vida',
    author: 'Manuel Vázquez Montalbán',
    publisher: 'Booket',
    category: 'ficcion',
    subcategory: 'novela-negra',
    tags: ['Pepe Carvalho','novela negra','Montalbán'],
    slug: 'el-hombre-de-mi-vida',
    price: 6990,
    condition: 'good',
    notes: 'Booket. El regreso de Pepe Carvalho. Tres años después de sus andanzas en Quinteto de Buenos Aires. Carvalho vuelve, convocado para una extraña misión de espionaje, con amor, sectas y muerte. Libro físico usado en buen estado.',
    photos: ['IMG_8971.jpg','IMG_8972.jpg'],
  },
  {
    title: 'Conocer — las ciencias cognitivas: tendencias y perspectivas',
    author: 'Francisco J. Varela',
    publisher: 'Gedisa',
    category: 'no-ficcion',
    subcategory: 'filosofia',
    tags: ['ciencias cognitivas','filosofía de la mente','Varela','Chile'],
    slug: 'conocer-varela',
    price: 9990,
    condition: 'good',
    notes: 'Editorial Gedisa, colección El Mamífero Parlante. Cartografía de las ideas actuales sobre las ciencias cognitivas. Panorama magistral por Francisco J. Varela (1946-2000), biólogo chileno, pionero de la neurofenomenología. Libro físico usado en buen estado.',
    photos: ['IMG_8973.jpg','IMG_8974.jpg'],
  },
  {
    title: 'América',
    author: 'James Ellroy',
    publisher: 'Ediciones B',
    category: 'ficcion',
    subcategory: 'novela-negra',
    tags: ['Ellroy','novela negra','historia de Estados Unidos'],
    slug: 'america-ellroy',
    price: 9990,
    condition: 'good',
    notes: 'Ediciones B, segunda edición. Tapa dura con sobrecubierta. "Trama de alto octanaje. Un libro poderoso, el lector no se queda sin aliento, cambiando de vista sobre la historia reciente de América" — Sunday Telegraph. Libro físico usado en buen estado.',
    photos: ['IMG_8975.jpg','IMG_8976.jpg'],
  },
];

async function uploadPhoto(listingId, photoFile, idx) {
  const buf = readFileSync(`${IMG}/${photoFile}`);
  const filename = `${photoFile.replace('.jpg','')}.jpg`;
  const fullPath = `${VERO_ID}/${listingId}/${filename}`;
  const { error } = await s.storage.from('covers').upload(fullPath, buf, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return s.storage.from('covers').getPublicUrl(fullPath).data.publicUrl;
}

for (const bk of BOOKS) {
  console.log(`\n═══ ${bk.title} ═══`);
  try {
    // Create book
    const bookId = randomUUID();
    const { error: bErr } = await s.from('books').insert({
      id: bookId,
      title: bk.title,
      author: bk.author,
      publisher: bk.publisher,
      category: bk.category,
      subcategory: bk.subcategory,
      tags: bk.tags,
      language: 'es',
      created_by: VERO_ID,
    });
    if (bErr) throw new Error('book: ' + bErr.message);

    // Create listing
    const listingId = randomUUID();
    const urls = [];
    for (let i = 0; i < bk.photos.length; i++) {
      urls.push(await uploadPhoto(listingId, bk.photos[i], i));
    }

    const { error: lErr } = await s.from('listings').insert({
      id: listingId,
      book_id: bookId,
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
    if (lErr) throw new Error('listing: ' + lErr.message);

    // Add only photos 2+ to listing_images (cover is separate)
    if (urls.length > 1) {
      await s.from('listing_images').insert(
        urls.slice(1).map((url, idx) => ({ listing_id: listingId, image_url: url, sort_order: idx + 1 }))
      );
    }
    console.log(`  ✓ https://tuslibros.cl/libro/vero/${bk.slug}  ·  $${bk.price.toLocaleString('es-CL')}`);
  } catch (e) {
    console.error('  ✗', e.message);
  }
}
