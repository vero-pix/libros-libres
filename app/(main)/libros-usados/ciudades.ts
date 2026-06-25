export type Faq = { q: string; a: string };
export type Ciudad = {
  label: string; // nombre display con tildes
  match: string; // (legacy) término sobre users.city — no usado: city está despoblado
  heroSub: string; // subtítulo en itálica del H1
  intro: string; // párrafo introductorio único
  faqs: Faq[];
};

// Filtrado real por geolocalización de las fichas (listings.latitude/longitude).
// users.city está despoblado, así que la cercanía se calcula con Haversine.
// radiusKm acotado por comuna para que Providencia/Las Condes/Ñuñoa no devuelvan
// el mismo set que Santiago (evita thin/duplicate content).
export const COORDS: Record<string, { lat: number; lng: number; radiusKm: number }> = {
  santiago: { lat: -33.4569, lng: -70.6483, radiusKm: 45 },
  providencia: { lat: -33.4263, lng: -70.6116, radiusKm: 6 },
  "las-condes": { lat: -33.4087, lng: -70.5709, radiusKm: 7 },
  nunoa: { lat: -33.4569, lng: -70.5985, radiusKm: 5 },
  valparaiso: { lat: -33.0458, lng: -71.6197, radiusKm: 12 },
  "vina-del-mar": { lat: -33.0245, lng: -71.5518, radiusKm: 10 },
  concepcion: { lat: -36.8201, lng: -73.0444, radiusKm: 20 },
  temuco: { lat: -38.7359, lng: -72.5904, radiusKm: 15 },
  antofagasta: { lat: -23.6509, lng: -70.3975, radiusKm: 15 },
  "la-serena": { lat: -29.9027, lng: -71.2519, radiusKm: 25 },
  talca: { lat: -35.4264, lng: -71.6554, radiusKm: 25 },
  "puerto-montt": { lat: -41.4693, lng: -72.9424, radiusKm: 25 },
  coquimbo: { lat: -29.9533, lng: -71.3436, radiusKm: 15 },
};

export const CIUDADES: Record<string, Ciudad> = {
  santiago: {
    label: "Santiago",
    match: "Santiago",
    heroSub: "Retira hoy, lee esta noche.",
    intro:
      "Santiago está lleno de libreros independientes, universitarios y lectores que venden libros a pocas cuadras de tu casa o trabajo. Busca por comuna, coordina retiro en estaciones de metro como Baquedano, Los Leones o Plaza Egaña, y ahórrate el costo de despacho. Pago seguro con MercadoPago.",
    faqs: [
      {
        q: "¿Puedo retirar el libro el mismo día en Santiago?",
        a: "Sí. Gran parte de nuestros vendedores en la Región Metropolitana ofrecen 'Retiro en persona'. Si el vendedor acepta, pueden coordinar la entrega en una estación de Metro (Baquedano, Los Leones, Plaza Egaña) o en el domicilio del vendedor el mismo día de la compra.",
      },
      {
        q: "¿Cómo encuentro libros que estén cerca de mí?",
        a: "En la página principal tienes la vista de Mapa. Si das permiso de ubicación, te muestra los libros que están en tu misma comuna, listos para retirar sin pagar envío.",
      },
      {
        q: "¿El pago se le hace al vendedor en la entrega?",
        a: "No. Para proteger tu dinero, todas las transacciones se hacen antes vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro y está en buen estado.",
      },
      {
        q: "¿En qué comunas de Santiago hay más libros disponibles?",
        a: "El catálogo se concentra en Providencia, Ñuñoa, Santiago Centro, Las Condes y La Florida, pero hay vendedores en casi toda la Región Metropolitana.",
      },
    ],
  },
  providencia: {
    label: "Providencia",
    match: "Providencia",
    heroSub: "A pasos de tu casa o trabajo.",
    intro:
      "Gran parte del catálogo de tuslibros.cl vive en Providencia. Si vives o trabajas cerca, no necesitas pagar despacho: explora libros de tus vecinos y coordina retiros fáciles en Manuel Montt, Baquedano, Pedro de Valdivia o Los Leones. Pago protegido y entregas seguras.",
    faqs: [
      {
        q: "¿Dónde se coordinan los retiros en Providencia?",
        a: "La mayoría de los vendedores de la comuna prefieren coordinar en estaciones de la Línea 1 (Baquedano, Manuel Montt, Pedro de Valdivia, Los Leones, Tobalaba) o en cafés de Barrio Italia y Pocuro. Al comprar, te pones de acuerdo directamente con el vendedor.",
      },
      {
        q: "¿Por qué hay tantos libros concentrados aquí?",
        a: "Providencia es el epicentro de tuslibros.cl. La primera red de vendedores activos se construyó fuertemente en este sector, así que la oferta local es la más densa del país.",
      },
      {
        q: "¿Tengo que pagar en efectivo al juntarnos?",
        a: "No. Todas las transacciones se hacen antes vía MercadoPago. El dinero queda retenido y solo se le transfiere al vendedor cuando confirmas que recibiste el libro en buen estado.",
      },
      {
        q: "Vivo en Providencia pero no tengo tiempo de juntarme, ¿qué hago?",
        a: "Puedes elegir envío por courier al pagar. El vendedor deja el paquete en Starken o Chilexpress y llega a tu casa o trabajo al día hábil siguiente por un costo reducido.",
      },
    ],
  },
  "las-condes": {
    label: "Las Condes",
    match: "Las Condes",
    heroSub: "Libros usados sin salir del barrio alto.",
    intro:
      "Encuentra libros usados en Las Condes y coordina retiro cerca de El Golf, Escuela Militar o Manquehue. Compra a vendedores de la zona oriente y ahórrate el despacho, o recibe el libro por courier si prefieres. Pago seguro con MercadoPago.",
    faqs: [
      {
        q: "¿Dónde retiro un libro en Las Condes?",
        a: "Los vendedores de la comuna suelen coordinar en estaciones de la Línea 1 (Escuela Militar, Manquehue, El Golf, Tobalaba) o en su domicilio. Lo acuerdas directo con el vendedor al comprar.",
      },
      {
        q: "¿Hay envío a domicilio dentro de Las Condes?",
        a: "Sí. Si prefieres no moverte, eliges envío por courier al pagar y recibes el libro en tu casa u oficina, normalmente al día hábil siguiente.",
      },
      {
        q: "¿Cómo sé que el pago es seguro?",
        a: "Pagas vía MercadoPago dentro de la plataforma. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro y está correcto.",
      },
    ],
  },
  nunoa: {
    label: "Ñuñoa",
    match: "Ñuñoa",
    heroSub: "De Plaza Ñuñoa a tu estante.",
    intro:
      "Libros usados en Ñuñoa, una de las comunas con más lectores de Santiago. Coordina retiro cerca de Plaza Ñuñoa, Irarrázaval o Estadio Nacional, o recibe el libro por courier. Compra protegida con MercadoPago.",
    faqs: [
      {
        q: "¿Dónde se coordinan los retiros en Ñuñoa?",
        a: "Habitualmente en torno a Plaza Ñuñoa, la línea 3 del Metro (Irarrázaval, Chile-España, Ñuñoa) o en el domicilio del vendedor. Lo acuerdas directo al comprar.",
      },
      {
        q: "¿Puedo pedir envío en vez de retirar?",
        a: "Sí. Al pagar eliges envío por courier y el libro llega a tu dirección, normalmente al día hábil siguiente, por un costo reducido.",
      },
      {
        q: "¿El pago es seguro?",
        a: "Pagas vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro en buen estado.",
      },
    ],
  },
  valparaiso: {
    label: "Valparaíso",
    match: "Valpara",
    heroSub: "Libros con vista al puerto.",
    intro:
      "Libros usados en Valparaíso y el Gran Valparaíso. Compra a lectores y libreros de los cerros y el plan, coordina retiro en persona o recibe el libro por courier en tu casa. Pago seguro con MercadoPago.",
    faqs: [
      {
        q: "¿Cómo compro un libro que está en Valparaíso?",
        a: "Eliges el libro y, al pagar, defines si lo retiras en persona (lo coordinas con el vendedor) o lo recibes por courier en tu dirección.",
      },
      {
        q: "¿Hay despacho a otras ciudades desde Valparaíso?",
        a: "Sí. Los vendedores despachan a todo Chile por courier (Starken, Blue Express, Chilexpress). El costo se calcula al momento de pagar.",
      },
      {
        q: "¿El pago es seguro?",
        a: "Pagas vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro.",
      },
    ],
  },
  "vina-del-mar": {
    label: "Viña del Mar",
    match: "Viña",
    heroSub: "Tu próxima lectura, a la orilla del mar.",
    intro:
      "Libros usados en Viña del Mar y alrededores. Coordina retiro en persona con vendedores de la zona o recibe el libro en tu casa por courier. Pago protegido con MercadoPago y envíos a todo Chile.",
    faqs: [
      {
        q: "¿Puedo retirar en persona en Viña del Mar?",
        a: "Sí, si el vendedor ofrece 'Retiro en persona'. Coordinan el punto de entrega directamente al concretar la compra.",
      },
      {
        q: "¿Llega a domicilio dentro de Viña?",
        a: "Sí. Eliges envío por courier al pagar y el libro llega a tu dirección, normalmente al día hábil siguiente.",
      },
      {
        q: "¿Cómo protegen mi pago?",
        a: "Pagas vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro en buen estado.",
      },
    ],
  },
  concepcion: {
    label: "Concepción",
    match: "Concep",
    heroSub: "Libros usados en el corazón del Biobío.",
    intro:
      "Libros usados en Concepción y el Gran Biobío. Compra a estudiantes, libreros y lectores de la zona, coordina retiro en persona o recibe el libro por courier. Pago seguro con MercadoPago.",
    faqs: [
      {
        q: "¿Cómo compro un libro en Concepción?",
        a: "Eliges el libro y, al pagar, defines retiro en persona (coordinado con el vendedor) o envío por courier a tu dirección.",
      },
      {
        q: "¿Hay buena oferta de textos universitarios?",
        a: "Sí. Concepción tiene fuerte presencia universitaria, así que es común encontrar textos de estudio y libros académicos usados.",
      },
      {
        q: "¿El pago es seguro?",
        a: "Pagas vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro.",
      },
    ],
  },
  temuco: {
    label: "Temuco",
    match: "Temuco",
    heroSub: "Libros usados en la Araucanía.",
    intro:
      "Libros usados en Temuco y la Araucanía. Catálogo actualizado con envío a todo Chile o retiro directo con el vendedor. Pago protegido con MercadoPago.",
    faqs: [
      {
        q: "¿Puedo retirar en persona en Temuco?",
        a: "Sí, cuando el vendedor lo ofrece. Coordinan el punto de entrega directamente al concretar la compra.",
      },
      {
        q: "¿Llega por courier a Temuco?",
        a: "Sí. Los vendedores despachan a todo Chile; el costo de envío se calcula al pagar.",
      },
      {
        q: "¿Cómo protegen mi pago?",
        a: "Pagas vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro en buen estado.",
      },
    ],
  },
  antofagasta: {
    label: "Antofagasta",
    match: "Antofagasta",
    heroSub: "Libros usados en el norte grande.",
    intro:
      "Libros usados en Antofagasta. Recibe el libro por courier en tu dirección o coordina retiro en persona con el vendedor. Pago seguro con MercadoPago y despacho a todo Chile.",
    faqs: [
      {
        q: "¿Cómo recibo un libro en Antofagasta?",
        a: "Al pagar eliges envío por courier a tu dirección. Si el vendedor está en la zona, también puedes coordinar retiro en persona.",
      },
      {
        q: "¿Cuánto demora el despacho al norte?",
        a: "Depende del courier y el vendedor, pero el costo y plazo estimado se muestran al momento de pagar.",
      },
      {
        q: "¿El pago es seguro?",
        a: "Pagas vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro.",
      },
    ],
  },
  "la-serena": {
    label: "La Serena",
    match: "Serena",
    heroSub: "Libros usados en La Serena y Coquimbo.",
    intro:
      "Libros usados en La Serena y Coquimbo. Compra con garantía de pago seguro y envío a domicilio, o coordina retiro en persona con vendedores de la zona. Pago protegido con MercadoPago.",
    faqs: [
      {
        q: "¿Puedo retirar en persona en La Serena?",
        a: "Sí, cuando el vendedor lo ofrece. Coordinan el punto de entrega directamente al concretar la compra.",
      },
      {
        q: "¿Llega por courier a La Serena o Coquimbo?",
        a: "Sí. Los vendedores despachan a todo Chile; el costo de envío se calcula al pagar.",
      },
      {
        q: "¿Cómo protegen mi pago?",
        a: "Pagas vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro en buen estado.",
      },
    ],
  },
  talca: {
    label: "Talca",
    match: "Talca",
    heroSub: "Libros usados en el corazón del Maule.",
    intro:
      "Libros usados en Talca y la Región del Maule. Vendedores locales con retiro en mano y despacho a todo Chile, además de universitarios que liquidan sus textos cada semestre. Pago protegido con MercadoPago.",
    faqs: [
      {
        q: "¿Puedo retirar en persona en Talca?",
        a: "Sí, cuando el vendedor lo ofrece. Coordinan el punto de entrega directamente al concretar la compra, sin pagar despacho.",
      },
      {
        q: "¿Encuentro textos universitarios en Talca?",
        a: "Sí. Con la UTalca y la UCM en la ciudad, es común encontrar textos de estudio y manuales de segunda mano a buen precio.",
      },
      {
        q: "¿Cómo protegen mi pago?",
        a: "Pagas vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro en buen estado.",
      },
    ],
  },
  "puerto-montt": {
    label: "Puerto Montt",
    match: "Puerto Montt",
    heroSub: "Libros usados en la puerta de la Patagonia.",
    intro:
      "Libros usados en Puerto Montt y la Región de Los Lagos. Lectores y libreros del sur con catálogo propio, retiro en mano y despacho por courier a todo Chile. Pago protegido con MercadoPago.",
    faqs: [
      {
        q: "¿Puedo retirar en persona en Puerto Montt?",
        a: "Sí, cuando el vendedor lo ofrece. Coordinan el punto de entrega directamente al concretar la compra.",
      },
      {
        q: "¿Llega por courier al sur si vivo más lejos?",
        a: "Sí. Los vendedores despachan a todo Chile, incluida la zona sur y austral; el costo de envío se calcula al pagar según destino.",
      },
      {
        q: "¿Cómo protegen mi pago?",
        a: "Pagas vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro en buen estado.",
      },
    ],
  },
  coquimbo: {
    label: "Coquimbo",
    match: "Coquimbo",
    heroSub: "Libros usados en la bahía.",
    intro:
      "Libros usados en Coquimbo y la conurbación con La Serena. Retiro en mano entre vecinos y despacho a todo Chile. Pago protegido con MercadoPago.",
    faqs: [
      {
        q: "¿Puedo retirar en persona en Coquimbo o La Serena?",
        a: "Sí. Coquimbo y La Serena están pegadas, así que muchos vendedores coordinan retiro en mano en cualquiera de las dos ciudades.",
      },
      {
        q: "¿Llega por courier a Coquimbo?",
        a: "Sí. Los vendedores despachan a todo Chile; el costo de envío se calcula al pagar.",
      },
      {
        q: "¿Cómo protegen mi pago?",
        a: "Pagas vía MercadoPago. El dinero queda retenido y solo se libera al vendedor cuando confirmas que recibiste el libro en buen estado.",
      },
    ],
  },
};

export const ORDEN = [
  "santiago", "providencia", "las-condes", "nunoa",
  "valparaiso", "vina-del-mar", "concepcion", "temuco", "antofagasta", "la-serena",
  "talca", "puerto-montt", "coquimbo",
];
