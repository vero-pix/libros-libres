/**
 * Normaliza un género raw (de Google Books, Open Library, o input manual)
 * a la taxonomía oficial de tuslibros.cl.
 */

interface NormalizedGenre {
  category: string;
  subcategory: string | null;
}

const GENRE_MAP: Record<string, NormalizedGenre> = {
  // Ficción genérica
  "ficción": { category: "ficcion", subcategory: "novela" },
  "ficcion": { category: "ficcion", subcategory: "novela" },
  "fiction": { category: "ficcion", subcategory: "novela" },
  "ficcion literaria": { category: "ficcion", subcategory: "novela" },
  "ficcion contemporanea": { category: "ficcion", subcategory: "novela" },
  "ficcion latinoamericana": { category: "ficcion", subcategory: "novela" },
  "narrativa chilena": { category: "ficcion", subcategory: "novela" },
  "ficcion clasica": { category: "ficcion", subcategory: "clasicos" },
  "ficcion fantastica": { category: "ficcion", subcategory: "fantasia" },
  "novela": { category: "ficcion", subcategory: "novela" },
  "novel": { category: "ficcion", subcategory: "novela" },

  // Novela negra / espionaje
  "novela negra": { category: "ficcion", subcategory: "novela-negra" },
  "novela de espionaje": { category: "ficcion", subcategory: "novela-negra" },
  "thriller": { category: "ficcion", subcategory: "novela-negra" },
  "mystery": { category: "ficcion", subcategory: "novela-negra" },
  "crime": { category: "ficcion", subcategory: "novela-negra" },

  // Novela histórica
  "novela historica": { category: "ficcion", subcategory: "novela-historica" },
  "ficcion historica": { category: "ficcion", subcategory: "novela-historica" },
  "historical fiction": { category: "ficcion", subcategory: "novela-historica" },

  // Ciencia ficción
  "ciencia ficcion": { category: "ficcion", subcategory: "ciencia-ficcion" },
  "science fiction": { category: "ficcion", subcategory: "ciencia-ficcion" },

  // Fantasía
  "fantasia": { category: "ficcion", subcategory: "fantasia" },
  "fantasy": { category: "ficcion", subcategory: "fantasia" },

  // Cuentos
  "cuentos": { category: "ficcion", subcategory: "cuentos" },
  "short stories": { category: "ficcion", subcategory: "cuentos" },

  // Mitología
  "mitologia": { category: "ficcion", subcategory: "mitologia" },
  "mitología": { category: "ficcion", subcategory: "mitologia" },
  "mythology": { category: "ficcion", subcategory: "mitologia" },
  "myths": { category: "ficcion", subcategory: "mitologia" },
  "mito": { category: "ficcion", subcategory: "mitologia" },
  "mitos": { category: "ficcion", subcategory: "mitologia" },
  "mitologia griega": { category: "ficcion", subcategory: "mitologia" },
  "mitologia nordica": { category: "ficcion", subcategory: "mitologia" },
  "mitologia romana": { category: "ficcion", subcategory: "mitologia" },
  "mitologia celta": { category: "ficcion", subcategory: "mitologia" },
  "leyendas": { category: "ficcion", subcategory: "mitologia" },
  "legends": { category: "ficcion", subcategory: "mitologia" },
  "folklore": { category: "ficcion", subcategory: "mitologia" },

  // No ficción
  "no ficción": { category: "no-ficcion", subcategory: "ensayo" },
  "no ficcion": { category: "no-ficcion", subcategory: "ensayo" },
  "nonfiction": { category: "no-ficcion", subcategory: "ensayo" },

  // Historia
  "historia": { category: "no-ficcion", subcategory: "historia" },
  "history": { category: "no-ficcion", subcategory: "historia" },

  // Filosofía
  "filosofía": { category: "no-ficcion", subcategory: "filosofia" },
  "filosofia": { category: "no-ficcion", subcategory: "filosofia" },
  "philosophy": { category: "no-ficcion", subcategory: "filosofia" },

  // Ensayo
  "ensayo": { category: "no-ficcion", subcategory: "ensayo" },
  "essay": { category: "no-ficcion", subcategory: "ensayo" },

  // Ciencia
  "ciencia": { category: "no-ficcion", subcategory: "ciencia" },
  "science": { category: "no-ficcion", subcategory: "ciencia" },

  // Política
  "política": { category: "no-ficcion", subcategory: "politica" },
  "politica": { category: "no-ficcion", subcategory: "politica" },
  "politics": { category: "no-ficcion", subcategory: "politica" },

  // Biografía
  "biografía": { category: "no-ficcion", subcategory: "biografia" },
  "biografia": { category: "no-ficcion", subcategory: "biografia" },
  "biography": { category: "no-ficcion", subcategory: "biografia" },

  // Autoayuda
  "autoayuda": { category: "no-ficcion", subcategory: "autoayuda" },
  "self-help": { category: "no-ficcion", subcategory: "autoayuda" },

  // Espiritualidad
  "espiritualidad": { category: "no-ficcion", subcategory: "espiritualidad" },
  "spirituality": { category: "no-ficcion", subcategory: "espiritualidad" },
  "religion": { category: "no-ficcion", subcategory: "espiritualidad" },

  // Esoterismo
  "esoterismo": { category: "no-ficcion", subcategory: "esoterismo" },
  "ocultismo": { category: "no-ficcion", subcategory: "esoterismo" },
  "occult": { category: "no-ficcion", subcategory: "esoterismo" },
  "tarot": { category: "no-ficcion", subcategory: "esoterismo" },
  "astrologia": { category: "no-ficcion", subcategory: "esoterismo" },
  "astrology": { category: "no-ficcion", subcategory: "esoterismo" },
  "masoneria": { category: "no-ficcion", subcategory: "esoterismo" },
  "magia": { category: "no-ficcion", subcategory: "esoterismo" },
  "magia negra": { category: "no-ficcion", subcategory: "esoterismo" },
  "magia blanca": { category: "no-ficcion", subcategory: "esoterismo" },
  "ciencias ocultas": { category: "no-ficcion", subcategory: "esoterismo" },
  "espiritismo": { category: "no-ficcion", subcategory: "esoterismo" },
  "metafisica": { category: "no-ficcion", subcategory: "esoterismo" },
  "ovnis": { category: "no-ficcion", subcategory: "esoterismo" },
  "ufologia": { category: "no-ficcion", subcategory: "esoterismo" },

  // Negocios
  "negocios": { category: "no-ficcion", subcategory: "negocios" },
  "business": { category: "no-ficcion", subcategory: "negocios" },

  // Arte
  "arte": { category: "no-ficcion", subcategory: "arte" },
  "art": { category: "no-ficcion", subcategory: "arte" },

  // Divulgación
  "divulgacion": { category: "no-ficcion", subcategory: "divulgacion" },
  "divulgación": { category: "no-ficcion", subcategory: "divulgacion" },

  // Cine
  "cine y fotografia": { category: "no-ficcion", subcategory: "cine" },
  "cine": { category: "no-ficcion", subcategory: "cine" },

  // Coleccionables
  "ediciones especiales": { category: "coleccionables", subcategory: "ediciones-especiales" },
  "biblioteca de babel": { category: "coleccionables", subcategory: "biblioteca-de-babel" },
};

// Normalize: lowercase, strip accents, trim
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Detecta si un libro es coleccionable por señales en título/descripción.
 */
function detectCollectable(title: string, description?: string | null): NormalizedGenre | null {
  const text = normalize(`${title} ${description ?? ""}`);
  if (text.includes("biblioteca de babel")) {
    return { category: "coleccionables", subcategory: "biblioteca-de-babel" };
  }
  if (text.includes("primera edicion") || text.includes("first edition")) {
    return { category: "coleccionables", subcategory: "primeras-ediciones" };
  }
  if (text.includes("edicion limitada") || text.includes("edicion especial") || text.includes("ediciones especiales")) {
    return { category: "coleccionables", subcategory: "ediciones-especiales" };
  }
  return null;
}

/**
 * Normaliza un género raw a { category, subcategory }.
 * Prioridad: coleccionable detectado > mapa exacto > fuzzy match > fallback.
 */
export function normalizeGenre(
  rawGenre?: string | null,
  title?: string,
  description?: string | null,
): NormalizedGenre | null {
  const genre = rawGenre || "";
  
  // Prioridad 1: señales de coleccionable en título/descripción
  if (title) {
    const collectable = detectCollectable(title, description);
    if (collectable) return collectable;
  }

  // Prioridad 2: match exacto en el mapa (si hay género raw)
  if (genre) {
    const key = normalize(genre);
    if (GENRE_MAP[key]) return GENRE_MAP[key];

    // Prioridad 3: match parcial en el género raw
    for (const [mapKey, value] of Object.entries(GENRE_MAP)) {
      if (key.includes(mapKey) || mapKey.includes(key)) {
        return value;
      }
    }
  }

  // Prioridad 4: Señales en el TÍTULO (muy común cuando no hay género en la API)
  if (title) {
    const t = normalize(title);
    if (t.includes("historia de") || t.includes("breve historia")) return { category: "no-ficcion", subcategory: "historia" };
    if (t.includes("biografia") || t.includes("memorias de")) return { category: "no-ficcion", subcategory: "biografia" };
    if (t.includes("cocina") || t.includes("recetas")) return { category: "no-ficcion", subcategory: "cocina" };
    if (t.includes("cuentos") || t.includes("relatos")) return { category: "ficcion", subcategory: "cuentos" };
    if (t.includes("poesia") || t.includes("poemas")) return { category: "ficcion", subcategory: "poesia" };
    if (t.includes("novela") || t.includes("ficcion")) return { category: "ficcion", subcategory: "novela" };
    if (t.includes("filosofia") || t.includes("etica")) return { category: "no-ficcion", subcategory: "filosofia" };
    if (t.includes("diccionario") || t.includes("enciclopedia")) return { category: "no-ficcion", subcategory: "divulgacion" };
  }

  // Prioridad 5: LCSH y otros formatos raros en el género raw
  if (genre) {
    const key = normalize(genre);
    if (key.includes("author") || key.includes("literary") || key.includes("romance") || key.includes("suspense")) {
      return { category: "ficcion", subcategory: "novela" };
    }
    if (key.includes("self") && key.includes("help")) {
      return { category: "no-ficcion", subcategory: "autoayuda" };
    }
  }

  // Si no hay señales claras, no autocompletamos (mejor no fallar que llenar basura)
  return null;
}
