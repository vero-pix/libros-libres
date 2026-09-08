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
    seoTitle: 'Juan Emar — Libros Usados en Chile',
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
    seoTitle: 'José Donoso — Libros Usados en Chile',
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
    seoTitle: 'María Luisa Bombal — Libros Usados en Chile',
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
    seoTitle: 'Gabriela Mistral — Libros Usados en Chile',
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
    seoTitle: 'Nicanor Parra — Libros Usados en Chile',
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
    seoTitle: 'Roberto Bolaño — Libros Usados en Chile',
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
    seoTitle: 'Pedro Prado — Libros Usados en Chile',
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
    seoTitle: 'Marta Brunet — Libros Usados en Chile',
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
    seoTitle: 'Jorge Teillier — Libros Usados en Chile',
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

  'ken-wilber': {
    slug: 'ken-wilber',
    displayName: 'Ken Wilber',
    dbAuthors: ['Ken Wilber', 'Ken Wilber (ed.), David Bohm, Karl Pribram, Marilyn Ferguson, Fritjof Capra, Renée Weber'],
    seoTitle: 'Ken Wilber — Libros Usados en Chile',
    seoDescription:
      'Libros de Ken Wilber usados en Chile: Breve historia de todas las cosas, Los tres ojos del conocimiento, Cuestiones cuánticas, Después del Edén, El ojo del espíritu. Ediciones Kairós. Envío a todo Chile o retiro en mano.',
    keywords: ['ken wilber', 'ken wilber libros', 'breve historia de todas las cosas', 'los tres ojos del conocimiento', 'cuestiones cuanticas wilber', 'despues del eden wilber', 'el ojo del espiritu', 'psicologia transpersonal libros', 'teoria integral wilber', 'espectro de la conciencia', 'ken wilber chile'],
    subtitle: 'El mapa más ambicioso de la conciencia',
    bio: 'Ken Wilber es el autor que intentó juntar en un solo mapa lo que la ciencia, la psicología y las tradiciones contemplativas dicen sobre la conciencia. De ese intento salieron la psicología transpersonal y la teoría integral: los cuatro cuadrantes, los niveles y las líneas de desarrollo, el espectro que va del ego a lo que las tradiciones llaman espíritu. Breve historia de todas las cosas es la puerta de entrada; Los tres ojos del conocimiento y Cuestiones cuánticas son los libros donde discute con los científicos; Después del Edén es su historia de la evolución humana. En Chile sus libros llegaron casi siempre por Editorial Kairós y hoy varios están descatalogados, por eso los ejemplares usados se buscan. Los que están acá son de mi biblioteca personal: los leí, los subrayé y ahora busco a quién los siga leyendo.',
    faqs: [
      { q: '¿Por dónde empezar a leer a Ken Wilber?', a: 'Breve historia de todas las cosas: está escrito como una conversación y resume su modelo entero sin tecnicismos. Si te interesa el cruce con la ciencia, sigue con Los tres ojos del conocimiento o Cuestiones cuánticas. Después del Edén es para quien quiera su lectura de la historia humana.' },
      { q: '¿Qué ediciones de Wilber circulan en Chile?', a: 'Casi todas son de Editorial Kairós (Barcelona), en tapa blanda, de los años 90 y 2000. Varias ya no se reimprimen, así que los ejemplares usados en buen estado son la forma más realista de conseguirlos sin importar.' },
      { q: '¿Qué es la teoría integral?', a: 'Es el modelo con el que Wilber ordena el desarrollo humano en cuatro cuadrantes (interior y exterior, individual y colectivo), con niveles y líneas de desarrollo. Aparece completa en Breve historia de todas las cosas y se aplica en El ojo del espíritu.' },
      { q: '¿Y si el libro que busco no está?', a: 'Crea una solicitud en tuslibros.cl con el título y te aviso cuando alguien lo publique. Los de Wilber se mueven rápido porque hay poca oferta.' },
    ],
  },

  'rudolf-steiner': {
    slug: 'rudolf-steiner',
    displayName: 'Rudolf Steiner',
    dbAuthors: ['Rudolf Steiner'],
    seoTitle: 'Rudolf Steiner — Libros de Antroposofía Usados en Chile',
    seoDescription:
      'Libros de Rudolf Steiner usados en Chile: La ciencia oculta, La filosofía de la libertad, Curso de astronomía, Relaciones kármicas. Ediciones Antroposófica. Envío a todo Chile o retiro en mano.',
    keywords: ['rudolf steiner', 'rudolf steiner libros', 'antroposofia libros', 'la ciencia oculta steiner', 'la filosofia de la libertad steiner', 'relaciones karmicas steiner', 'editorial antroposofica', 'pedagogia waldorf libros', 'steiner libros usados chile'],
    subtitle: 'El fundador de la antroposofía',
    bio: 'Rudolf Steiner (1861-1925) fundó la antroposofía y de ahí salieron cosas que hoy existen sin que mucha gente sepa de dónde vienen: las escuelas Waldorf, la agricultura biodinámica, la medicina antroposófica, la euritmia. Su obra escrita es enorme y en español circula sobre todo por Editorial Antroposófica (Buenos Aires), en tiradas chicas que se agotan y no siempre vuelven. La filosofía de la libertad es el libro que él mismo consideraba la base de todo; La ciencia oculta es la exposición más completa de su cosmovisión; los ciclos de conferencias, como Relaciones kármicas o el Curso de astronomía, son para quien ya entró. Estos ejemplares son de mi biblioteca personal.',
    faqs: [
      { q: '¿Qué libros de Rudolf Steiner se consiguen usados en Chile?', a: 'Los que más aparecen son La filosofía de la libertad, La ciencia oculta, Teosofía, Cómo se alcanza el conocimiento de los mundos superiores y ciclos de conferencias como Relaciones kármicas. Casi todos de Editorial Antroposófica.' },
      { q: '¿Por dónde empezar con Steiner?', a: 'Si vienes de la filosofía, La filosofía de la libertad. Si te interesa la cosmovisión completa, La ciencia oculta. Si llegaste por la pedagogía Waldorf, los ciclos de conferencias sobre educación son más directos que los libros de base.' },
      { q: '¿Son difíciles de encontrar?', a: 'Sí. Las ediciones en español son de tiradas pequeñas y en Chile hay poca oferta usada. Crea una solicitud para que te avise cuando entre un título específico.' },
    ],
  },

  // Agregados el 08-09-2026. Hasta acá devolvían 404 pese a ser los dos autores
  // con más catálogo repartido: Neruda 21 libros de 7 vendedores, Vargas Llosa
  // 20 de 8. Variantes verificadas contra books.author en TODOS los estados de
  // listing: cada uno tiene UN solo string exacto, sin espacios sobrantes.
  // Quedan fuera a propósito las entradas que son listas de participantes de
  // antologías, y "Plinio Apuleyo Mendoza | Carlos Montaner | Álvaro Vargas
  // Llosa", que es Álvaro, el hijo, otra persona.
  'pablo-neruda': {
    slug: 'pablo-neruda',
    displayName: 'Pablo Neruda',
    dbAuthors: ['Pablo Neruda'],
    seoTitle: 'Pablo Neruda — Libros y Poesía Usados en Chile',
    seoDescription:
      'Libros de Pablo Neruda usados en Chile: Canto General, Residencia en la tierra, Memorial de Isla Negra, Los versos del capitán. Envío a todo Chile o retiro en mano.',
    keywords: ['pablo neruda', 'neruda libros usados', 'canto general neruda', 'veinte poemas de amor', 'residencia en la tierra', 'memorial de isla negra', 'poesia chilena usada', 'neruda segunda mano chile'],
    subtitle: 'El que está en todas las casas',
    bio: 'Cuesta encontrar una casa chilena sin un Neruda en alguna repisa, y quizás por eso volver a él siempre se siente como volver a algo propio. Están los veinte poemas que todos leímos a destiempo, y está el Neruda político, el de las odas a las cosas simples, el de Isla Negra. Acá vas a encontrar ediciones de segunda mano que pasaron por otras manos antes que las tuyas — que es, al final, la mejor forma de leer poesía.',
    faqs: [
      { q: '¿Qué libros de Neruda se consiguen usados?', a: 'De todo: desde 20 poemas de amor y una canción desesperada y Canto General hasta los tardíos, como Jardín de invierno, Fin de mundo o Las piedras del cielo. También circulan Residencia en la tierra, Memorial de Isla Negra y las Obras Completas.' },
      { q: '¿Por dónde empezar a leer a Neruda?', a: 'Si nunca lo has leído en serio, 20 poemas funciona como puerta de entrada. Si ya pasaste por ahí, Residencia en la tierra muestra al Neruda más oscuro y Odas elementales al que le escribe a la cebolla y al calcetín.' },
      { q: '¿Vale la pena comprarlo usado?', a: 'Es de los autores más editados en Chile, así que las ediciones antiguas de Losada, Nascimento o Quimantú aparecen seguido y a buen precio. Muchas traen dedicatorias de otros lectores.' },
    ],
  },

  'mario-vargas-llosa': {
    slug: 'mario-vargas-llosa',
    displayName: 'Mario Vargas Llosa',
    dbAuthors: ['Mario Vargas Llosa'],
    seoTitle: 'Mario Vargas Llosa — Libros Usados en Chile',
    seoDescription:
      'Libros de Mario Vargas Llosa usados en Chile: Conversación en La Catedral, La casa verde, La fiesta del chivo, La tía Julia y el escribidor. Envío a todo Chile o retiro en mano.',
    keywords: ['mario vargas llosa', 'vargas llosa libros usados', 'conversacion en la catedral', 'la casa verde vargas llosa', 'la fiesta del chivo', 'la tia julia y el escribidor', 'historia de mayta', 'vargas llosa segunda mano chile'],
    subtitle: 'El que se presta y no vuelve',
    bio: 'Vargas Llosa es de esos autores que se prestan y no vuelven, así que el circuito de segunda mano es casi el hábitat natural de sus libros. Está el Vargas Llosa monumental de Conversación en La Catedral, y está el más liviano, el de las novelas de amor y humor. Acá conviven los dos, en ediciones que van desde el bolsillo gastado hasta tapas duras de colección. Buen lugar para completar una lectura pendiente.',
    faqs: [
      { q: '¿Qué libros de Vargas Llosa se consiguen usados?', a: 'Los que más circulan son Conversación en La Catedral, La casa verde, Historia de Mayta, La tía Julia y el escribidor, La fiesta del chivo y los relatos de Los jefes y Los cachorros.' },
      { q: '¿Por dónde empezar?', a: 'La tía Julia y el escribidor es la entrada más amable, con humor y menos exigente en estructura. Si buscas la novela grande, Conversación en La Catedral es la obra mayor, aunque pide paciencia con los saltos de tiempo.' },
      { q: '¿Aparecen ediciones antiguas?', a: 'Sí. Conviven ediciones de bolsillo bien gastadas con tapas duras de colección, y a veces aparecen los volúmenes de Seix Barral de los años setenta y ochenta.' },
    ],
  },

  // Segundo lote, 08-09-2026. Variantes tomadas de scripts/autores-candidatos.mjs
  // y verificadas contra books.author en todos los estados de listing. Se
  // incluyen TODAS, con tildes faltantes, espacios sobrantes y la diéresis de
  // "Märquez": configurar solo la forma correcta dejaba 7 de 21 libros de García
  // Márquez fuera de su propia página.
  'gabriel-garcia-marquez': {
    slug: 'gabriel-garcia-marquez',
    displayName: 'Gabriel García Márquez',
    dbAuthors: [
      'Gabriel García Márquez',
      'Gabriel García Marquez',
      'Gabriel Garcia Marquez',
      'Gabriel García Márquez ',
      'Gabriel García Märquez',
    ],
    seoTitle: 'Gabriel García Márquez — Libros Usados en Chile',
    seoDescription:
      'Libros de Gabriel García Márquez usados en Chile: Cien años de soledad, El amor en los tiempos del cólera, El coronel no tiene quien le escriba, Relato de un náufrago. Envío a todo Chile.',
    keywords: ['gabriel garcia marquez', 'garcia marquez libros usados', 'cien anos de soledad usado', 'el amor en los tiempos del colera', 'el coronel no tiene quien le escriba', 'relato de un naufrago', 'garcia marquez segunda mano chile'],
    subtitle: 'El que todos tienen y pocos devuelven',
    bio: 'Hay quien llegó a García Márquez por obligación del colegio y quien no ha salido nunca. Cien años de soledad es el que todos tienen, pero el catálogo de segunda mano guarda cosas mejores: El amor en los tiempos del cólera, las crónicas, los cuentos que se leen de una sentada. Son ejemplares que ya vivieron en otra casa, muchos con el lomo quebrado en la misma página donde alguien se detuvo. Buen lugar para encontrar el que te falta.',
    faqs: [
      { q: '¿Qué libros de García Márquez se consiguen usados?', a: 'Además de Cien años de soledad y El amor en los tiempos del cólera, circulan El coronel no tiene quien le escriba, El otoño del patriarca, Los funerales de la Mamá Grande, Noticia de un secuestro y Relato de un náufrago.' },
      { q: '¿Y su obra periodística?', a: 'Sí, es de lo más interesante que aparece usado y casi no se reedita: Textos costeños, Entre cachacos, De Europa y América, Notas de prensa y Por la libre. Son los tomos de su trabajo como reportero antes y durante su carrera de novelista.' },
      { q: '¿Por dónde empezar si no es por Cien años de soledad?', a: 'El coronel no tiene quien le escriba es breve y da el tono. Relato de un náufrago funciona bien si prefieres la crónica al realismo mágico.' },
    ],
  },

  'julio-cortazar': {
    slug: 'julio-cortazar',
    displayName: 'Julio Cortázar',
    dbAuthors: ['Julio Cortázar', 'Julio Cortázar '],
    seoTitle: 'Julio Cortázar — Libros Usados en Chile',
    seoDescription:
      'Libros de Julio Cortázar usados en Chile: Rayuela, Final del juego, Las armas secretas, Los premios, Libro de Manuel. Cuentos y novelas de segunda mano con envío a todo Chile.',
    keywords: ['julio cortazar', 'cortazar libros usados', 'rayuela usado', 'final del juego cortazar', 'las armas secretas', 'libro de manuel', 'cortazar cuentos segunda mano'],
    subtitle: 'De los que se releen por temporadas',
    bio: 'Cortázar es autor de relectura: Rayuela no se lee una vez, se lee por temporadas de la vida. Acá aparecen sus novelas, pero sobre todo los cuentos, que son donde muchos lo queremos más. Ediciones usadas, algunas de esas colecciones antiguas de bolsillo que ya no se imprimen. Si andas detrás de un título específico o de una edición en particular, este es de los autores que más rota, así que vale revisar seguido.',
    faqs: [
      { q: '¿Qué libros de Cortázar se consiguen usados?', a: 'Rayuela aparece seguido, en ediciones de bolsillo y también la anotada de Cátedra. De los cuentos circulan Final del juego, Las armas secretas, Alguien que anda por ahí y Un tal Lucas. De las novelas, Los premios, Libro de Manuel y 62, modelo para armar.' },
      { q: '¿Por dónde empezar?', a: 'Si nunca lo has leído, los cuentos antes que Rayuela: Final del juego o Las armas secretas dan el tono sin pedirte una estructura. Rayuela se disfruta más cuando ya conoces su manera de escribir.' },
      { q: '¿Aparecen ediciones antiguas?', a: 'Sí, es de los autores donde más se ven colecciones de bolsillo de los setenta y ochenta que ya no se reimprimen.' },
    ],
  },

  'jose-saramago': {
    slug: 'jose-saramago',
    displayName: 'José Saramago',
    dbAuthors: ['José Saramago', 'Jose Saramago'],
    seoTitle: 'José Saramago — Libros Usados en Chile',
    seoDescription:
      'Libros de José Saramago usados en Chile: Ensayo sobre la ceguera, Memorial del convento, El evangelio según Jesucristo, Todos los nombres, La caverna. Envío a todo Chile.',
    keywords: ['jose saramago', 'saramago libros usados', 'ensayo sobre la ceguera usado', 'memorial del convento', 'el evangelio segun jesucristo', 'todos los nombres saramago', 'saramago segunda mano chile'],
    subtitle: 'La prosa que parece no respirar',
    bio: 'Saramago escribía sin puntos donde otros los pondrían, y esa prosa que parece no respirar es justo la que engancha. El Ensayo sobre la ceguera es el que más circula, pero está también el Saramago de las novelas históricas y las fábulas políticas. Son ejemplares de segunda mano, muchos de lectores que lo descubrieron tarde y quisieron tenerlo todo. Acá se arma una biblioteca suya de a poco, un tomo a la vez.',
    faqs: [
      { q: '¿Qué libros de Saramago se consiguen usados?', a: 'Ensayo sobre la ceguera es el más frecuente. También aparecen Memorial del convento, El año de la muerte de Ricardo Reis, El evangelio según Jesucristo, La balsa de piedra, Todos los nombres, La caverna y Levantado del suelo.' },
      { q: '¿Por dónde empezar a leer a Saramago?', a: 'Ensayo sobre la ceguera es la entrada habitual y la más directa. Si prefieres la novela histórica, Memorial del convento; si te interesa el Saramago más personal, Las pequeñas memorias.' },
      { q: '¿Cuesta acostumbrarse a su puntuación?', a: 'Las primeras páginas cuestan y después se vuelve natural. Los diálogos van dentro del párrafo, separados por comas, y esa es la marca de su estilo.' },
    ],
  },

  'jorge-luis-borges': {
    slug: 'jorge-luis-borges',
    displayName: 'Jorge Luis Borges',
    dbAuthors: ['Jorge Luis Borges'],
    seoTitle: 'Jorge Luis Borges — Libros Usados en Chile',
    seoDescription:
      'Libros de Jorge Luis Borges usados en Chile: Ficciones, El Aleph, Obra poética, Elogio de la sombra, Prólogos y las Obras completas. Ediciones de segunda mano con envío a todo Chile.',
    keywords: ['jorge luis borges', 'borges libros usados', 'ficciones borges', 'el aleph usado', 'obras completas borges', 'borges obra poetica', 'borges segunda mano chile'],
    subtitle: 'De los que no se botan: se heredan',
    bio: 'A Borges se le vuelve siempre, aunque nunca se le termine de entender del todo, y quizás por eso sus libros no se botan: se heredan. En el catálogo aparecen Ficciones, El Aleph, los ensayos, las antologías de la Biblioteca de Babel que él mismo dirigió. Ediciones usadas, algunas viejas y buscadas. Es de los autores donde el ejemplar de segunda mano vale tanto como el nuevo, porque muchas de sus mejores ediciones ya no están en librería.',
    faqs: [
      { q: '¿Qué libros de Borges se consiguen usados?', a: 'Ficciones y El Aleph son los más buscados. También circulan Obra poética, Elogio de la sombra, La rosa profunda, Prólogos con un prólogo de prólogos, Introducción a la literatura inglesa y tomos sueltos de las Obras completas.' },
      { q: '¿Por dónde empezar?', a: 'Ficciones es la entrada clásica: cuentos breves donde ya está todo su mundo. El Aleph funciona igual de bien. Los ensayos y prólogos son para después.' },
      { q: '¿Sirve comprar tomos sueltos de las Obras completas?', a: 'Sí, cada tomo agrupa libros distintos y se leen por separado. Es la forma más habitual de armar su obra en el circuito usado, porque los juegos completos rara vez aparecen enteros.' },
    ],
  },

  'mario-benedetti': {
    slug: 'mario-benedetti',
    displayName: 'Mario Benedetti',
    dbAuthors: ['Mario Benedetti'],
    seoTitle: 'Mario Benedetti — Libros y Poesía Usados en Chile',
    seoDescription:
      'Libros de Mario Benedetti usados en Chile: Cuentos completos, La muerte y otras sorpresas, Poemas de la oficina, Vivir adrede, Geografías. Poesía y narrativa con envío a todo Chile.',
    keywords: ['mario benedetti', 'benedetti libros usados', 'benedetti poemas', 'poemas de la oficina', 'la muerte y otras sorpresas', 'benedetti cuentos completos', 'benedetti segunda mano chile'],
    subtitle: 'El más prestado y el menos devuelto',
    bio: 'Pocos autores se prestan tanto como Benedetti, y pocos se recuperan tan poco: por eso el circuito de segunda mano es donde de verdad viven sus libros. Está el Benedetti de los poemas que todos citamos sin saber que son de él, y está el narrador, el de La tregua. Acá hay ediciones usadas repartidas por el país, desde los poemarios de bolsillo hasta las novelas. Si te prestaron uno y no volvió, este es el lugar para reponerlo.',
    faqs: [
      { q: '¿Qué libros de Benedetti se consiguen usados?', a: 'De poesía aparecen Poemas de la oficina, La casa y el ladrillo, El mundo que respiro y Vivir adrede. De narrativa, Cuentos completos, La muerte y otras sorpresas, Esta mañana y otros cuentos, Geografías y Andamios.' },
      { q: '¿Conviene la poesía o la narrativa?', a: 'Depende de qué buscas. Los poemarios son los que más se regalan y se prestan; los cuentos, como La muerte y otras sorpresas, muestran al Benedetti más filoso.' },
      { q: '¿Se consiguen los Inventarios?', a: 'Sí, sus recopilaciones de poesía aparecen de vez en cuando, incluidas las ediciones De viva voz que vienen con CD y él mismo leyendo.' },
    ],
  },

  'marcela-paz': {
    slug: 'marcela-paz',
    displayName: 'Marcela Paz',
    dbAuthors: ['Marcela Paz'],
    seoTitle: 'Marcela Paz y Papelucho — Libros Usados en Chile',
    seoDescription:
      'Libros de Marcela Paz usados en Chile: Papelucho, Papelucho misionero, Papelucho perdido, Papelucho y el marciano, Mi hermano hippie. Envío a todo Chile o retiro en mano.',
    keywords: ['marcela paz', 'papelucho', 'papelucho libros usados', 'papelucho misionero', 'papelucho perdido', 'coleccion papelucho', 'papelucho segunda mano chile'],
    subtitle: 'La voz de niño que no envejeció',
    bio: 'Papelucho es de los pocos personajes que cruzan generaciones enteras en Chile: el que leíste tú es probablemente el mismo que leyeron tus papás. Marcela Paz creó una voz de niño que no ha envejecido, y por eso sus libros pasan de mano en mano, de hermano a hermano, de casa en casa. Acá aparecen ediciones usadas de la serie, ideales para armar la colección o reponer el que quedó deshecho de tanto releer. De los que se compran para regalar y para volver a tener.',
    faqs: [
      { q: '¿Qué Papeluchos se consiguen usados?', a: 'Aparecen el Papelucho original y varios de la serie: Papelucho misionero, Papelucho perdido, Papelucho y el marciano, Mi hermano hippie, Adiós Planeta y ¿Soy dix-leso?.' },
      { q: '¿Sirven para el colegio?', a: 'Sí, varios títulos de la serie son lectura complementaria habitual en básica, y por eso el ejemplar usado es la forma más razonable de conseguirlos año a año.' },
      { q: '¿Se puede armar la colección completa?', a: 'De a poco. Los títulos entran y salen del catálogo según lo que publiquen los vendedores, así que conviene crear una solicitud para que te avisemos cuando llegue el que te falta.' },
    ],
  },
};
