/**
 * genreNormalizer.ts
 *
 * Mapea géneros crudos (texto libre de APIs externas) a la taxonomía
 * interna de tuslibros.cl almacenada en la tabla `categories`.
 *
 * Convención de slugs:
 *   - Categoría raíz:   escolar | lectura-complementaria | universitario |
 *                       tecnico-cft | general-adulto | idiomas | otros
 *   - Subcategoría:     <raiz>-<nombre>  (ej: escolar-matematicas)
 *
 * Prioridad de resolución:
 *   1. Señales de libro escolar/universitario en título
 *   2. Match exacto en GENRE_MAP por género normalizado
 *   3. Match parcial en GENRE_MAP
 *   4. Señales en el título
 *   5. Señales LCSH u otros formatos raros en el género raw
 */

export interface NormalizedGenre {
  category: string;
  subcategory: string | null;
}

/** Map de géneros raw normalizados → { category, subcategory } */
const GENRE_MAP: Record<string, NormalizedGenre> = {

  // ── Ficción adulta ──────────────────────────────────────────────────────
  "ficcion":          { category: "general-adulto", subcategory: "general-adulto-novela" },
  "ficcion literaria":{ category: "general-adulto", subcategory: "general-adulto-novela" },
  "fiction":          { category: "general-adulto", subcategory: "general-adulto-novela" },
  "novela":           { category: "general-adulto", subcategory: "general-adulto-novela" },
  "novel":            { category: "general-adulto", subcategory: "general-adulto-novela" },
  "narrativa":        { category: "general-adulto", subcategory: "general-adulto-novela" },
  "thriller":         { category: "general-adulto", subcategory: "general-adulto-novela" },
  "misterio":         { category: "general-adulto", subcategory: "general-adulto-novela" },
  "mystery":          { category: "general-adulto", subcategory: "general-adulto-novela" },
  "terror":           { category: "general-adulto", subcategory: "general-adulto-novela" },
  "horror":           { category: "general-adulto", subcategory: "general-adulto-novela" },
  "fantasia":         { category: "general-adulto", subcategory: "general-adulto-novela" },
  "fantasy":          { category: "general-adulto", subcategory: "general-adulto-novela" },
  "ciencia ficcion":  { category: "general-adulto", subcategory: "general-adulto-novela" },
  "science fiction":  { category: "general-adulto", subcategory: "general-adulto-novela" },
  "sci-fi":           { category: "general-adulto", subcategory: "general-adulto-novela" },
  "romance":          { category: "general-adulto", subcategory: "general-adulto-novela" },
  "romantico":        { category: "general-adulto", subcategory: "general-adulto-novela" },
  "aventura":         { category: "general-adulto", subcategory: "general-adulto-novela" },
  "adventure":        { category: "general-adulto", subcategory: "general-adulto-novela" },
  "historica":        { category: "general-adulto", subcategory: "general-adulto-novela" },
  "historical fiction":{ category: "general-adulto", subcategory: "general-adulto-novela" },
  "policial":         { category: "general-adulto", subcategory: "general-adulto-novela-negra" },
  "detective":        { category: "general-adulto", subcategory: "general-adulto-novela-negra" },
  "crimen":           { category: "general-adulto", subcategory: "general-adulto-novela-negra" },
  "drama":            { category: "general-adulto", subcategory: "general-adulto-novela" },
  "cuentos":          { category: "general-adulto", subcategory: "general-adulto-novela" },
  "relatos":          { category: "general-adulto", subcategory: "general-adulto-novela" },
  "short stories":    { category: "general-adulto", subcategory: "general-adulto-novela" },
  "mitologia":        { category: "general-adulto", subcategory: "general-adulto-novela" },
  "mitología":        { category: "general-adulto", subcategory: "general-adulto-novela" },
  "mythology":        { category: "general-adulto", subcategory: "general-adulto-novela" },
  "myths":            { category: "general-adulto", subcategory: "general-adulto-novela" },
  "mito":             { category: "general-adulto", subcategory: "general-adulto-novela" },
  "mitos":            { category: "general-adulto", subcategory: "general-adulto-novela" },
  "leyendas":         { category: "general-adulto", subcategory: "general-adulto-novela" },
  "legends":          { category: "general-adulto", subcategory: "general-adulto-novela" },
  "folklore":         { category: "general-adulto", subcategory: "general-adulto-novela" },

  // ── Poesía / Teatro ──────────────────────────────────────────────────────
  "poesia":           { category: "general-adulto", subcategory: "general-adulto-poesia" },
  "poesía":           { category: "general-adulto", subcategory: "general-adulto-poesia" },
  "poetry":           { category: "general-adulto", subcategory: "general-adulto-poesia" },
  "teatro":           { category: "general-adulto", subcategory: "general-adulto-teatro" },
  "drama teatral":    { category: "general-adulto", subcategory: "general-adulto-teatro" },
  "play":             { category: "general-adulto", subcategory: "general-adulto-teatro" },
  "plays":            { category: "general-adulto", subcategory: "general-adulto-teatro" },

  // ── No ficción: Ensayo / Filosofía / Humanidades ────────────────────────
  "humanidades":      { category: "general-adulto", subcategory: "general-adulto-humanidades" },
  "humanities":       { category: "general-adulto", subcategory: "general-adulto-humanidades" },

  // ── No ficción: Ensayo / Filosofía / Política ───────────────────────────
  "no ficcion":       { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "no ficción":       { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "nonfiction":       { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "ensayo":           { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "essay":            { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "filosofia":        { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "filosofía":        { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "philosophy":       { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "politica":         { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "política":         { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "politics":         { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "sociologia":       { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "sociology":        { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "biografia":        { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "biografía":        { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "biography":        { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "memorias":         { category: "general-adulto", subcategory: "general-adulto-ensayo" },
  "memoir":           { category: "general-adulto", subcategory: "general-adulto-ensayo" },

  // ── Historia ────────────────────────────────────────────────────────────
  "historia":         { category: "general-adulto", subcategory: "general-adulto-historia" },
  "history":          { category: "general-adulto", subcategory: "general-adulto-historia" },
  "historia de chile":{ category: "general-adulto", subcategory: "general-adulto-historia" },
  "historia universal":{ category: "general-adulto", subcategory: "general-adulto-historia" },

  // ── Autoayuda ───────────────────────────────────────────────────────────
  "autoayuda":        { category: "general-adulto", subcategory: "general-adulto-autoayuda" },
  "self-help":        { category: "general-adulto", subcategory: "general-adulto-autoayuda" },
  "desarrollo personal":{ category: "general-adulto", subcategory: "general-adulto-autoayuda" },
  "liderazgo":        { category: "general-adulto", subcategory: "general-adulto-autoayuda" },
  "motivacion":       { category: "general-adulto", subcategory: "general-adulto-autoayuda" },
  "cocina":           { category: "general-adulto", subcategory: "general-adulto-autoayuda" },
  "cooking":          { category: "general-adulto", subcategory: "general-adulto-autoayuda" },
  "recetas":          { category: "general-adulto", subcategory: "general-adulto-autoayuda" },
  "salud y bienestar":{ category: "general-adulto", subcategory: "general-adulto-autoayuda" },
  "wellness":         { category: "general-adulto", subcategory: "general-adulto-autoayuda" },

  // ── Ciencia y Divulgación ───────────────────────────────────────────────
  "ciencia":          { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "science":          { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "divulgacion":      { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "divulgación":      { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "tecnologia":       { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "technology":       { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "matematicas":      { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "mathematics":      { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "fisica":           { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "physics":          { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "quimica":          { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "chemistry":        { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "biologia":         { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "biology":          { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "naturaleza":       { category: "general-adulto", subcategory: "general-adulto-ciencia" },
  "nature":           { category: "general-adulto", subcategory: "general-adulto-ciencia" },

  // ── Arte y Fotografía ───────────────────────────────────────────────────
  "arte":             { category: "general-adulto", subcategory: "general-adulto-arte" },
  "art":              { category: "general-adulto", subcategory: "general-adulto-arte" },
  "fotografia":       { category: "general-adulto", subcategory: "general-adulto-arte" },
  "photography":      { category: "general-adulto", subcategory: "general-adulto-arte" },
  "cine":             { category: "general-adulto", subcategory: "general-adulto-arte" },
  "cinema":           { category: "general-adulto", subcategory: "general-adulto-arte" },
  "cine y fotografia":{ category: "general-adulto", subcategory: "general-adulto-arte" },
  "musica":           { category: "general-adulto", subcategory: "general-adulto-arte" },
  "music":            { category: "general-adulto", subcategory: "general-adulto-arte" },
  "arquitectura":     { category: "general-adulto", subcategory: "general-adulto-arte" },
  "architecture":     { category: "general-adulto", subcategory: "general-adulto-arte" },
  "diseno":           { category: "general-adulto", subcategory: "general-adulto-arte" },
  "design":           { category: "general-adulto", subcategory: "general-adulto-arte" },

  // ── Universitario / Profesional ─────────────────────────────────────────
  "derecho":          { category: "universitario", subcategory: "universitario-derecho" },
  "law":              { category: "universitario", subcategory: "universitario-derecho" },
  "juridico":         { category: "universitario", subcategory: "universitario-derecho" },
  "ingenieria":       { category: "universitario", subcategory: "universitario-ingenieria" },
  "engineering":      { category: "universitario", subcategory: "universitario-ingenieria" },
  "medicina":         { category: "universitario", subcategory: "universitario-medicina" },
  "medical":          { category: "universitario", subcategory: "universitario-medicina" },
  "enfermeria":       { category: "universitario", subcategory: "universitario-medicina" },
  "nursing":          { category: "universitario", subcategory: "universitario-medicina" },
  "administracion":   { category: "universitario", subcategory: "universitario-administracion" },
  "business":         { category: "universitario", subcategory: "universitario-administracion" },
  "negocios":         { category: "universitario", subcategory: "universitario-administracion" },
  "economia":         { category: "universitario", subcategory: "universitario-administracion" },
  "economics":        { category: "universitario", subcategory: "universitario-administracion" },
  "contabilidad":     { category: "universitario", subcategory: "universitario-administracion" },
  "psicologia":       { category: "universitario", subcategory: "universitario-psicologia" },
  "psychology":       { category: "universitario", subcategory: "universitario-psicologia" },

  // ── Lectura Complementaria ──────────────────────────────────────────────
  "literatura infantil":  { category: "lectura-complementaria", subcategory: "lectura-complementaria-infantil" },
  "children":             { category: "lectura-complementaria", subcategory: "lectura-complementaria-infantil" },
  "children's":           { category: "lectura-complementaria", subcategory: "lectura-complementaria-infantil" },
  "cuentos infantiles":   { category: "lectura-complementaria", subcategory: "lectura-complementaria-infantil" },
  "picture book":         { category: "lectura-complementaria", subcategory: "lectura-complementaria-infantil" },
  "literatura juvenil":   { category: "lectura-complementaria", subcategory: "lectura-complementaria-juvenil" },
  "young adult":          { category: "lectura-complementaria", subcategory: "lectura-complementaria-juvenil" },
  "ya":                   { category: "lectura-complementaria", subcategory: "lectura-complementaria-juvenil" },
  "juvenil":              { category: "lectura-complementaria", subcategory: "lectura-complementaria-juvenil" },

  // ── Idiomas ─────────────────────────────────────────────────────────────
  "ingles":           { category: "idiomas", subcategory: "idiomas-ingles" },
  "inglés":           { category: "idiomas", subcategory: "idiomas-ingles" },
  "english":          { category: "idiomas", subcategory: "idiomas-ingles" },
  "efl":              { category: "idiomas", subcategory: "idiomas-ingles" },
  "esl":              { category: "idiomas", subcategory: "idiomas-ingles" },
  "frances":          { category: "idiomas", subcategory: "idiomas-frances" },
  "francés":          { category: "idiomas", subcategory: "idiomas-frances" },
  "french":           { category: "idiomas", subcategory: "idiomas-frances" },
  "aleman":           { category: "idiomas", subcategory: "idiomas-aleman" },
  "alemán":           { category: "idiomas", subcategory: "idiomas-aleman" },
  "german":           { category: "idiomas", subcategory: "idiomas-aleman" },
  "portugues":        { category: "idiomas", subcategory: "idiomas-portugues" },
  "português":        { category: "idiomas", subcategory: "idiomas-portugues" },
  "portuguese":       { category: "idiomas", subcategory: "idiomas-portugues" },
  "idiomas":          { category: "idiomas", subcategory: null },
  "language":         { category: "idiomas", subcategory: null },
  "languages":        { category: "idiomas", subcategory: null },

  // ── Cómics ──────────────────────────────────────────────────────────────
  "comic":            { category: "otros", subcategory: "otros-comics" },
  "comics":           { category: "otros", subcategory: "otros-comics" },
  "manga":            { category: "otros", subcategory: "otros-comics" },
  "graphic novel":    { category: "otros", subcategory: "otros-comics" },
  "novela grafica":   { category: "otros", subcategory: "otros-comics" },

  // ── Enciclopedias / Diccionarios ────────────────────────────────────────
  "enciclopedia":     { category: "otros", subcategory: "otros-enciclopedias" },
  "encyclopedia":     { category: "otros", subcategory: "otros-enciclopedias" },
  "diccionario":      { category: "otros", subcategory: "otros-enciclopedias" },
  "dictionary":       { category: "otros", subcategory: "otros-enciclopedias" },
  "atlas":            { category: "otros", subcategory: "otros-enciclopedias" },

  // ── Religión / Espiritualidad ────────────────────────────────────────────
  "religion":         { category: "otros", subcategory: "otros-religion" },
  "religión":         { category: "otros", subcategory: "otros-religion" },
  "espiritualidad":   { category: "otros", subcategory: "otros-religion" },
  "spirituality":     { category: "otros", subcategory: "otros-religion" },
  "esoterismo":       { category: "otros", subcategory: "otros-religion" },
  "esoteric":         { category: "otros", subcategory: "otros-religion" },
  "ocultismo":        { category: "otros", subcategory: "otros-religion" },
  "occult":           { category: "otros", subcategory: "otros-religion" },
  "tarot":            { category: "otros", subcategory: "otros-religion" },
  "astrologia":       { category: "otros", subcategory: "otros-religion" },
  "astrology":        { category: "otros", subcategory: "otros-religion" },
  "masoneria":        { category: "otros", subcategory: "otros-religion" },
  "magia":            { category: "otros", subcategory: "otros-religion" },
  "metafisica":       { category: "otros", subcategory: "otros-religion" },
  "teologia":         { category: "otros", subcategory: "otros-religion" },
  "theology":         { category: "otros", subcategory: "otros-religion" },
  "biblia":           { category: "otros", subcategory: "otros-religion" },

  // ── Revistas ────────────────────────────────────────────────────────────
  "revista":          { category: "otros", subcategory: "otros-revistas" },
  "magazine":         { category: "otros", subcategory: "otros-revistas" },
};

/** Normaliza un string: minúsculas, sin tildes, sin espacios extras. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Detecta señales de libro escolar en el título.
 * Muy común en tuslibros.cl — los vendedores suben libros
 * de texto sin poner género, pero el título lo delata.
 */
function detectEscolar(title: string): NormalizedGenre | null {
  const t = normalize(title);
  // Patrones de nivel escolar
  if (t.match(/\b(1|2|3|4|5|6|7|8)°?\s*(basico|basica|b[áa]sico)\b/))
    return { category: "escolar", subcategory: "escolar-basica-1-6" };
  if (t.match(/\b(7|8)°?\s*(basico|basica)\b/))
    return { category: "escolar", subcategory: "escolar-basica-7-8" };
  if (t.match(/\b(1|2|3|4)°?\s*(medio|media)\b/))
    return { category: "escolar", subcategory: "escolar-media" };
  // Asignaturas comunes
  if (t.includes("lenguaje") && (t.includes("basico") || t.includes("medio")))
    return { category: "escolar", subcategory: "escolar-lenguaje" };
  if (t.includes("matematica") && (t.includes("basico") || t.includes("medio")))
    return { category: "escolar", subcategory: "escolar-matematicas" };
  if (t.includes("historia") && (t.includes("basico") || t.includes("medio")))
    return { category: "escolar", subcategory: "escolar-historia" };
  if (t.includes("ciencias") && (t.includes("basico") || t.includes("medio")))
    return { category: "escolar", subcategory: "escolar-ciencias" };
  return null;
}

/**
 * Normaliza un género raw a { category, subcategory }.
 *
 * Prioridad:
 *   1. Señales de libro escolar en el título (muy frecuente en Chile)
 *   2. Match exacto en GENRE_MAP
 *   3. Match parcial (substring) en GENRE_MAP
 *   4. Señales en el título (palabras clave)
 *   5. Señales LCSH y formatos raros en el género raw
 *
 * Retorna null si no hay certeza — mejor no asignar que asignar basura.
 */
export function normalizeGenre(
  rawGenre?: string | null,
  title?: string,
  description?: string | null,
): NormalizedGenre | null {
  // Suprimir advertencia de parámetro no usado — description se reserva
  // para futura clasificación semántica
  void description;

  const genre = rawGenre || "";

  // Prioridad 1: señales de libro escolar en el título
  if (title) {
    const escolar = detectEscolar(title);
    if (escolar) return escolar;
  }

  // Prioridad 2: match exacto en el mapa
  if (genre) {
    const key = normalize(genre);
    if (GENRE_MAP[key]) return GENRE_MAP[key];

    // Prioridad 3: match parcial
    for (const [mapKey, value] of Object.entries(GENRE_MAP)) {
      if (key.includes(mapKey) || mapKey.includes(key)) {
        return value;
      }
    }
  }

  // Prioridad 4: señales en el título
  if (title) {
    const t = normalize(title);
    if (t.includes("historia de") || t.includes("breve historia"))
      return { category: "general-adulto", subcategory: "general-adulto-historia" };
    if (t.includes("biografia") || t.includes("memorias de"))
      return { category: "general-adulto", subcategory: "general-adulto-ensayo" };
    if (t.includes("cocina") || t.includes("recetas"))
      return { category: "general-adulto", subcategory: "general-adulto-autoayuda" };
    if (t.includes("cuentos") || t.includes("relatos"))
      return { category: "general-adulto", subcategory: "general-adulto-novela" };
    if (t.includes("poesia") || t.includes("poemas"))
      return { category: "general-adulto", subcategory: "general-adulto-ensayo" };
    if (t.includes("novela") || t.includes("ficcion"))
      return { category: "general-adulto", subcategory: "general-adulto-novela" };
    if (t.includes("filosofia") || t.includes("etica"))
      return { category: "general-adulto", subcategory: "general-adulto-ensayo" };
    if (t.includes("diccionario") || t.includes("enciclopedia"))
      return { category: "otros", subcategory: "otros-enciclopedias" };
    if (t.includes("manga") || t.includes("comic"))
      return { category: "otros", subcategory: "otros-comics" };
    if (t.includes("ingles") || t.includes("english"))
      return { category: "idiomas", subcategory: "idiomas-ingles" };
  }

  // Prioridad 5: LCSH y formatos raros en el género raw
  if (genre) {
    const key = normalize(genre);
    if (
      key.includes("author") ||
      key.includes("literary") ||
      key.includes("romance") ||
      key.includes("suspense")
    ) {
      return { category: "general-adulto", subcategory: "general-adulto-novela" };
    }
    if (key.includes("self") && key.includes("help")) {
      return { category: "general-adulto", subcategory: "general-adulto-autoayuda" };
    }
    if (key.includes("juvenile") || key.includes("young")) {
      return { category: "lectura-complementaria", subcategory: "lectura-complementaria-juvenil" };
    }
    if (key.includes("child")) {
      return { category: "lectura-complementaria", subcategory: "lectura-complementaria-infantil" };
    }
  }

  // Sin señales claras → no asignamos
  return null;
}
