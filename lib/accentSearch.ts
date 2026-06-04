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
