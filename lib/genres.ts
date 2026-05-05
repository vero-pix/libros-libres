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
  // Escolar
  'escolar-basica-1-6': 'Básica 1°–6°',
  'escolar-basica-7-8': 'Básica 7°–8°',
  'escolar-media': 'Media 1°–4°',
  'escolar-matematicas': 'Matemáticas',
  'escolar-lenguaje': 'Lenguaje y Literatura',
  'escolar-historia': 'Historia y Geografía',
  'escolar-ciencias': 'Ciencias',
  'escolar-ingles': 'Inglés',
  // Lectura Complementaria
  'lectura-complementaria-mineduc': 'Lista MINEDUC',
  'lectura-complementaria-infantil': 'Literatura Infantil',
  'lectura-complementaria-juvenil': 'Literatura Juvenil',
  // Superior
  'universitario-derecho': 'Derecho',
  'universitario-ingenieria': 'Ingeniería',
  'universitario-medicina': 'Medicina y Salud',
  'universitario-administracion': 'Administración y Economía',
  'universitario-psicologia': 'Psicología',
  'universitario-arquitectura': 'Arquitectura y Diseño',
  'universitario-otros': 'Otras carreras',
  'tecnico-cft-administracion': 'Administración',
  'tecnico-cft-salud': 'Salud',
  'tecnico-cft-tecnologia': 'Tecnología',
  'tecnico-cft-gastronomia': 'Gastronomía',
  // General / Adulto (Literario)
  'general-adulto-novela': 'Novela y Ficción',
  'general-adulto-ensayo': 'Ensayo y No Ficción',
  'general-adulto-historia': 'Historia',
  'general-adulto-autoayuda': 'Autoayuda',
  'general-adulto-ciencia': 'Ciencia y Divulgación',
  'general-adulto-arte': 'Arte y Fotografía',
  'general-adulto-poesia': 'Poesía',
  'general-adulto-policial': 'Novela Policial / Suspenso',
  'general-adulto-biografia': 'Biografías y Memorias',
  'general-adulto-teatro': 'Teatro y Dramaturgia',
  'general-adulto-humanidades': 'Humanidades y Soc.',
  'general-adulto-espiritualidad': 'Religión y Espiritualidad',
  'general-adulto-infantil-juvenil': 'Infantil y Juvenil',
  // Idiomas
  'idiomas-ingles': 'Inglés',
  'idiomas-frances': 'Francés',
  'idiomas-aleman': 'Alemán',
  'idiomas-portugues': 'Portugués',
  'idiomas-otros': 'Otros idiomas',
  // Otros
  'otros-revistas': 'Revistas',
  'otros-comics': 'Cómics y Manga',
  'otros-enciclopedias': 'Enciclopedias y Diccionarios',
};

/** Traduce un slug de categoría a nombre legible */
export function translateGenre(slug: string | null | undefined): string {
  if (!slug) return '';
  return CATEGORY_NAMES[slug] ?? slug;
}

/** Agrupación para menús y filtros */
export const CATEGORY_GROUPS = [
  {
    label: "Escolar",
    genres: ["escolar-basica-1-6", "escolar-basica-7-8", "escolar-media", "escolar-matematicas", "escolar-lenguaje", "escolar-historia", "escolar-ciencias", "escolar-ingles"],
  },
  {
    label: "Lectura Complementaria",
    genres: ["lectura-complementaria-mineduc", "lectura-complementaria-infantil", "lectura-complementaria-juvenil"],
  },
  {
    label: "Superior / Técnico",
    genres: ["universitario-derecho", "universitario-ingenieria", "universitario-medicina", "universitario-administracion", "universitario-psicologia", "tecnico-cft-administracion", "tecnico-cft-salud"],
  },
  {
    label: "Literatura y Otros",
    genres: ["general-adulto-novela", "general-adulto-policial", "general-adulto-poesia", "general-adulto-ensayo", "general-adulto-biografia", "general-adulto-historia", "general-adulto-arte", "general-adulto-autoayuda", "general-adulto-espiritualidad", "general-adulto-teatro", "otros-comics"],
  },
  {
    label: "Idiomas",
    genres: ["idiomas-ingles", "idiomas-frances", "idiomas-aleman", "idiomas-portugues"],
  },
];
