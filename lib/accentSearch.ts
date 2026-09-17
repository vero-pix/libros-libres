/**
 * Búsqueda insensible a tildes/ñ sin tocar la BD.
 *
 * Postgres ILIKE distingue tildes ("alexandros" no encuentra "Aléxandros").
 * Esta función convierte el término en un patrón regex POSIX para el operador
 * `imatch` (~*), donde cada vocal se vuelve una clase que acepta la versión con
 * y sin tilde. Funciona en ambos sentidos (el usuario escriba con o sin tilde).
 *
 * Uso en supabase-js: .or(`title.imatch.${accentInsensitiveRegex(q)},author.imatch.${...}`)
 * imatch ya hace match por substring (regex sin anclar), así que no se usan % .
 */
const CLASSES: Record<string, string> = {
  a: "[aáàä]", e: "[eéèë]", i: "[iíìï]", o: "[oóòö]", u: "[uúùü]",
  n: "[nñ]", c: "[cç]",
};

/**
 * Versión client-side: "aplana" un texto quitándole tildes/ñ para comparar en JS
 * (p.ej. filtros `includes` sobre listings ya cargados, como el panel del vendedor).
 * "Inquisición" y "Inquisicion" colapsan al mismo string.
 */
export function foldAccents(input: string): string {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Palabras vacías del español. La búsqueda parte la consulta en términos y los
 * une con OR, así que un "de" suelto hace match por substring contra casi todo
 * el catálogo y entierra el resultado relevante. Se descartan al tokenizar.
 *
 * Ojo: solo para tokenizar. La frase completa se sigue buscando tal cual, así
 * que un título que de verdad se llame "El amor en los tiempos del cólera"
 * sigue calzando entero.
 */
export const SEARCH_STOPWORDS = new Set([
  "de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas",
  "y", "e", "o", "u", "en", "con", "por", "para", "al", "a",
  "su", "sus", "lo", "que", "se", "es",
]);

export function accentInsensitiveRegex(input: string): string {
  // Quitar diacríticos del término y pasar a minúscula → base "plana".
  // (ñ y vocales acentuadas quedan en su letra base; abajo se re-expanden.)
  const base = input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  let out = "";
  for (const ch of base) {
    if (CLASSES[ch]) {
      out += CLASSES[ch];
    } else {
      // Escapar metacaracteres regex para que el término del usuario sea literal.
      out += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return out;
}

/**
 * Limpia de la consulta los caracteres que rompen el parser de filtros de
 * PostgREST (`.or(...)`), donde la coma separa condiciones.
 *
 * Sin esto, buscar por una lista de autores —"Eugenio Ahumada, Javier Luis
 * Egaña, Augusto Gongora, Carmen Quesney"— hacía fallar la consulta entera con
 * "failed to parse logic tree" y el sitio devolvía CERO resultados, aunque
 * tuviera el libro. Alguien lo buscó así cinco veces entre el 29-08 y el
 * 16-09-2026, y las cinco veces se fue con las manos vacías teniendo el
 * catálogo cuatro ejemplares. (16-09-2026)
 *
 * Se quitan coma, punto y coma, dos puntos, comillas y paréntesis. El punto NO:
 * es parte de nombres reales ("J. B. Thomas") y no rompe el parser, que solo
 * mira los dos primeros para separar campo y operador.
 */
export function limpiarParaFiltro(input: string): string {
  return input.replace(/[(),;:"'`´“”‘’]+/g, " ").replace(/\s+/g, " ").trim();
}
