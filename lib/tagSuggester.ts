/**
 * Sugiere tags controlados para un libro basado en sus datos.
 * Máximo 8 tags. Solo tags del set definido.
 */

const CLASSIC_AUTHORS = new Set([
  "kafka", "tolstoi", "dostoyevski", "dostoievski", "dostoevsky",
  "shakespeare", "neruda", "garcia marquez", "marquez", "cortazar",
  "borges", "cervantes", "homer", "homero", "dante", "virgilio",
  "dickens", "austen", "wilde", "poe", "twain", "melville",
  "flaubert", "balzac", "zola", "proust", "joyce", "woolf",
  "hemingway", "faulkner", "steinbeck", "orwell", "huxley",
  "camus", "sartre", "beckett", "mann", "hesse", "rilke",
  "mistral", "vallejo", "carpentier", "rulfo", "fuentes",
  "vargas llosa", "allende", "donoso", "bolano", "onetti",
  "quiroga", "arlt", "sabato", "bioy casares", "benedetti",
  "galeano", "lispector", "amado", "asturias", "roa bastos",
  "garcia lorca", "machado", "unamuno", "pessoa",
  "tolstoy", "chekhov", "chejov", "pushkin", "gogol",
  "durrenmatt", "meyrink", "hamsun", "strindberg",
]);

// Tags controlados
const VALID_TAGS = new Set([
  "BibliotecaDeBabel", "Borges", "Clasico", "Filosofia", "Cuentos",
  "Coleccionable", "PrimeraEdicion", "EdicionLimitada", "NovelaChilena",
  "LatinoamericanoEsencial", "PremioNobel", "Poesia", "Teatro",
  "CienciaFiccion", "NovelaNegra", "NovelaHistorica", "Ensayo",
  "Autoayuda", "Espiritualidad", "Historia", "Ciencia", "Arte",
  "Biografia", "Politica", "Negocios", "Infantil", "Juvenil",
  "Suspenso", "Humanidades", "Comics", "Novela y Ficción"
]);

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

interface BookInput {
  title: string;
  author?: string | null;
  category?: string | null;
  subcategory?: string | null;
  description?: string | null;
}

export function suggestTags(book: BookInput): string[] {
  const tags = new Set<string>();
  const title = norm(book.title);
  const author = norm(book.author ?? "");
  const desc = norm(book.description ?? "");
  const text = `${title} ${author} ${desc}`;

  // Biblioteca de Babel
  if (title.includes("babel") || text.includes("biblioteca de babel")) {
    tags.add("BibliotecaDeBabel");
    tags.add("Coleccionable");
  }

  // Borges
  if (author.includes("borges")) {
    tags.add("Borges");
    tags.add("Clasico");
  }

  // Clásico por autor
  const classicArr = Array.from(CLASSIC_AUTHORS);
  for (let i = 0; i < classicArr.length; i++) {
    if (author.includes(classicArr[i])) {
      tags.add("Clasico");
      break;
    }
  }

  // Por categoría
  if (book.category === "coleccionables") tags.add("Coleccionable");

  // Por subcategoría
  const sub = book.subcategory;
  if (sub === "ficcion-poesia") tags.add("Poesia");
  if (sub === "ficcion-policial") { tags.add("NovelaNegra"); tags.add("Suspenso"); }
  if (sub === "ficcion-teatro") tags.add("Teatro");
  if (sub === "no-ficcion-biografia") tags.add("Biografia");
  if (sub === "no-ficcion-historia") tags.add("Historia");
  if (sub === "ficcion-novela") tags.add("Novela y Ficción");
  if (sub === "no-ficcion-ensayo") tags.add("Ensayo");
  if (sub === "no-ficcion-humanidades") tags.add("Humanidades");
  if (sub === "infantil-juvenil-infantil") tags.add("Infantil");
  if (sub === "infantil-juvenil-juvenil") tags.add("Juvenil");
  if (sub === "otros-comics") tags.add("Comics");
  if (sub === "no-ficcion-autoayuda") tags.add("Autoayuda");
  if (sub === "no-ficcion-arte") tags.add("Arte");
  if (sub === "no-ficcion-ciencia") tags.add("Ciencia");
  if (sub === "otros-religion") tags.add("Espiritualidad");

  // Fallback por categoría cuando no hubo señal de subcategoría
  if (tags.size === 0) {
    if (book.category === "ficcion") tags.add("Novela y Ficción");
    if (book.category === "infantil-juvenil") tags.add("Infantil");
  }

  // Señales en texto
  if (text.includes("poesia") || text.includes("poema") || text.includes("versos")) tags.add("Poesia");
  if (text.includes("teatro") || text.includes("obra dramatica")) tags.add("Teatro");
  if (text.includes("premio nobel")) tags.add("PremioNobel");
  if (text.includes("suspenso") || text.includes("thriller") || text.includes("crimen")) tags.add("Suspenso");
  if (text.includes("misterio") || text.includes("detective") || text.includes("policial")) tags.add("NovelaNegra");

  // Filtrar solo tags válidos y limitar a 8
  return Array.from(tags).filter((t) => VALID_TAGS.has(t)).slice(0, 8);
}
