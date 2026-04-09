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
  if (sub === "filosofia") tags.add("Filosofia");
  if (sub === "cuentos") tags.add("Cuentos");
  if (sub === "primeras-ediciones") { tags.add("PrimeraEdicion"); tags.add("Coleccionable"); }
  if (sub === "ediciones-especiales") { tags.add("EdicionLimitada"); tags.add("Coleccionable"); }
  if (sub === "biblioteca-de-babel") { tags.add("BibliotecaDeBabel"); tags.add("Coleccionable"); }
  if (sub === "novela-negra") tags.add("NovelaNegra");
  if (sub === "novela-historica") tags.add("NovelaHistorica");
  if (sub === "ciencia-ficcion") tags.add("CienciaFiccion");
  if (sub === "ensayo") tags.add("Ensayo");
  if (sub === "autoayuda") tags.add("Autoayuda");
  if (sub === "espiritualidad") tags.add("Espiritualidad");
  if (sub === "historia") tags.add("Historia");
  if (sub === "ciencia") tags.add("Ciencia");
  if (sub === "arte") tags.add("Arte");
  if (sub === "biografia") tags.add("Biografia");
  if (sub === "politica") tags.add("Politica");
  if (sub === "negocios") tags.add("Negocios");
  if (sub === "infantil") tags.add("Infantil");
  if (sub === "juvenil") tags.add("Juvenil");
  if (sub === "clasicos") tags.add("Clasico");

  // Señales en texto
  if (text.includes("poesia") || text.includes("poema") || text.includes("versos")) tags.add("Poesia");
  if (text.includes("teatro") || text.includes("obra dramatica")) tags.add("Teatro");
  if (text.includes("premio nobel")) tags.add("PremioNobel");

  // Filtrar solo tags válidos y limitar a 8
  return Array.from(tags).filter((t) => VALID_TAGS.has(t)).slice(0, 8);
}
