/**
 * Genera un slug URL-friendly desde un texto.
 * Ej: "Cien años de soledad" → "cien-anos-de-soledad"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
