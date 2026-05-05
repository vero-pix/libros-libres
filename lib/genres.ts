/**
 * lib/genres.ts
 * Mapeo de categorías y traducciones para el marketplace.
 * Actualizado a la taxonomía chilena 2026.
 */

export const CATEGORY_NAMES: Record<string, string> = {
  'escolar': 'Escolar',
  'lectura-complementaria': 'Lectura Complementaria',
  'universitario': 'Universitario',
  'tecnico-cft': 'Técnico / CFT',
  'general-adulto': 'General / Adulto',
  'idiomas': 'Idiomas',
  'otros': 'Otros',
  // Subcategorías comunes
  'escolar-basica-1-6': 'Básica 1°–6°',
  'escolar-basica-7-8': 'Básica 7°–8°',
  'escolar-media': 'Media 1°–4°',
  'general-adulto-novela': 'Novela y Ficción',
  'general-adulto-ensayo': 'Ensayo y No Ficción',
};

/** Traduce un slug de categoría a nombre legible */
export function translateGenre(slug: string): string {
  return CATEGORY_NAMES[slug] ?? slug;
}

/** Agrupación para menús y filtros */
export const CATEGORY_GROUPS = [
  {
    label: "Escolar",
    genres: ["escolar-basica-1-6", "escolar-basica-7-8", "escolar-media", "escolar-matematicas", "escolar-lenguaje"],
  },
  {
    label: "Superior",
    genres: ["universitario-derecho", "universitario-ingenieria", "universitario-medicina", "tecnico-cft-administracion"],
  },
  {
    label: "Literatura y Otros",
    genres: ["general-adulto-novela", "general-adulto-ensayo", "lectura-complementaria-infantil", "otros-comics"],
  },
];
