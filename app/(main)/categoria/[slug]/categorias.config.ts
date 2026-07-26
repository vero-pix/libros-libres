// Config editable de landings de categoría. Mismo patrón que
// app/(main)/autor/[slug]/authors.config.ts y coleccion/[slug]/collections.config.ts.
//
// ⚠️ LOS SLUGS SON LOS DE LA TABLA `categories` DE SUPABASE, no los de
// lib/genres.ts. Ese archivo quedó en una taxonomía anterior (general-adulto-*,
// escolar-*, universitario-*) que YA NO EXISTE en la base: es el mapa que causó
// que el panel del home mostrara slugs crudos (fix del 25 jul 2026).
//
// El filtro del home emite `/?category=<padre>&subcategory=<hijo>`
// (CategoriesSidebar.tsx), con los mismos slugs de acá. Por eso el canonical de
// la vista filtrada puede apuntar a esta ruta sin inventar equivalencias.
//
// Para agregar una categoría:
//   1) verificar stock real:  node scripts/_audit_general.mjs  (o consulta directa)
//   2) agregar la entrada con dbCategory / dbSubcategory EXACTOS
//
// Las categorías sin stock hoy igual se publican: capturan la búsqueda y
// ofrecen /solicitudes (mismo criterio que autores).

export interface CategoriaConfig {
  slug: string;
  displayName: string;
  /** Valor exacto de books.category. */
  dbCategory: string;
  /** Valor exacto de books.subcategory. Si va vacío, la landing es de la categoría gruesa. */
  dbSubcategory?: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  subtitle: string;
  intro: string;
  faqs: { q: string; a: string }[];
  /** Slugs hermanos para enlazado interno. */
  relacionadas: string[];
  /** Colecciones o autores existentes con los que conversa. */
  enlaces?: { label: string; href: string }[];
}

export const CATEGORIAS: Record<string, CategoriaConfig> = {
  // ─────────────────────────── FICCIÓN ───────────────────────────
  "ficcion-novela": {
    slug: "ficcion-novela",
    displayName: "Novela y ficción",
    dbCategory: "ficcion",
    dbSubcategory: "ficcion-novela",
    seoTitle: "Novelas Usadas en Chile — Ficción de Segunda Mano",
    seoDescription:
      "Novelas usadas en Chile a precio de segunda mano: narrativa chilena y extranjera, clásicos y contemporáneos. Compra directo a lectores y librerías, con envío a todo el país.",
    keywords: ["novelas usadas", "novela usada chile", "libros de ficcion usados", "narrativa usada", "comprar novelas baratas"],
    subtitle: "La estantería más grande del sitio",
    intro:
      "Es la categoría que más se mueve en tuslibros.cl, y también la más desordenada en el buen sentido: acá conviven el clásico que todos leímos en el colegio, la novela latinoamericana que se agotó hace años y el best seller que alguien terminó y quiere pasar. Casi todos llegan de bibliotecas personales que se achicaron, así que los precios son de segunda mano de verdad.",
    faqs: [
      { q: "¿Cuánto cuesta una novela usada en Chile?", a: "En tuslibros.cl la mayoría se mueve entre $3.000 y $12.000, según estado y rareza. Las primeras ediciones y los títulos descatalogados pueden costar bastante más, porque son difíciles de encontrar." },
      { q: "¿En qué estado llegan los libros?", a: "Cada publicación declara su estado (como nuevo, buen estado, estado regular o con detalles) y trae fotos del ejemplar real, no una portada de catálogo. Lo que ves es el libro que recibes." },
      { q: "¿Puedo pedir una novela que no está publicada?", a: "Sí. Crea una solicitud en /solicitudes y les avisamos a los vendedores que la tengan. Varios libros se publican justamente porque alguien los pidió primero." },
    ],
    relacionadas: ["ficcion-policial", "ficcion-poesia", "no-ficcion-historia"],
    enlaces: [
      { label: "Literatura chilena", href: "/coleccion/literatura-chilena" },
      { label: "Clásicos que no caducan", href: "/coleccion/clasicos" },
    ],
  },

  "ficcion-policial": {
    slug: "ficcion-policial",
    displayName: "Novela policial y suspenso",
    dbCategory: "ficcion",
    dbSubcategory: "ficcion-policial",
    seoTitle: "Novela Negra y Policial Usada en Chile",
    seoDescription:
      "Novela negra, policial y de suspenso usada en Chile. Simenon, Highsmith, nórdicos y policial latinoamericano de segunda mano, con envío a todo el país.",
    keywords: ["novela negra usada", "novela policial usada", "libros de suspenso usados", "policial chile", "novela negra chile"],
    subtitle: "Para no soltar el libro",
    intro:
      "El policial es de los géneros que mejor circulan de segunda mano: se leen rápido, se prestan, se devuelven y siguen viaje. Acá hay clásicos del género negro, series completas de detectives y bastante nórdico. Si andas siguiendo a un autor específico, conviene revisar seguido: entran de a poco y se van rápido.",
    faqs: [
      { q: "¿Qué autores de novela negra se consiguen usados?", a: "Los más frecuentes son Simenon, Camilleri, Mankell, Nesbø, Patricia Highsmith y Agatha Christie. También policial latinoamericano, que aparece menos pero circula." },
      { q: "¿Se pueden encontrar series completas?", a: "A veces sí, sobre todo cuando alguien vende su biblioteca entera. Si buscas un tomo suelto de una serie, crea una solicitud y te avisamos cuando ingrese." },
    ],
    relacionadas: ["ficcion-novela", "no-ficcion-ensayo"],
    enlaces: [{ label: "Novela negra y suspenso", href: "/coleccion/novela-negra" }],
  },

  "ficcion-poesia": {
    slug: "ficcion-poesia",
    displayName: "Poesía",
    dbCategory: "ficcion",
    dbSubcategory: "ficcion-poesia",
    seoTitle: "Poesía Chilena y Universal Usada — Libros de Poemas",
    seoDescription:
      "Libros de poesía usados en Chile: Neruda, Mistral, Parra, Teillier, Zurita y poesía universal. Ediciones de segunda mano y descatalogadas, con envío a todo el país.",
    keywords: ["poesia chilena", "libros de poesia usados", "poemas usados", "neruda usado", "poesia usada chile"],
    subtitle: "El género donde Chile juega de local",
    intro:
      "Chile tiene una tradición poética desproporcionada para su tamaño, y eso se nota en el mercado de usados: circulan ediciones antiguas de Neruda y Mistral, antologías descatalogadas y libros de tiraje corto que nunca se reeditaron. Es la categoría donde más vale la pena mirar el año de edición.",
    faqs: [
      { q: "¿Qué poesía chilena se consigue usada?", a: "Neruda y Mistral son los más frecuentes. También Nicanor Parra, Jorge Teillier, Raúl Zurita, Gonzalo Rojas y antologías de poesía chilena que ya no se reeditan." },
      { q: "¿Las ediciones antiguas valen más?", a: "Depende del tiraje y el estado. Una primera edición o una edición conmemorativa en buen estado puede valer varias veces una reimpresión reciente. Cada publicación indica año y editorial cuando el vendedor los tiene." },
    ],
    relacionadas: ["ficcion-novela", "no-ficcion-humanidades"],
    enlaces: [
      { label: "Pablo Neruda", href: "/pablo-neruda" },
      { label: "Gabriela Mistral", href: "/autor/gabriela-mistral" },
      { label: "Nicanor Parra", href: "/autor/nicanor-parra" },
      { label: "Jorge Teillier", href: "/autor/jorge-teillier" },
    ],
  },

  // ─────────────────────────── NO FICCIÓN ───────────────────────────
  "no-ficcion-historia": {
    slug: "no-ficcion-historia",
    displayName: "Historia",
    dbCategory: "no-ficcion",
    dbSubcategory: "no-ficcion-historia",
    seoTitle: "Libros de Historia Usados — Historia de Chile y Universal",
    seoDescription:
      "Libros de historia usados en Chile: historia de Chile, historia universal, memoria y política. Ediciones agotadas y de librerías especializadas, con envío a todo el país.",
    keywords: ["libros de historia usados", "historia de chile libro", "libros historia de chile", "historia universal usada", "libros de historia baratos"],
    subtitle: "Donde están los libros que ya no se reeditan",
    intro:
      "Historia es la segunda categoría más grande del catálogo y probablemente la más interesante para quien busca algo específico. Buena parte viene de librerías especializadas y de bibliotecas de gente que investigó en serio, así que aparecen títulos agotados hace décadas: historia de Chile, memoria reciente, crónicas y ensayo histórico que hoy no se consiguen nuevos en ninguna parte.",
    faqs: [
      { q: "¿Dónde comprar libros de historia de Chile usados?", a: "En tuslibros.cl varias librerías especializadas publican su stock, además de lectores particulares. Es de las categorías con más profundidad del catálogo, sobre todo en historia de Chile del siglo XX." },
      { q: "¿Se consiguen libros agotados o descatalogados?", a: "Sí, es lo habitual en esta categoría. Muchos títulos de historia se imprimieron una sola vez y solo circulan de segunda mano. Si buscas uno específico, crea una solicitud." },
      { q: "¿Sirven para la universidad?", a: "Muchos son bibliografía de carreras de historia, ciencia política y derecho. Si buscas un texto de estudio concreto, revisa también la categoría de universitario." },
    ],
    relacionadas: ["no-ficcion-ensayo", "no-ficcion-humanidades", "no-ficcion-biografia"],
    enlaces: [
      { label: "Historia de Chile", href: "/coleccion/historia-de-chile" },
      { label: "Libros de historia de Chile", href: "/libros-de-historia-de-chile" },
    ],
  },

  "no-ficcion-ensayo": {
    slug: "no-ficcion-ensayo",
    displayName: "Ensayo",
    dbCategory: "no-ficcion",
    dbSubcategory: "no-ficcion-ensayo",
    seoTitle: "Ensayo y No Ficción Usada en Chile",
    seoDescription:
      "Libros de ensayo usados en Chile: pensamiento, crítica, política y cultura. Ediciones de segunda mano de editoriales que ya no circulan, con envío a todo el país.",
    keywords: ["libros de ensayo usados", "ensayo usado chile", "libros de pensamiento usados", "no ficcion usada"],
    subtitle: "Ideas que cambian cómo ves las cosas",
    intro:
      "El ensayo es la categoría donde más aparecen editoriales que ya no existen: colecciones de los setenta y ochenta, traducciones que no se volvieron a hacer, libros que marcaron una discusión y después desaparecieron de las mesas de novedades. Si te interesa el pensamiento contemporáneo o la crítica cultural, acá se encuentra lo que las librerías nuevas ya no tienen.",
    faqs: [
      { q: "¿Qué tipo de ensayo se encuentra usado?", a: "Ensayo político, filosófico, cultural y de crítica literaria. Bastante material de editoriales latinoamericanas descatalogadas, además de traducciones clásicas." },
      { q: "¿Cómo sé el estado de un libro de ensayo antiguo?", a: "Cada publicación declara su estado y trae fotos del ejemplar real. En libros antiguos es normal encontrar subrayados o anotaciones; el vendedor debe mencionarlo en la descripción." },
    ],
    relacionadas: ["no-ficcion-historia", "no-ficcion-humanidades", "no-ficcion-ciencia"],
  },

  "no-ficcion-humanidades": {
    slug: "no-ficcion-humanidades",
    displayName: "Humanidades y ciencias sociales",
    dbCategory: "no-ficcion",
    dbSubcategory: "no-ficcion-humanidades",
    seoTitle: "Libros de Humanidades y Ciencias Sociales Usados",
    seoDescription:
      "Libros usados de filosofía, sociología, antropología y ciencias sociales en Chile. Bibliografía universitaria y ensayo de segunda mano, con envío a todo el país.",
    keywords: ["libros de filosofia usados", "sociologia usada", "antropologia libros usados", "ciencias sociales libros usados"],
    subtitle: "Filosofía, sociología, antropología",
    intro:
      "Buena parte de esta categoría es bibliografía universitaria que cambió de manos: filosofía, sociología, antropología y teoría política. Son libros caros nuevos y razonables usados, así que es de las categorías donde más se nota la diferencia de precio.",
    faqs: [
      { q: "¿Sirve para bibliografía universitaria?", a: "Sí. Mucho de lo que circula acá son textos de carreras de humanidades y ciencias sociales, vendidos por estudiantes que ya terminaron el ramo." },
      { q: "¿Cuánto se ahorra comprando usado?", a: "En bibliografía académica la diferencia suele ser la mayor del catálogo: es común encontrar textos a la mitad o menos de su precio nuevo." },
    ],
    relacionadas: ["no-ficcion-ensayo", "no-ficcion-historia", "academico-universitario"],
  },

  "no-ficcion-ciencia": {
    slug: "no-ficcion-ciencia",
    displayName: "Ciencia y divulgación",
    dbCategory: "no-ficcion",
    dbSubcategory: "no-ficcion-ciencia",
    seoTitle: "Libros de Ciencia y Divulgación Usados en Chile",
    seoDescription:
      "Divulgación científica usada en Chile: astronomía, biología, física y matemáticas para lectores no especialistas. Segunda mano con envío a todo el país.",
    keywords: ["libros de ciencia usados", "divulgacion cientifica usada", "astronomia libros usados", "libros de ciencia baratos"],
    subtitle: "Para entender el mundo sin título universitario",
    intro:
      "Divulgación científica escrita para leerse, no para estudiarse: astronomía, evolución, física, matemáticas y algo de historia de la ciencia. Es una categoría que se lee y se pasa, así que los ejemplares suelen estar en buen estado y a precios bajos.",
    faqs: [
      { q: "¿Qué se encuentra en divulgación científica?", a: "Astronomía y cosmología son lo más frecuente, seguidas de biología evolutiva y física. También aparecen clásicos de divulgación que ya no se reeditan." },
      { q: "¿Son libros técnicos?", a: "No: esta categoría es divulgación para público general. Los textos de estudio y manuales están en la categoría de universitario y académico." },
    ],
    relacionadas: ["no-ficcion-ensayo", "academico-universitario", "no-ficcion-historia"],
  },

  "no-ficcion-biografia": {
    slug: "no-ficcion-biografia",
    displayName: "Biografías y memorias",
    dbCategory: "no-ficcion",
    dbSubcategory: "no-ficcion-biografia",
    seoTitle: "Biografías y Memorias Usadas en Chile",
    seoDescription:
      "Biografías y libros de memorias usados en Chile: personajes históricos, escritores, política y testimonio. Segunda mano con envío a todo el país.",
    keywords: ["biografias usadas", "libros de memorias usados", "biografia usada chile", "testimonios libros usados"],
    subtitle: "Vidas contadas de cerca",
    intro:
      "Biografías, autobiografías, memorias y testimonio. En Chile es una categoría con peso propio: hay mucha memoria política y bastante biografía de escritores y figuras públicas, buena parte publicada en ediciones que después no se reimprimieron.",
    faqs: [
      { q: "¿Qué biografías se consiguen usadas?", a: "Biografías de escritores, políticos y figuras históricas chilenas y universales, además de memorias y testimonios de la historia reciente del país." },
      { q: "¿Hay diferencia entre biografía y memoria?", a: "Sí: la biografía la escribe un tercero y la memoria la escribe el propio protagonista. En esta categoría vas a encontrar ambas." },
    ],
    relacionadas: ["no-ficcion-historia", "no-ficcion-ensayo"],
  },

  "no-ficcion-arte": {
    slug: "no-ficcion-arte",
    displayName: "Arte y fotografía",
    dbCategory: "no-ficcion",
    dbSubcategory: "no-ficcion-arte",
    seoTitle: "Libros de Arte y Fotografía Usados en Chile",
    seoDescription:
      "Libros de arte, fotografía y diseño usados en Chile. Catálogos, monografías y ediciones ilustradas de segunda mano, con envío a todo el país.",
    keywords: ["libros de arte usados", "libros de fotografia usados", "catalogos de arte usados", "libros ilustrados usados"],
    subtitle: "Los que se compran para mirar",
    intro:
      "Catálogos de exposiciones, monografías de artistas, libros de fotografía y diseño. Son ediciones caras cuando salen y difíciles de encontrar después, porque se imprimen en tirajes cortos y quedan en bibliotecas particulares. En esta categoría el estado importa más que en ninguna otra: pregunta por las fotos si tienes dudas.",
    faqs: [
      { q: "¿Se consiguen catálogos de exposiciones?", a: "Sí, y suelen ser de las piezas más difíciles de encontrar: se imprimen para una muestra puntual y después no se reeditan nunca." },
      { q: "¿Cómo verifico el estado de un libro ilustrado?", a: "Cada publicación trae fotos del ejemplar real. En libros de arte conviene revisar el estado de las láminas y del lomo, y preguntarle al vendedor si quieres más fotos." },
    ],
    relacionadas: ["no-ficcion-humanidades", "ficcion-poesia"],
  },

  // ─────────────────────────── INFANTIL Y JUVENIL ───────────────────────────
  "infantil-juvenil": {
    slug: "infantil-juvenil",
    displayName: "Infantil y juvenil",
    dbCategory: "infantil-juvenil",
    seoTitle: "Libros Infantiles y Juveniles Usados en Chile",
    seoDescription:
      "Libros infantiles y juveniles usados en Chile: cuentos, ilustrados, lectura complementaria y novela juvenil. Segunda mano a precios bajos, con envío a todo el país.",
    keywords: ["libros infantiles usados", "libros juveniles usados", "cuentos infantiles usados", "lectura complementaria usada", "libros para niños baratos"],
    subtitle: "Los que se leen rápido y se pasan",
    intro:
      "Los libros de niños se leen mucho y se dejan atrás rápido: el que era perfecto a los siete años sobra a los nueve. Por eso es la categoría que más sentido hace comprar usada, y donde más hay lectura complementaria del colegio. Los precios son los más bajos del catálogo.",
    faqs: [
      { q: "¿Se consigue la lectura complementaria del colegio?", a: "Sí, es de lo que más circula, sobre todo a inicio de año escolar. Si buscas un título específico de la lista de tu curso, conviene crear una solicitud para que te avisemos." },
      { q: "¿En qué estado llegan los libros infantiles?", a: "Cada publicación declara su estado y trae fotos reales. Es normal encontrar algo de uso: revisa las fotos y la descripción antes de comprar." },
      { q: "¿Cuánto cuestan?", a: "Es la categoría más económica del sitio: muchos títulos están entre $2.000 y $6.000." },
    ],
    relacionadas: ["ficcion-novela", "academico-escolar"],
  },

  // ─────────────────────────── ACADÉMICO ───────────────────────────
  "academico-universitario": {
    slug: "academico-universitario",
    displayName: "Universitario",
    dbCategory: "academico",
    dbSubcategory: "academico-universitario",
    seoTitle: "Libros Universitarios Usados en Chile — Bibliografía de Carrera",
    seoDescription:
      "Libros universitarios usados en Chile: derecho, ingeniería, medicina, psicología y economía. Bibliografía de carrera de segunda mano a precio de estudiante, con envío a todo el país.",
    keywords: ["libros universitarios usados", "bibliografia universitaria usada", "libros de derecho usados", "libros de medicina usados", "libros de ingenieria usados"],
    subtitle: "Bibliografía de carrera a precio de estudiante",
    intro:
      "Los textos universitarios son de los libros más caros que existen y de los que menos se releen: se usan un semestre y quedan en la repisa. Acá los publican estudiantes que ya pasaron el ramo, así que la diferencia de precio contra el libro nuevo es la más grande del catálogo. Derecho, ingeniería, medicina, psicología y economía son las carreras con más movimiento.",
    faqs: [
      { q: "¿Conviene comprar libros universitarios usados?", a: "Es donde más se ahorra: los textos de carrera son caros nuevos y se usan un semestre. Es común encontrarlos a la mitad de precio o menos." },
      { q: "¿Importa la edición del texto?", a: "En algunas carreras sí, sobre todo en derecho —donde cambia la legislación— y en medicina. Revisa qué edición pide tu programa antes de comprar, y confirma con el vendedor si no está en la descripción." },
      { q: "¿Puedo pedir un texto que no está publicado?", a: "Sí. Crea una solicitud en /solicitudes con el título y la edición que necesitas, y les avisamos a quienes lo tengan." },
    ],
    relacionadas: ["no-ficcion-humanidades", "academico-manuales", "academico-escolar"],
  },

  "academico-escolar": {
    slug: "academico-escolar",
    displayName: "Escolar",
    dbCategory: "academico",
    dbSubcategory: "academico-escolar",
    seoTitle: "Libros Escolares Usados en Chile — Textos de Colegio",
    seoDescription:
      "Textos escolares usados en Chile: básica y media, todas las asignaturas. Libros de colegio de segunda mano a precio bajo, con envío a todo el país.",
    keywords: ["textos escolares usados", "libros de colegio usados", "libros escolares baratos", "texto escolar segunda mano"],
    subtitle: "Textos de colegio de segunda mano",
    intro:
      "Los textos escolares se usan un año y después ocupan lugar. Comprarlos usados es de las decisiones más obvias del año escolar, sobre todo cuando son varios ramos y varios hijos. Acá se publican al terminar el año, así que conviene mirar entre diciembre y marzo.",
    faqs: [
      { q: "¿Cuándo conviene comprar textos escolares usados?", a: "Entre diciembre y marzo hay más stock, porque es cuando las familias sacan los del año que terminó. En marzo es cuando más se buscan, así que comprar antes ayuda." },
      { q: "¿Sirven textos de años anteriores?", a: "Depende del colegio y del ramo. Muchos textos se mantienen entre años, pero conviene revisar la lista del establecimiento antes de comprar." },
    ],
    relacionadas: ["academico-universitario", "infantil-juvenil"],
  },

  "academico-manuales": {
    slug: "academico-manuales",
    displayName: "Manuales de estudio",
    dbCategory: "academico",
    dbSubcategory: "academico-manuales",
    seoTitle: "Manuales de Estudio y Preuniversitarios Usados",
    seoDescription:
      "Manuales de estudio, preuniversitarios y libros de preparación PAES usados en Chile. Segunda mano con envío a todo el país.",
    keywords: ["manuales de estudio usados", "preuniversitario usado", "libros paes usados", "preparacion prueba usada"],
    subtitle: "Preparación y consulta",
    intro:
      "Manuales, libros de ejercicios y material de preparación. Se usan intensamente durante unos meses y después no se vuelven a abrir, lo que los hace un caso perfecto para la segunda mano.",
    faqs: [
      { q: "¿Los manuales usados vienen rayados?", a: "Algunos sí, sobre todo los de ejercicios. Cada publicación declara su estado y trae fotos: revísalas antes de comprar si te importa que estén limpios." },
      { q: "¿Sirven los manuales de años anteriores?", a: "Para contenidos generales sí. Si el temario cambió, conviene confirmar la edición con el vendedor." },
    ],
    relacionadas: ["academico-universitario", "academico-escolar"],
  },

  // ─────────────────────────── IDIOMAS ───────────────────────────
  idiomas: {
    slug: "idiomas",
    displayName: "Idiomas",
    dbCategory: "idiomas",
    seoTitle: "Libros en Otros Idiomas Usados en Chile",
    seoDescription:
      "Libros en inglés, alemán y francés usados en Chile: literatura en idioma original, métodos y diccionarios. Segunda mano con envío a todo el país.",
    keywords: ["libros en ingles usados", "libros en aleman usados", "libros en frances usados", "libros idioma original usados"],
    subtitle: "Lectura en idioma original",
    intro:
      "Literatura en su idioma original, métodos de estudio y diccionarios. Son libros difíciles de encontrar nuevos en Chile y caros cuando se importan, así que el mercado de segunda mano es prácticamente la única vía razonable.",
    faqs: [
      { q: "¿Qué idiomas hay disponibles?", a: "Principalmente alemán, inglés y francés. El stock varía porque depende de bibliotecas particulares que se desarman." },
      { q: "¿Son libros para aprender el idioma o literatura?", a: "Hay de los dos: métodos y gramáticas por un lado, y literatura en idioma original por otro. La descripción de cada publicación lo aclara." },
    ],
    relacionadas: ["ficcion-novela", "academico-universitario"],
  },

  // ────────────── CATEGORÍAS GRUESAS (mucho stock sin subcategoría) ──────────────
  ficcion: {
    slug: "ficcion",
    displayName: "Ficción",
    dbCategory: "ficcion",
    seoTitle: "Libros de Ficción Usados en Chile",
    seoDescription:
      "Libros de ficción usados en Chile: novela, cuento, poesía y policial. Narrativa de segunda mano de lectores y librerías, con envío a todo el país.",
    keywords: ["libros de ficcion usados", "narrativa usada chile", "literatura usada", "comprar ficcion usada"],
    subtitle: "Novela, cuento, poesía y policial",
    intro:
      "Todo lo que se lee por gusto: novela, cuento, poesía y policial, de autores chilenos y de todas partes. Es la mitad del catálogo, y donde más se nota que los libros vienen de bibliotecas reales y no de una bodega.",
    faqs: [
      { q: "¿Qué incluye la categoría de ficción?", a: "Novela, cuento, poesía, teatro y novela policial. Si buscas algo más específico, cada subcategoría tiene su propia página." },
      { q: "¿Hay literatura chilena?", a: "Bastante. Es de lo que más circula, tanto clásicos como narrativa reciente." },
    ],
    relacionadas: ["ficcion-novela", "ficcion-poesia", "ficcion-policial"],
    enlaces: [{ label: "Literatura chilena", href: "/coleccion/literatura-chilena" }],
  },

  "no-ficcion": {
    slug: "no-ficcion",
    displayName: "No ficción",
    dbCategory: "no-ficcion",
    seoTitle: "Libros de No Ficción Usados en Chile",
    seoDescription:
      "No ficción usada en Chile: historia, ensayo, ciencia, biografías y arte. Libros de segunda mano de librerías especializadas y lectores, con envío a todo el país.",
    keywords: ["libros de no ficcion usados", "ensayo historia usados", "libros informativos usados"],
    subtitle: "Historia, ensayo, ciencia y biografías",
    intro:
      "Es la categoría más grande del catálogo y la que más se nutre de librerías especializadas. Historia, ensayo, divulgación científica, biografías y arte: mucho de esto son ediciones agotadas que solo existen de segunda mano.",
    faqs: [
      { q: "¿Qué incluye la no ficción?", a: "Historia, ensayo, ciencia y divulgación, biografías y memorias, arte, economía y humanidades. Cada una tiene su propia página con más detalle." },
      { q: "¿Se consiguen libros descatalogados?", a: "Es lo habitual acá. Muchos títulos de historia y ensayo se imprimieron una vez y solo circulan usados." },
    ],
    relacionadas: ["no-ficcion-historia", "no-ficcion-ensayo", "no-ficcion-ciencia"],
    enlaces: [{ label: "Historia de Chile", href: "/coleccion/historia-de-chile" }],
  },
};

export const CATEGORIA_SLUGS = Object.keys(CATEGORIAS);
