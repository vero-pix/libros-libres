// Config editable de páginas de autor. Mismo patrón que
// app/(main)/coleccion/[slug]/collections.config.ts.
//
// `dbAuthors` contiene los strings EXACTOS como aparecen en books.author
// (incluyendo variantes con espacios/tildes detectadas en la base). El autor
// es texto libre en books.author — no hay entidad normalizada —, por eso el
// match se hace contra esta lista explícita para evitar homónimos y fallas
// silenciosas.
//
// Para agregar un autor: 1) corre `select distinct author from books where
// author ilike '%apellido%'` para ver las variantes reales, 2) agrega una
// entrada acá. Las páginas de autores sin stock hoy igual se publican (capturan
// la búsqueda y ofrecen /solicitudes).

export interface AuthorConfig {
  slug: string;
  displayName: string;
  dbAuthors: string[];
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  subtitle: string;
  bio: string;
  faqs: { q: string; a: string }[];
}

export const AUTHORS: Record<string, AuthorConfig> = {
  'juan-emar': {
    slug: 'juan-emar',
    displayName: 'Juan Emar',
    dbAuthors: ['Juan Emar'],
    seoTitle: 'Juan Emar — Libros Usados en Chile | tuslibros.cl',
    seoDescription:
      'Libros de Juan Emar usados en Chile: Ayer, Un año, Miltín 1934, Diez. El vanguardista chileno que se adelantó a su tiempo. Envío a todo el país o retiro en mano.',
    keywords: ['juan emar', 'juan emar libros', 'ayer juan emar', 'miltin 1934', 'diez juan emar', 'emar libros usados'],
    subtitle: 'El vanguardista que Chile leyó tarde',
    bio: 'Juan Emar escribió como si el resto de la literatura chilena viniera atrasada. Ignorado en vida y reivindicado por Neruda, Bolaño y una generación entera de lectores que llegaron después, su obra —Ayer, Un año, Miltín 1934, Diez— es de las apuestas más radicales y divertidas que dio el país. Leerlo hoy sigue siendo una sorpresa.',
    faqs: [
      { q: '¿Qué libros de Juan Emar se consiguen usados?', a: 'Los más frecuentes en el mercado de segunda mano son Ayer, Un año, Miltín 1934 y el volumen de cuentos Diez. Las ediciones de Editorial Universitaria y las reediciones recientes circulan de vez en cuando.' },
      { q: '¿Por dónde empezar a leer a Emar?', a: 'Ayer es la puerta de entrada más habitual: breve, delirante y representativa de su mundo. Diez funciona bien si prefieres cuentos antes que novela.' },
      { q: '¿Es difícil encontrar a Juan Emar en Chile?', a: 'Sí, es un autor de circulación acotada, por eso las copias usadas se mueven rápido. Puedes crear una solicitud en tuslibros.cl para que te avisemos cuando ingrese un ejemplar.' },
    ],
  },

  'jose-donoso': {
    slug: 'jose-donoso',
    displayName: 'José Donoso',
    dbAuthors: ['José Donoso', 'José Donoso '],
    seoTitle: 'José Donoso — Libros Usados en Chile | tuslibros.cl',
    seoDescription:
      'Libros de José Donoso usados en Chile: El obsceno pájaro de la noche, Casa de campo, Coronación y más. El gran novelista del boom chileno. Envío a todo Chile o retiro en mano.',
    keywords: ['jose donoso', 'josé donoso libros', 'el obsceno pajaro de la noche', 'casa de campo donoso', 'coronacion donoso', 'donoso libros usados'],
    subtitle: 'El lado oscuro del boom',
    bio: 'José Donoso llevó la novela chilena a sus rincones más incómodos: la decadencia de las familias, las máscaras sociales, el deterioro. El obsceno pájaro de la noche es su obra cumbre y una de las novelas más ambiciosas del boom latinoamericano. Del retrato de clase de Coronación al laberinto de Casa de campo, su obra sigue leyéndose de otra manera cada década.',
    faqs: [
      { q: '¿Qué libros de José Donoso se consiguen usados?', a: 'Coronación, El obsceno pájaro de la noche, Casa de campo, El lugar sin límites y Donde van a morir los elefantes son los que más circulan en el mercado de segunda mano chileno.' },
      { q: '¿Cuál es el libro más buscado de Donoso?', a: 'El obsceno pájaro de la noche es el más buscado por su peso en la obra, seguido de El lugar sin límites y Coronación, muy pedidos por listas de lectura escolares y universitarias.' },
      { q: '¿Hay ediciones de colección de Donoso?', a: 'Ocasionalmente aparecen ediciones antiguas de Seix Barral y primeras ediciones chilenas, muy buscadas por coleccionistas. Crea una solicitud para que te avisemos cuando ingrese una.' },
    ],
  },

  'maria-luisa-bombal': {
    slug: 'maria-luisa-bombal',
    displayName: 'María Luisa Bombal',
    dbAuthors: ['María Luisa Bombal'],
    seoTitle: 'María Luisa Bombal — Libros Usados en Chile | tuslibros.cl',
    seoDescription:
      'Libros de María Luisa Bombal usados en Chile: La última niebla, La amortajada. La escritora que renovó la narrativa chilena. Envío a todo el país o retiro en mano.',
    keywords: ['maria luisa bombal', 'la ultima niebla', 'la amortajada', 'bombal libros', 'bombal libros usados'],
    subtitle: 'La niebla que cambió la narrativa chilena',
    bio: 'Con apenas dos novelas breves, María Luisa Bombal reordenó la narrativa chilena. La última niebla y La amortajada trajeron el deseo, el sueño y la muerte a un país que escribía en clave realista, y abrieron un camino que autoras y autores siguen recorriendo. Poca obra, enorme influencia.',
    faqs: [
      { q: '¿Qué libros de María Luisa Bombal se consiguen usados?', a: 'Sus dos títulos esenciales, La última niebla y La amortajada, a veces reunidos en un mismo volumen. Son los que más se buscan en el mercado de segunda mano.' },
      { q: '¿Por qué es tan importante Bombal?', a: 'Introdujo lo onírico y lo psicológico en la narrativa chilena de los años treinta, adelantándose a búsquedas que el boom desarrollaría décadas después. Es lectura obligada para entender la literatura chilena del siglo XX.' },
      { q: 'No veo libros de Bombal disponibles ahora, ¿qué hago?', a: 'Su obra es breve y muy pedida, así que se agota rápido. Crea una solicitud en tuslibros.cl y te avisamos apenas ingrese un ejemplar.' },
    ],
  },

  'gabriela-mistral': {
    slug: 'gabriela-mistral',
    displayName: 'Gabriela Mistral',
    dbAuthors: ['Gabriela Mistral'],
    seoTitle: 'Gabriela Mistral — Libros Usados en Chile | tuslibros.cl',
    seoDescription:
      'Libros de Gabriela Mistral usados en Chile: Desolación, Tala, Ternura, Lagar. La primera Nobel latinoamericana. Envío a todo Chile o retiro en mano.',
    keywords: ['gabriela mistral', 'gabriela mistral libros', 'desolacion mistral', 'tala mistral', 'ternura gabriela mistral', 'mistral libros usados'],
    subtitle: 'La primera Nobel de América Latina',
    bio: 'Gabriela Mistral fue la primera persona latinoamericana en ganar el Nobel de Literatura, y su poesía sigue siendo mucho más filosa y moderna de lo que la escuela suele mostrar. De Desolación a Lagar, su voz cruza la maternidad, el duelo, la tierra y la infancia con una densidad que no envejece. Leerla completa es descubrir a otra Mistral.',
    faqs: [
      { q: '¿Qué libros de Gabriela Mistral se consiguen usados?', a: 'Desolación, Ternura, Tala y Lagar son los títulos que más circulan, además de antologías y selecciones de poemas. Ternura es especialmente frecuente por su uso escolar.' },
      { q: '¿Cuál es el libro más buscado de Mistral?', a: 'Desolación y Tala son los más pedidos por lectores adultos; Ternura lidera en el segmento escolar. Las antologías completas también tienen demanda constante.' },
      { q: '¿Hay ediciones antiguas de Mistral?', a: 'Sí, aparecen ediciones de Zig-Zag y otras casas históricas chilenas, valoradas por coleccionistas. Crea una solicitud para que te avisemos cuando ingrese una.' },
    ],
  },

  'nicanor-parra': {
    slug: 'nicanor-parra',
    displayName: 'Nicanor Parra',
    dbAuthors: ['Nicanor Parra'],
    seoTitle: 'Nicanor Parra — Libros Usados en Chile | tuslibros.cl',
    seoDescription:
      'Libros de Nicanor Parra usados en Chile: Poemas y antipoemas, Artefactos, Sermones y prédicas del Cristo de Elqui. El creador de la antipoesía. Envío a todo Chile o retiro en mano.',
    keywords: ['nicanor parra', 'poemas y antipoemas', 'antipoesia', 'artefactos parra', 'nicanor parra libros usados'],
    subtitle: 'El antipoeta',
    bio: 'Nicanor Parra bajó la poesía del pedestal y la puso a hablar como la gente. Con Poemas y antipoemas inventó la antipoesía y cambió para siempre lo que se podía hacer con un verso en español. Irónico, matemático, irreverente hasta el final, es uno de los autores chilenos más influyentes del siglo XX.',
    faqs: [
      { q: '¿Qué libros de Nicanor Parra se consiguen usados?', a: 'Poemas y antipoemas, Versos de salón, Artefactos, Sermones y prédicas del Cristo de Elqui y diversas antologías. Poemas y antipoemas es el más frecuente y buscado.' },
      { q: '¿Por dónde empezar con Parra?', a: 'Poemas y antipoemas es la entrada natural. Si te gusta el humor y lo visual, Artefactos muestra su costado más experimental.' },
      { q: '¿Hay ediciones de colección de Parra?', a: 'Sí, aparecen ediciones antiguas y algunas ilustradas muy buscadas. Crea una solicitud para que te avisemos cuando ingrese un ejemplar que te interese.' },
    ],
  },

  'roberto-bolano': {
    slug: 'roberto-bolano',
    displayName: 'Roberto Bolaño',
    dbAuthors: ['Roberto Bolaño'],
    seoTitle: 'Roberto Bolaño — Libros Usados en Chile | tuslibros.cl',
    seoDescription:
      'Libros de Roberto Bolaño usados en Chile: Los detectives salvajes, 2666, Estrella distante, Nocturno de Chile. Envío a todo el país o retiro en mano.',
    keywords: ['roberto bolaño', 'los detectives salvajes', '2666 bolaño', 'estrella distante', 'nocturno de chile', 'bolaño libros usados'],
    subtitle: 'El chileno que reinventó la novela',
    bio: 'Roberto Bolaño escribió como quien lo apuesta todo. Los detectives salvajes y 2666 son novelas totales que cambiaron el mapa de la literatura en español, y sus libros breves —Estrella distante, Nocturno de Chile— son puñetazos perfectos. Murió joven y dejó una obra que no deja de crecer en lectores.',
    faqs: [
      { q: '¿Qué libros de Roberto Bolaño se consiguen usados?', a: 'Los detectives salvajes, 2666, Estrella distante, Nocturno de Chile, Los perros románticos y Putas asesinas son los que más circulan en el mercado de segunda mano.' },
      { q: '¿Por dónde empezar a leer a Bolaño?', a: 'Estrella distante o Nocturno de Chile son entradas breves e intensas. Si buscas la obra grande, Los detectives salvajes es la más querida por sus lectores.' },
      { q: '¿2666 se consigue usado en Chile?', a: 'Sí, aunque al ser un libro extenso y muy pedido se mueve rápido. Crea una solicitud en tuslibros.cl para que te avisemos cuando ingrese un ejemplar.' },
    ],
  },

  'pedro-prado': {
    slug: 'pedro-prado',
    displayName: 'Pedro Prado',
    dbAuthors: ['Pedro Prado'],
    seoTitle: 'Pedro Prado — Libros Usados en Chile | tuslibros.cl',
    seoDescription:
      'Libros de Pedro Prado usados en Chile: Alsino, Un juez rural. El primer Premio Nacional de Literatura. Envío a todo el país o retiro en mano.',
    keywords: ['pedro prado', 'alsino pedro prado', 'un juez rural', 'pedro prado libros'],
    subtitle: 'El primer Premio Nacional de Literatura',
    bio: 'Pedro Prado fue el primer Premio Nacional de Literatura de Chile, y su novela Alsino —la historia de un niño que aprende a volar— es una de las más hermosas y singulares de la tradición chilena. Poeta, novelista y ensayista, su obra tiene una serenidad que la vuelve a poner en circulación generación tras generación.',
    faqs: [
      { q: '¿Qué libros de Pedro Prado se consiguen usados?', a: 'Alsino es el más buscado, seguido de Un juez rural y sus libros de poesía y ensayo. Suelen aparecer en ediciones de Editorial Nascimento y Zig-Zag.' },
      { q: '¿Por qué leer a Pedro Prado hoy?', a: 'Alsino combina fábula, lirismo y una mirada chilena del paisaje que sigue conmoviendo. Es lectura clave para entender los inicios de la novela moderna en Chile.' },
      { q: 'No veo libros de Pedro Prado disponibles, ¿qué hago?', a: 'Es un autor de circulación acotada. Crea una solicitud en tuslibros.cl y te avisamos apenas ingrese un ejemplar.' },
    ],
  },

  'marta-brunet': {
    slug: 'marta-brunet',
    displayName: 'Marta Brunet',
    dbAuthors: ['Marta Brunet ', 'Marta Brunet'],
    seoTitle: 'Marta Brunet — Libros Usados en Chile | tuslibros.cl',
    seoDescription:
      'Libros de Marta Brunet usados en Chile: Montaña adentro, María Nadie, Humo hacia el sur. Premio Nacional de Literatura. Envío a todo Chile o retiro en mano.',
    keywords: ['marta brunet', 'montaña adentro', 'maria nadie', 'humo hacia el sur', 'marta brunet libros usados'],
    subtitle: 'La voz del campo y de las mujeres',
    bio: 'Marta Brunet, Premio Nacional de Literatura, escribió el mundo rural chileno y la vida de sus mujeres con una fuerza que la crítica tardó en reconocer. De Montaña adentro a María Nadie, su obra combina el criollismo con una hondura psicológica que la mantiene vigente. Una autora imprescindible que merece más lectores.',
    faqs: [
      { q: '¿Qué libros de Marta Brunet se consiguen usados?', a: 'Montaña adentro, María Nadie, Humo hacia el sur y Amasijo son los que más circulan en el mercado de segunda mano chileno.' },
      { q: '¿Por dónde empezar con Marta Brunet?', a: 'Montaña adentro, su debut, muestra su mundo rural; María Nadie es su novela más lograda si prefieres un registro urbano y psicológico.' },
      { q: '¿Hay ediciones antiguas de Brunet?', a: 'Sí, aparecen ediciones de Zig-Zag y Nascimento buscadas por coleccionistas. Crea una solicitud para que te avisemos cuando ingrese una.' },
    ],
  },

  'jorge-teillier': {
    slug: 'jorge-teillier',
    displayName: 'Jorge Teillier',
    dbAuthors: ['Jorge Teillier'],
    seoTitle: 'Jorge Teillier — Libros Usados en Chile | tuslibros.cl',
    seoDescription:
      'Libros de Jorge Teillier usados en Chile: Para ángeles y gorriones, El árbol de la memoria, Muertes y maravillas. El poeta lárico. Envío a todo Chile o retiro en mano.',
    keywords: ['jorge teillier', 'poesia larica', 'para angeles y gorriones', 'muertes y maravillas', 'teillier libros usados'],
    subtitle: 'El poeta del sur y la memoria',
    bio: 'Jorge Teillier hizo de la nostalgia una forma de resistencia. Su poesía lárica —la del lar, la casa, el pueblo del sur— convirtió la infancia, la lluvia y los trenes en un territorio poético reconocible al instante. De Para ángeles y gorriones a Muertes y maravillas, es uno de los poetas chilenos más queridos y releídos.',
    faqs: [
      { q: '¿Qué libros de Jorge Teillier se consiguen usados?', a: 'Para ángeles y gorriones, El árbol de la memoria, Muertes y maravillas y diversas antologías de su poesía son los que más circulan.' },
      { q: '¿Qué es la poesía lárica de Teillier?', a: 'Es una poesía del "lar" —el hogar, el pueblo, el sur de Chile— que rescata la memoria, la infancia y el paisaje frente al mundo moderno. Muertes y maravillas es una buena entrada.' },
      { q: '¿Hay antologías de Teillier disponibles?', a: 'Sí, circulan varias antologías que reúnen lo esencial de su obra. Crea una solicitud si buscas un título específico y te avisamos cuando ingrese.' },
    ],
  },
};
