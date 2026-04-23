import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const VERO_ID = '2201d163-4423-4971-91f0-f6cebd00d1bd';
const ADDRESS = 'San Pío X 2555, Providencia, Región Metropolitana de Santiago 7500000, Chile';
const LAT = -33.420788;
const LNG = -70.602773;

const BOOKS = [
  { title: 'Las cuitas del joven Werther', author: 'Johann Wolfgang von Goethe', publisher: 'Biblioteca Popular Nascimento', slug: 'werther-nascimento',
    query: 'Werther Goethe', price: 10990, condition: 'fair', category: 'ficcion', subcategory: 'novela',
    notes: 'Edición antigua chilena de Biblioteca Popular Nascimento (editorial histórica chilena, ca. 1940-60). Clásico alemán del Sturm und Drang. Libro físico usado con desgaste por el tiempo pero entero y legible. Pieza con cierto valor editorial.',
    tags: ['Goethe','clásico','edición chilena antigua','Nascimento'] },
  { title: 'Elogio de la Madrastra', author: 'Mario Vargas Llosa', publisher: 'Emecé · Grandes Novelistas', slug: 'elogio-de-la-madrastra',
    query: 'Elogio de la Madrastra Vargas Llosa', price: 8990, condition: 'good', category: 'ficcion', subcategory: 'novela',
    notes: 'Emecé · colección Grandes Novelistas. Novela erótica y divertida de Vargas Llosa (premio Nobel 2010). Libro físico usado en buen estado.',
    tags: ['Vargas Llosa','novela erótica','Premio Nobel'] },
  { title: 'Animales Literarios de Chile', author: 'Enrique Lafourcade', publisher: null, slug: 'animales-literarios-de-chile',
    query: 'Animales Literarios de Chile Lafourcade', price: 9990, condition: 'good', category: 'no-ficcion', subcategory: null,
    notes: 'Retratos y anécdotas de los grandes escritores chilenos por Enrique Lafourcade. Libro de culto para lectores chilenos, difícil de encontrar. Libro físico usado en buen estado.',
    tags: ['literatura chilena','ensayo','Lafourcade'] },
  { title: 'Mishima o la visión del vacío', author: 'Marguerite Yourcenar', publisher: 'Biblioteca de Bolsillo', slug: 'mishima-vision-del-vacio',
    query: 'Mishima Yourcenar', price: 8990, condition: 'good', category: 'no-ficcion', subcategory: null,
    notes: 'Biblioteca de Bolsillo. Ensayo de Marguerite Yourcenar sobre Yukio Mishima, el escritor japonés que se suicidó ritualmente. Culto, nicho para lectores de literatura japonesa. Libro físico usado en buen estado.',
    tags: ['Yourcenar','Mishima','literatura japonesa','ensayo'] },
  { title: 'La Mansión de Araucaíma · Diario de Lecumberri', author: 'Álvaro Mutis', publisher: 'Norma · Grupo Editorial', slug: 'mansion-araucaima-mutis',
    query: 'Mansion de Araucaima Mutis', price: 7990, condition: 'good', category: 'ficcion', subcategory: 'novela',
    notes: 'Grupo Editorial Norma, colección Literatura. Álvaro Mutis, Premio Cervantes 2001, amigo íntimo de García Márquez. Dos relatos clásicos del autor colombiano. Libro físico usado en buen estado.',
    tags: ['Mutis','Premio Cervantes','literatura latinoamericana'] },
  { title: 'Acerca del nihilismo · Sobre la línea / Hacia la pregunta del ser', author: 'Ernst Jünger · Martin Heidegger', publisher: 'Paidós · Pensamiento Contemporáneo 28', slug: 'acerca-del-nihilismo',
    query: 'Acerca del nihilismo Junger Heidegger', price: 8990, condition: 'good', category: 'no-ficcion', subcategory: 'filosofia',
    notes: 'Paidós ICE/UAB, colección Pensamiento Contemporáneo 28. Dos textos fundamentales sobre el nihilismo: "Sobre la línea" de Ernst Jünger y "Hacia la pregunta del ser" de Martin Heidegger, como respuesta. Libro físico usado en buen estado.',
    tags: ['filosofía','Heidegger','Jünger','nihilismo'] },
  { title: 'Uniones', author: 'Robert Musil', publisher: 'Biblioteca de Bolsillo', slug: 'uniones-musil',
    query: 'Uniones Musil', price: 8990, condition: 'good', category: 'ficcion', subcategory: 'novela',
    notes: 'Biblioteca de Bolsillo. Dos relatos de Robert Musil (autor de El hombre sin atributos). Libro físico usado en buen estado.',
    tags: ['Musil','literatura austríaca','relatos'] },
  { title: 'Color Local', author: 'Truman Capote', publisher: 'Norma · Grupo Editorial', slug: 'color-local-capote',
    query: 'Color Local Capote', price: 7990, condition: 'good', category: 'no-ficcion', subcategory: null,
    notes: 'Grupo Editorial Norma, colección Literatura. Ensayos de viaje y crónicas de Truman Capote. Libro físico usado en buen estado.',
    tags: ['Capote','crónica','viajes'] },
  { title: 'Camino de Perfección', author: 'Pío Baroja', publisher: 'Editorial Universitaria · Cormorán', slug: 'camino-de-perfeccion-baroja',
    query: 'Camino de Perfeccion Baroja', price: 6990, condition: 'good', category: 'ficcion', subcategory: 'novela',
    notes: 'Editorial Universitaria, colección Escritores de Otra Orilla · Cormorán. Novela clásica de Pío Baroja, autor fundamental de la Generación del 98. Libro físico usado en buen estado.',
    tags: ['Baroja','generación del 98','literatura española'] },
  { title: 'Llamada para el muerto', author: 'John Le Carré', publisher: null, slug: 'llamada-para-el-muerto',
    query: 'Llamada para el muerto Le Carre', price: 6500, condition: 'fair', category: 'ficcion', subcategory: 'novela-negra',
    notes: 'Primera novela de John Le Carré, debut del espía George Smiley. Edición antigua con desgaste visible. Libro físico usado, leíble.',
    tags: ['Le Carré','espionaje','George Smiley'] },
  { title: 'El grupo zoológico humano', author: 'Pierre Teilhard de Chardin', publisher: 'Ensayistas de Hoy', slug: 'grupo-zoologico-humano',
    query: 'grupo zoologico humano Teilhard Chardin', price: 4990, condition: 'fair', category: 'no-ficcion', subcategory: null,
    notes: 'Colección Ensayistas de Hoy. Ensayo antropológico del jesuita Teilhard de Chardin sobre la estructura y evolución de la humanidad como especie. Edición antigua con amarilleo. Libro físico usado.',
    tags: ['Teilhard de Chardin','antropología','filosofía'] },
];

async function fetchCover(query) {
  // 1) Google Books API
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3&printType=books`);
    const data = await res.json();
    for (const item of data.items || []) {
      const links = item.volumeInfo?.imageLinks;
      const url = links?.thumbnail || links?.smallThumbnail;
      if (url) return url.replace('http://', 'https://').replace('&edge=curl', '').replace('zoom=1', 'zoom=2');
    }
  } catch (e) {}
  // 2) Open Library search
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3`);
    const data = await res.json();
    for (const doc of data.docs || []) {
      if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    }
  } catch (e) {}
  return null;
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

for (const bk of BOOKS) {
  console.log(`\n═══ ${bk.title} ═══`);
  try {
    // Check si ya existe
    const { data: existing } = await s.from('books').select('id').ilike('title', '%' + bk.title.slice(0, 20) + '%').ilike('author', '%' + bk.author.split(' ')[0] + '%');
    let bookId;
    if (existing && existing.length > 0) {
      bookId = existing[0].id;
      console.log('  → Usando book existente', bookId.slice(0,8));
    } else {
      bookId = randomUUID();
      const { error } = await s.from('books').insert({
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
      if (error) throw new Error('book: ' + error.message);
      console.log('  ✓ Book creado', bookId.slice(0,8));
    }

    // Buscar cover
    const coverUrl = await fetchCover(bk.query);
    console.log('  cover fetched:', coverUrl ? 'SÍ' : 'NO (usaremos placeholder del sistema)');

    const listingId = randomUUID();
    let finalCoverUrl = null;
    if (coverUrl) {
      try {
        const buf = await downloadImage(coverUrl);
        const path = `${VERO_ID}/${listingId}/${bk.slug}-cover.jpg`;
        const { error: upErr } = await s.storage.from('covers').upload(path, buf, { contentType: 'image/jpeg', upsert: true });
        if (!upErr) finalCoverUrl = s.storage.from('covers').getPublicUrl(path).data.publicUrl;
      } catch (e) {
        console.log('  ⚠️  download fail:', e.message);
      }
    }

    const { error: lErr } = await s.from('listings').insert({
      id: listingId,
      book_id: bookId,
      seller_id: VERO_ID,
      modality: 'sale',
      price: bk.price,
      condition: bk.condition,
      notes: bk.notes,
      address: ADDRESS,
      latitude: LAT,
      longitude: LNG,
      status: 'active',
      deprioritized: false,
      slug: bk.slug,
      cover_image_url: finalCoverUrl,
    });
    if (lErr) throw new Error('listing: ' + lErr.message);
    console.log(`  ✓ Listing: https://tuslibros.cl/libro/vero/${bk.slug}  ·  $${bk.price.toLocaleString('es-CL')}`);
  } catch (e) {
    console.error('  ✗', e.message);
  }
}
