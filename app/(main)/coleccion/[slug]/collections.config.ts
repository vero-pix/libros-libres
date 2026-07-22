export interface CollectionConfig {
  title: string
  seoTitle: string
  seoDescription: string
  tagFilter: string
  subtitle: string
  editorial: string
}

export const COLLECTIONS: Record<string, CollectionConfig> = {
  'historia-de-chile': {
    title: 'Libros de Historia de Chile',
    seoTitle: 'Libros de Historia de Chile Usados',
    seoDescription: 'Encuentra libros usados sobre historia de Chile: política, memoria, identidad. Despacho a todo Chile o retiro en persona.',
    tagFilter: 'historia-chile',
    subtitle: 'Memoria, política, identidad',
    editorial: `La historia de Chile es un territorio inmenso y a veces incómodo. Aquí encontrarás desde los grandes relatos oficiales hasta las versiones que no entraron en los libros de texto del colegio: la historia económica, la historia oral, los años de plomo y los de transición, los caudillos y los movimientos sociales. Textos de Barros Arana, Vicuña Mackenna, Ascanio Cavallo, y decenas de historiadores que reconstruyeron el pasado desde distintas trincheras. Todos usados, todos con historia propia.`,
  },

  'literatura-chilena': {
    title: 'Literatura Chilena Usada',
    seoTitle: 'Literatura Chilena Usada',
    seoDescription: 'Narrativa, poesía y ensayo de autores chilenos. Donoso, Edwards, Marta Brunet, Nicanor Parra y más. Libros usados con despacho a todo Chile.',
    tagFilter: 'literatura-chilena',
    subtitle: 'Escritoras y escritores de acá',
    editorial: `La literatura chilena tiene una voz propia que cuesta encontrar en las cadenas de librerías. Aquí hay Donoso y hay Edwards, hay Marta Brunet y hay Nicanor Parra. Hay voces del siglo pasado que siguen diciendo cosas vigentes, y voces nuevas que están redefiniendo qué significa escribir desde Chile. Esta colección la armamos con libros que alguien leyó, subrayó y decidió pasar a otro lector. Así funciona la literatura: de mano en mano.`,
  },

  'novela-negra': {
    title: 'Novela Negra y Policial Usada',
    seoTitle: 'Novela Negra y Policial Usada',
    seoDescription: 'Los mejores libros de novela negra y policial usados: Simenon, Camilleri, nordic noir y más. Despacho a todo Chile.',
    tagFilter: 'novela-negra',
    subtitle: 'Para no soltar el libro',
    editorial: `El género negro tiene una honestidad que la literatura mainstream no siempre se permite: mirar de frente la violencia, la corrupción y lo que la gente hace cuando cree que nadie la observa. Georges Simenon con el inspector Maigret, Camilleri con el comisario Montalbano, los escandinavos con sus paisajes fríos y sus crímenes de clase media. Todos usados, todos disponibles ahora. La mejor novela negra no se lee una vez: se relee.`,
  },

  'clasicos': {
    title: 'Clásicos que No Caducan',
    seoTitle: 'Clásicos de Literatura Universal Usados',
    seoDescription: 'Clásicos de la literatura universal en ediciones usadas: Kafka, Orwell, Cortázar, Borges y más. Despacho a todo Chile.',
    tagFilter: 'clasicos',
    subtitle: 'Los que siempre vuelven',
    editorial: `Hay libros que siguen apareciendo en manos de lectores distintos, generación tras generación, porque resuelven algo que no pasa de moda. Un proceso kafkiano. Una rebelión orwelliana. Un rayuela que no termina de leerse de la misma manera dos veces. Esta colección agrupa los títulos que los vendedores de tuslibros.cl han decidido poner en circulación de nuevo — ya los leyeron, ya los marcaron, ya están listos para el siguiente lector.`,
  },

  'tarde-de-lluvia': {
    title: 'Libros para una Tarde de Lluvia',
    seoTitle: 'Libros para Leer en Casa — Selección tuslibros.cl',
    seoDescription: 'Una selección de libros para leer lento, sin apuro. Narrativa, cuentos y novelas para una tarde de lluvia. Libros usados en Chile.',
    tagFilter: 'tarde-de-lluvia',
    subtitle: 'Lectura lenta, sin apuro',
    editorial: `No todos los libros se leen de la misma manera. Estos están hechos para una tarde sin compromisos: una novela que entra suave, un libro de cuentos que se puede interrumpir y retomar, algo que no exige nada excepto que te sientes y leas. Curadería de Vero, fundadora de tuslibros.cl, lectora sin apuro. Esta selección cambia con el catálogo — si un libro se vende, entra otro. Si tienes dudas sobre cuál empezar, escríbenos.`,
  },

  'latinoamerica-contemporanea': {
    title: 'Literatura Latinoamericana Contemporánea',
    seoTitle: 'Literatura Latinoamericana Contemporánea Usada',
    seoDescription: 'Lo mejor de la narrativa latinoamericana contemporánea: Fuentes, Bolaño, Vargas Llosa y nuevas voces. Libros usados con despacho a Chile.',
    tagFilter: 'latinoamerica-contemp',
    subtitle: 'Lo que se está escribiendo ahora mismo',
    editorial: `El boom latinoamericano nunca terminó, solo mutó. Después de García Márquez y Cortázar vino Bolaño, después de Bolaño vienen decenas de escritoras y escritores que están redefiniendo qué significa narrar desde este continente. Acá hay Vargas Llosa y Fuentes porque siguen siendo necesarios, y hay títulos más recientes de autores que todavía no llenan estadios pero que los críticos están mirando. Todos usados, todos disponibles, todos esperando al siguiente lector.`,
  },

}

export const TAG_TO_COLLECTION_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(COLLECTIONS).map(([slug, cfg]) => [cfg.tagFilter, slug])
)
