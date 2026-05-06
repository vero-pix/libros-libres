/**
 * genreNormalizer.ts
 *
 * Mapea géneros crudos (texto libre de APIs externas) a la taxonomía
 * interna de tuslibros.cl almacenada en la tabla `categories`.
 *
 * Convención de slugs:
 *   - Categoría raíz:   ficcion | no-ficcion | idiomas | infantil-juvenil | academico | otros
 *   - Subcategoría:     <raiz>-<nombre>  (ej: ficcion-novela, no-ficcion-historia)
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
  "ficcion":          { category: "ficcion", subcategory: "ficcion-novela" },
  "ficcion literaria":{ category: "ficcion", subcategory: "ficcion-novela" },
  "fiction":          { category: "ficcion", subcategory: "ficcion-novela" },
  "novela":           { category: "ficcion", subcategory: "ficcion-novela" },
  "novel":            { category: "ficcion", subcategory: "ficcion-novela" },
  "narrativa":        { category: "ficcion", subcategory: "ficcion-novela" },
  "thriller":         { category: "ficcion", subcategory: "ficcion-novela" },
  "misterio":         { category: "ficcion", subcategory: "ficcion-novela" },
  "mystery":          { category: "ficcion", subcategory: "ficcion-novela" },
  "terror":           { category: "ficcion", subcategory: "ficcion-novela" },
  "horror":           { category: "ficcion", subcategory: "ficcion-novela" },
  "fantasia":         { category: "ficcion", subcategory: "ficcion-novela" },
  "fantasy":          { category: "ficcion", subcategory: "ficcion-novela" },
  "ciencia ficcion":  { category: "ficcion", subcategory: "ficcion-novela" },
  "science fiction":  { category: "ficcion", subcategory: "ficcion-novela" },
  "sci-fi":           { category: "ficcion", subcategory: "ficcion-novela" },
  "romance":          { category: "ficcion", subcategory: "ficcion-novela" },
  "romantico":        { category: "ficcion", subcategory: "ficcion-novela" },
  "aventura":         { category: "ficcion", subcategory: "ficcion-novela" },
  "adventure":        { category: "ficcion", subcategory: "ficcion-novela" },
  "historica":        { category: "ficcion", subcategory: "ficcion-novela" },
  "historical fiction":{ category: "ficcion", subcategory: "ficcion-novela" },
  "policial":         { category: "ficcion", subcategory: "ficcion-policial" },
  "detective":        { category: "ficcion", subcategory: "ficcion-policial" },
  "crimen":           { category: "ficcion", subcategory: "ficcion-policial" },
  "drama":            { category: "ficcion", subcategory: "ficcion-novela" },
  "cuentos":          { category: "ficcion", subcategory: "ficcion-novela" },
  "relatos":          { category: "ficcion", subcategory: "ficcion-novela" },
  "short stories":    { category: "ficcion", subcategory: "ficcion-novela" },
  "mitologia":        { category: "ficcion", subcategory: "ficcion-novela" },
  "mitología":        { category: "ficcion", subcategory: "ficcion-novela" },
  "mythology":        { category: "ficcion", subcategory: "ficcion-novela" },
  "myths":            { category: "ficcion", subcategory: "ficcion-novela" },
  "mito":             { category: "ficcion", subcategory: "ficcion-novela" },
  "mitos":            { category: "ficcion", subcategory: "ficcion-novela" },
  "leyendas":         { category: "ficcion", subcategory: "ficcion-novela" },
  "legends":          { category: "ficcion", subcategory: "ficcion-novela" },
  "folklore":         { category: "ficcion", subcategory: "ficcion-novela" },

  // ── Poesía / Teatro ──────────────────────────────────────────────────────
  "poesia":           { category: "ficcion", subcategory: "ficcion-poesia" },
  "poesía":           { category: "ficcion", subcategory: "ficcion-poesia" },
  "poetry":           { category: "ficcion", subcategory: "ficcion-poesia" },
  "teatro":           { category: "ficcion", subcategory: "ficcion-teatro" },
  "drama teatral":    { category: "ficcion", subcategory: "ficcion-teatro" },
  "play":             { category: "ficcion", subcategory: "ficcion-teatro" },
  "plays":            { category: "ficcion", subcategory: "ficcion-teatro" },

  // ── No ficción: Ensayo / Filosofía / Humanidades ────────────────────────
  "humanidades":      { category: "no-ficcion", subcategory: "no-ficcion-humanidades" },
  "humanities":       { category: "no-ficcion", subcategory: "no-ficcion-humanidades" },

  // ── No ficción: Ensayo / Filosofía / Política ───────────────────────────
  "no ficcion":       { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "no ficción":       { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "nonfiction":       { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "ensayo":           { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "essay":            { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "filosofia":        { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "filosofía":        { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "philosophy":       { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "politica":         { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "política":         { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "politics":         { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "sociologia":       { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "sociology":        { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "biografia":        { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "biografía":        { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "biography":        { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "memorias":         { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },
  "memoir":           { category: "no-ficcion", subcategory: "no-ficcion-ensayo" },

  // ── Historia ────────────────────────────────────────────────────────────
  "historia":         { category: "no-ficcion", subcategory: "no-ficcion-historia" },
  "history":          { category: "no-ficcion", subcategory: "no-ficcion-historia" },
  "historia de chile":{ category: "no-ficcion", subcategory: "no-ficcion-historia" },
  "historia universal":{ category: "no-ficcion", subcategory: "no-ficcion-historia" },

  // ── Autoayuda ───────────────────────────────────────────────────────────
  "autoayuda":        { category: "no-ficcion", subcategory: "no-ficcion-autoayuda" },
  "self-help":        { category: "no-ficcion", subcategory: "no-ficcion-autoayuda" },
  "desarrollo personal":{ category: "no-ficcion", subcategory: "no-ficcion-autoayuda" },
  "liderazgo":        { category: "no-ficcion", subcategory: "no-ficcion-autoayuda" },
  "motivacion":       { category: "no-ficcion", subcategory: "no-ficcion-autoayuda" },
  "cocina":           { category: "no-ficcion", subcategory: "no-ficcion-autoayuda" },
  "cooking":          { category: "no-ficcion", subcategory: "no-ficcion-autoayuda" },
  "recetas":          { category: "no-ficcion", subcategory: "no-ficcion-autoayuda" },
  "salud y bienestar":{ category: "no-ficcion", subcategory: "no-ficcion-autoayuda" },
  "wellness":         { category: "no-ficcion", subcategory: "no-ficcion-autoayuda" },

  // ── Ciencia y Divulgación ───────────────────────────────────────────────
  "ciencia":          { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "science":          { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "divulgacion":      { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "divulgación":      { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "tecnologia":       { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "technology":       { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "matematicas":      { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "mathematics":      { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "fisica":           { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "physics":          { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "quimica":          { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "chemistry":        { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "biologia":         { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "biology":          { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "naturaleza":       { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },
  "nature":           { category: "no-ficcion", subcategory: "no-ficcion-ciencia" },

  // ── Arte y Fotografía ───────────────────────────────────────────────────
  "arte":             { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "art":              { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "fotografia":       { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "photography":      { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "cine":             { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "cinema":           { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "cine y fotografia":{ category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "musica":           { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "music":            { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "arquitectura":     { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "architecture":     { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "diseno":           { category: "no-ficcion", subcategory: "no-ficcion-arte" },
  "design":           { category: "no-ficcion", subcategory: "no-ficcion-arte" },

  // ── Académico / Profesional ─────────────────────────────────────────────
  "derecho":          { category: "academico", subcategory: "academico-universitario" },
  "law":              { category: "academico", subcategory: "academico-universitario" },
  "juridico":         { category: "academico", subcategory: "academico-universitario" },
  "ingenieria":       { category: "academico", subcategory: "academico-universitario" },
  "engineering":      { category: "academico", subcategory: "academico-universitario" },
  "medicina":         { category: "academico", subcategory: "academico-universitario" },
  "medical":          { category: "academico", subcategory: "academico-universitario" },
  "enfermeria":       { category: "academico", subcategory: "academico-universitario" },
  "nursing":          { category: "academico", subcategory: "academico-universitario" },
  "administracion":   { category: "academico", subcategory: "academico-universitario" },
  "business":         { category: "academico", subcategory: "academico-universitario" },
  "negocios":         { category: "academico", subcategory: "academico-universitario" },
  "economia":         { category: "academico", subcategory: "academico-universitario" },
  "economics":        { category: "academico", subcategory: "academico-universitario" },
  "contabilidad":     { category: "academico", subcategory: "academico-universitario" },
  "psicologia":       { category: "academico", subcategory: "academico-universitario" },
  "psychology":       { category: "academico", subcategory: "academico-universitario" },

  // ── Lectura Complementaria ──────────────────────────────────────────────
  "literatura infantil":  { category: "infantil-juvenil", subcategory: "infantil-juvenil-infantil" },
  "children":             { category: "infantil-juvenil", subcategory: "infantil-juvenil-infantil" },
  "children's":           { category: "infantil-juvenil", subcategory: "infantil-juvenil-infantil" },
  "cuentos infantiles":   { category: "infantil-juvenil", subcategory: "infantil-juvenil-infantil" },
  "picture book":         { category: "infantil-juvenil", subcategory: "infantil-juvenil-infantil" },
  "literatura juvenil":   { category: "infantil-juvenil", subcategory: "infantil-juvenil-juvenil" },
  "young adult":          { category: "infantil-juvenil", subcategory: "infantil-juvenil-juvenil" },
  "ya":                   { category: "infantil-juvenil", subcategory: "infantil-juvenil-juvenil" },
  "juvenil":              { category: "infantil-juvenil", subcategory: "infantil-juvenil-juvenil" },

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
    return { category: "academico", subcategory: "academico-escolar" };
  if (t.match(/\b(7|8)°?\s*(basico|basica)\b/))
    return { category: "academico", subcategory: "academico-escolar" };
  if (t.match(/\b(1|2|3|4)°?\s*(medio|media)\b/))
    return { category: "academico", subcategory: "academico-escolar" };
  // Asignaturas comunes
  if (t.includes("lenguaje") && (t.includes("basico") || t.includes("medio")))
    return { category: "academico", subcategory: "academico-escolar" };
  if (t.includes("matematica") && (t.includes("basico") || t.includes("medio")))
    return { category: "academico", subcategory: "academico-escolar" };
  if (t.includes("historia") && (t.includes("basico") || t.includes("medio")))
    return { category: "academico", subcategory: "academico-escolar" };
  if (t.includes("ciencias") && (t.includes("basico") || t.includes("medio")))
    return { category: "academico", subcategory: "academico-escolar" };
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
      return { category: "no-ficcion", subcategory: "no-ficcion-historia" };
    if (t.includes("biografia") || t.includes("memorias de"))
      return { category: "no-ficcion", subcategory: "no-ficcion-ensayo" };
    if (t.includes("cocina") || t.includes("recetas"))
      return { category: "no-ficcion", subcategory: "no-ficcion-autoayuda" };
    if (t.includes("cuentos") || t.includes("relatos"))
      return { category: "ficcion", subcategory: "ficcion-novela" };
    if (t.includes("poesia") || t.includes("poemas"))
      return { category: "ficcion", subcategory: "ficcion-poesia" };
    if (t.includes("novela") || t.includes("ficcion"))
      return { category: "ficcion", subcategory: "ficcion-novela" };
    if (t.includes("filosofia") || t.includes("etica"))
      return { category: "no-ficcion", subcategory: "no-ficcion-ensayo" };
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
      return { category: "ficcion", subcategory: "ficcion-novela" };
    }
    if (key.includes("self") && key.includes("help")) {
      return { category: "no-ficcion", subcategory: "no-ficcion-autoayuda" };
    }
    if (key.includes("juvenile") || key.includes("young")) {
      return { category: "infantil-juvenil", subcategory: "infantil-juvenil-juvenil" };
    }
    if (key.includes("child")) {
      return { category: "infantil-juvenil", subcategory: "infantil-juvenil-infantil" };
    }
  }

  // Sin señales claras → no asignamos
  return null;
}
