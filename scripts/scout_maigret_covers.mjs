/**
 * Reconnaissance: busca portadas disponibles para los 21 Maigret de la colección
 * Luis de Caralt que va a publicar Vero. NO escribe nada en la BD.
 *
 * Usage: node scripts/scout_maigret_covers.mjs
 */

const TITLES = [
  "Maigret y el caso del ministro",
  "Maigret en los bajos fondos",
  "La noche de la encrucijada",
  "Maigret y el cliente del sábado",
  "A la cita de las terranovas",
  "Maigret y los muertos del canal",
  "Maigret se defiende",
  "Maigret se divierte",
  "Maigret y el perro canelo",
  "Maigret con la muerte en los talones",
  "Maigret",
  "Las memorias de Maigret",
  "La exclusa número 1",
  "Maigret en casa de los flamencos",
  "La muerte ronda a Maigret",
  "Maigret y el Liberty Bar",
  "Maigret en los dominios del coroner",
  "Los sótanos del Majestic",
  "Una confidencia de Maigret",
  "Cécile ha muerto",
  "Maigret y el extraño vagabundo",
];

const AUTHOR = "Georges Simenon";

async function searchGoogleBooks(title) {
  const q = encodeURIComponent(`intitle:"${title}" inauthor:"Simenon"`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&langRestrict=es`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map((item) => ({
      source: "google",
      title: item.volumeInfo?.title,
      publisher: item.volumeInfo?.publisher,
      year: item.volumeInfo?.publishedDate,
      thumb: item.volumeInfo?.imageLinks?.thumbnail?.replace("http://", "https://").replace("&edge=curl", "").replace("zoom=1", "zoom=2") ?? null,
      isbn: item.volumeInfo?.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier
        ?? item.volumeInfo?.industryIdentifiers?.[0]?.identifier
        ?? null,
    }));
  } catch {
    return [];
  }
}

async function searchOpenLibrary(title) {
  const q = encodeURIComponent(`${title} Simenon`);
  const url = `https://openlibrary.org/search.json?q=${q}&limit=5&language=spa`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.docs ?? []).map((doc) => ({
      source: "openlibrary",
      title: doc.title,
      publisher: (doc.publisher ?? []).slice(0, 2).join(", "),
      year: doc.first_publish_year,
      thumb: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
      isbn: doc.isbn?.[0] ?? null,
    }));
  } catch {
    return [];
  }
}

async function verifyImage(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function scout(title) {
  const [google, openlib] = await Promise.all([
    searchGoogleBooks(title),
    searchOpenLibrary(title),
  ]);

  const all = [...google, ...openlib];
  const withCover = all.filter((r) => r.thumb);
  const verified = [];
  for (const r of withCover) {
    if (await verifyImage(r.thumb)) verified.push(r);
  }

  return { title, total: all.length, withCover: withCover.length, verified };
}

console.log("🔍 Buscando portadas para los 21 Maigret...\n");

const results = [];
for (const title of TITLES) {
  process.stdout.write(`  ${title.padEnd(45, ".")} `);
  const r = await scout(title);
  results.push(r);
  if (r.verified.length > 0) {
    console.log(`✓ ${r.verified.length} portada(s)`);
  } else if (r.total > 0) {
    console.log(`~ ${r.total} resultado(s) sin portada`);
  } else {
    console.log("✗ sin resultados");
  }
  await new Promise((r) => setTimeout(r, 250));
}

console.log("\n\n=== DETALLE ===\n");
for (const r of results) {
  console.log(`\n📘 ${r.title}`);
  if (r.verified.length === 0) {
    console.log("   (sin portadas verificadas)");
    continue;
  }
  for (const v of r.verified) {
    console.log(`   [${v.source}] ${v.title}`);
    console.log(`      editorial: ${v.publisher ?? "?"}  año: ${v.year ?? "?"}  isbn: ${v.isbn ?? "?"}`);
    console.log(`      ${v.thumb}`);
  }
}

const ok = results.filter((r) => r.verified.length > 0).length;
console.log(`\n\n--- Resumen ---`);
console.log(`Con portada verificada: ${ok}/${TITLES.length}`);
console.log(`Sin portada: ${TITLES.length - ok}`);
