import Link from "next/link";
import Image from "next/image";
import { createPublicClient } from "@/lib/supabase/public";
import PromoBanner from "@/components/ui/PromoBanner";
import { libroUrl } from "@/lib/urls";
import type { ListingWithBook } from "@/types";

export const metadata = {
  title: "Diario de tuslibros.cl — Julio 2026",
  description:
    "Lo que pasó en tuslibros.cl: 6 colecciones editoriales, ficha de compra rediseñada, publicar sin fricción y 66 libros vendidos en 3 meses.",
  alternates: { canonical: "https://tuslibros.cl/novedades" },
};

export const revalidate = 300;

type PoolListing = ListingWithBook & { _isCollectible?: boolean };

type Visual =
  | { kind: "covers"; match: (l: PoolListing) => boolean; limit?: number; caption?: string }
  | { kind: "quote"; text: string; who: string; book?: string; match?: (l: PoolListing) => boolean }
  | { kind: "stat"; stats: Array<{ big: string; small: string }> }
  | { kind: "milestone"; icon: string; metric: string; detail: string };

type Entry = {
  date: string;
  title: string;
  description: string;
  tag: string;
  link?: string;
  linkText?: string;
  visual?: Visual;
};

const titleMatches = (l: PoolListing, needles: string[]) => {
  const hay = `${l.book.title ?? ""} ${l.book.author ?? ""}`.toLowerCase();
  return needles.some((n) => hay.includes(n.toLowerCase()));
};

const novedades: Entry[] = [
  {
    date: "2 julio 2026",
    title: "Colecciones editoriales: Historia de Chile, Novela Negra, Clásicos y más",
    description:
      "Armé seis vitrinas temáticas con URL propia para que Google las encuentre mejor y para que puedas compartir una colección entera de un tirón. Historia de Chile, Literatura Chilena, Novela Negra, Clásicos, Tarde de Lluvia y Latinoamérica Contemporánea. Cada una tiene su propia dirección (tuslibros.cl/coleccion/...), muestra solo los libros disponibles hoy y tiene un texto editorial que explica por qué vale la pena ese tema. También agregué la landing de Marcela Paz y Papelucho — hay ejemplares de segunda mano en muy buen estado, ideal para armar la colección sin gastar de más.",
    tag: "Lanzamiento",
    link: "/coleccion/historia-de-chile",
    linkText: "Ver Historia de Chile",
    visual: {
      kind: "milestone",
      icon: "📚",
      metric: "6 colecciones",
      detail: "Historia de Chile · Novela Negra · Clásicos · Literatura Chilena · Tarde de Lluvia · Latinoamérica",
    },
  },
  {
    date: "2 julio 2026",
    title: "Ahora puedes cambiar tu contraseña desde tu perfil",
    description:
      "Antes si querías cambiar tu contraseña tenías que esperar un link por correo y usarlo antes de que venciera — un proceso que más de alguien encontró engorroso. Ahora la opción está directo en tu perfil: entras a tuslibros.cl/perfil, vas al final de la página y cambias la contraseña en el momento, sin esperar nada.",
    tag: "Mejora",
    link: "/perfil",
    linkText: "Ir a mi perfil",
    visual: {
      kind: "milestone",
      icon: "🔐",
      metric: "Contraseña",
      detail: "cambia desde tu perfil, sin esperar link por correo",
    },
  },
  {
    date: "1 julio 2026",
    title: "Comprar quedó más claro y seguro",
    description:
      "Estuve mirando por qué mucha gente entra a ver un libro y después no lo compra, y me di cuenta de que la culpa era mía: la ficha no dejaba claro lo importante. Primero, el pago: cuando compras acá tu plata no se la lleva el vendedor al tiro — queda protegida en MercadoPago y él la recibe recién cuando confirmas que el libro te llegó bien. Eso siempre fue así, pero no lo estaba diciendo en el momento en que importa, así que ahora lo ves junto al botón de comprar. Segundo, el envío: antes decía \"cotiza al comprar\" y el costo te aparecía como sorpresa al final; ahora te muestro desde la ficha que el despacho parte en $2.900 — o gratis si lo retiras en persona y coordinas con el vendedor. Y bajé el ruido: dejé el botón de comprar como protagonista y corrí a un costado las otras opciones. Menos vueltas, más claro de dónde a dónde va tu plata.",
    tag: "Mejora",
    link: "/libros-usados-chile",
    linkText: "Ver libros",
    visual: {
      kind: "milestone",
      icon: "🛡️",
      metric: "Compra protegida",
      detail: "tu pago queda en MercadoPago hasta que recibes el libro",
    },
  },
  {
    date: "1 julio 2026",
    title: "Saqué el trámite que había antes de publicar tu primer libro",
    description:
      "Me puse a mirar por qué entraba gente nueva pero pocos subían su primer libro, y me di cuenta de que yo misma les había puesto una tranca. Cuando te registrabas y apretabas \"publicar\", antes de dejarte ver el formulario te mandaba a otra página a \"completar tu perfil\": teléfono y dirección obligatorios, arrastrar un pin en un mapa… todo antes de haber subido nada. Un montón se bajaba ahí no más, y con razón: viniste a publicar un libro, no a llenar una ficha. Así que lo saqué. Ahora entras directo a subir el libro: le sacas una foto a la portada o escaneas el código, yo completo el resto y tú le pones precio. La ubicación te la sigo pidiendo —es lo que deja que el comprador calcule el envío o pase a buscarlo—, pero ahí mismo, en una sola pantalla, sin desvíos. Y el WhatsApp ahora es opcional: si publicas sin ponerlo te aviso que los compradores no van a poder escribirte, pero tú decides. Menos trámite, más libros. Si te habías quedado a medio camino, es buen momento para volver.",
    tag: "Mejora",
    link: "/publish",
    linkText: "Publicar un libro",
    visual: {
      kind: "milestone",
      icon: "📕",
      metric: "Publicar en 1 pantalla",
      detail: "sin completar perfil antes: entras directo a subir tu libro",
    },
  },
  {
    date: "30 junio 2026",
    title: "Puse el sitio a volar de nuevo (y la búsqueda ahora se pagina)",
    description:
      "Hoy, un martes que suele ser de los buenos, sentí el sitio pesado al abrirlo. Me puse a escarbar y era cosa mía: a medida que ustedes suben más y más libros, un par de páginas estaban trayendo el catálogo entero cada vez que alguien entraba, sin guardarse nada en memoria. Con poca gente no se notaba; con harta gente y harto libro, se empezaba a arrastrar. Así que me metí a la cocina: ahora la portada y el buscador guardan en memoria lo pesado por un ratito, en vez de rehacer todo el trabajo en cada visita. La home pasó de tardar casi dos segundos a abrir en menos de uno, y el buscador —que era el más lento, llegaba a tres segundos— ahora responde en menos de uno. De paso le agregué algo que faltaba hace rato: cuando buscas algo con muchos resultados, ya no te tira una lista infinita de una sola vez, sino que se reparte en páginas ordenadas. Más liviano para tu teléfono y más fácil de mirar. Lo mejor: mientras más crezca el catálogo, este arreglo aguanta. Era justo lo que necesitaba antes de seguir llenándolo de libros.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "⚡",
      metric: "3× más rápido",
      detail: "portada y buscador abren en menos de un segundo, aunque entren todos juntos",
    },
  },
  {
    date: "25 junio 2026",
    title: "Abrí vitrinas por tema y por ciudad para que encuentres más rápido",
    description:
      "Estuve mirando qué busca la gente que entra y me di cuenta de algo: muchos llegan con una idea clara —\"quiero historia de Chile\", \"ando buscando novela negra\", \"algo barato nomás\"— pero después tenían que rebuscar en todo el catálogo. Así que armé vitrinas dedicadas para los temas que más se piden. Ahora hay una sección de Historia de Chile (con la Unidad Popular, la dictadura, la Guerra del Pacífico, el mundo mapuche, el salitre… mucho de eso ya ni se reimprime, solo circula usado acá), otra de Novela negra y policial (Simenon y su comisario Maigret, Camilleri, Christie y todos los del género), y una de Megan Maxwell para las que siguen sus sagas. Sumé también una vitrina de libros baratos —desde $1.000— para cuando andas con el presupuesto justo. Y porque me llegan vendedores de todo Chile, abrí páginas para Talca, Puerto Montt y Coquimbo, así la gente de esas zonas encuentra lo que está cerca y retira en mano sin pagar despacho. Todo se arma solo con los libros reales que ustedes publican: mientras más suben, más llenas quedan estas vitrinas.",
    tag: "Mejora",
    link: "/libros-de-historia-de-chile",
    linkText: "Ver Historia de Chile",
    visual: {
      kind: "milestone",
      icon: "🗂️",
      metric: "6 vitrinas nuevas",
      detail: "por tema (historia, policial, ofertas) y por ciudad (Talca, Pto Montt, Coquimbo)",
    },
  },
  {
    date: "19 junio 2026",
    title: "Limpié 970 enlaces muertos que confundían a Google desde 2020",
    description:
      "Me metí a las tripas del SEO —esa parte invisible que decide si Google te muestra o no— y me encontré con un fantasma. Resulta que cuando armé este sitio, antes vivía acá otro tuslibros.cl, uno viejo en WordPress del 2020. Ese sitio ya no existe, pero Google seguía teniendo anotadas casi mil direcciones suyas: categorías, páginas de autores, etiquetas… todas rotas, todas tirando error. O sea, Google gastaba su tiempo persiguiendo páginas que murieron hace años en vez de mirar los libros que ustedes publican hoy. Lo encontré armando un sistema nuevo para medir el SEO (el que usaba antes se me venció, así que me pasé a las propias herramientas de Google). Borré los 10 mapas viejos de una: pasamos de 1.829 direcciones declaradas a 858, todas reales. Traducido a algo útil para ti: Google deja de distraerse y se concentra en tu catálogo, así tus libros aparecen mejor en las búsquedas. Y de yapa, los números ya venían subiendo —\"libros usados Temuco\", \"Viña\", \"Santiago\" y \"Providencia\" treparon harto desde mayo.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "🧹",
      metric: "970 enlaces muertos fuera",
      detail: "Google deja de perseguir fantasmas y mira tu catálogo real",
    },
  },
  {
    date: "15 junio 2026",
    title: "Ahora subes tus libros con tus propias fotos, de a montones",
    description:
      "Esta la pidió Carlos, de CIM Libros, uno de los vendedores que más se la juega acá. Me escribió un sábado con una propuesta concreta para que la carga masiva fuera más rápida: poder decir, en el mismo archivo, qué foto va de portada y cuáles van en la galería de cada libro. Tenía toda la razón. Así que rehíce el importador: ahora subes tu planilla CSV y, al lado, todas tus fotos de una vez. El sistema las calza solas con cada libro por el nombre del archivo —una columna para la portada, otra para el resto— y si subes fotos desde el iPhone (esos HEIC odiosos) las convierte sin que tengas que hacer nada. Antes, para usar tus propias fotos, tenías que mandármelas y yo las cargaba a mano. Ya no: lo haces tú, completo, en dos clics.",
    tag: "Mejora",
    link: "/mis-libros/importar",
    linkText: "Ir al importador",
    visual: {
      kind: "milestone",
      icon: "📚",
      metric: "CSV + fotos propias",
      detail: "portada y galería se calzan solas por nombre de archivo",
    },
  },
  {
    date: "12 junio 2026",
    title: "Están llegando vendedores de todo Chile (y el tráfico subió 48%)",
    description:
      "Esta semana me tocó la mejor pega: dar la bienvenida a vendedores nuevos que llegaron solos, sin que yo saliera a buscarlos. Josefa con novela juvenil y romance, Fabián desde Talca con harta historia de Chile y clásicos, Sol desde Temuco con psicología y crecimiento personal, además de Lorena en Concepción y Nicolás en Melipeuco. Me senté a ordenar cada catálogo por dentro —categoricé libro por libro para que se encuentren— y los dejé destacados en la portada. Y mientras hacía eso, miré los números: 2.925 páginas vistas en 7 días, un 48% más que la semana anterior, con la gente quedándose a navegar (6% de rebote, 5 páginas por visita). Despacio, pero pasa.",
    tag: "Señal",
    visual: {
      kind: "stat",
      stats: [
        { big: "+48%", small: "tráfico vs. semana anterior" },
        { big: "5", small: "vendedores nuevos de regiones" },
        { big: "6%", small: "tasa de rebote" },
      ],
    },
  },
  {
    date: "27 mayo 2026",
    title: "Ordené el catálogo por dentro: colecciones más llenas",
    description:
      "Me puse a limpiar el detrás de escena. Había libros tirados en la categoría \"otros\" que en realidad eran historia, arte o ficción, y los reubiqué donde corresponde. También arreglé las etiquetas: el mismo tema aparecía escrito de dos formas distintas (\"ensayo\" y \"Ensayo\", \"clásicos\" y \"Clasico\"), así que partía la colección en dos y mostraba filtros repetidos. Las unifiqué. ¿Resultado? Pasé de 43 etiquetas a 33, sin repetidas, y las colecciones del home quedaron más llenas: ahora cuando entras a \"Clásicos\" o \"Ensayo\" aparecen todos los libros, no la mitad. Aburrido de explicar, pero se nota al navegar.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "🏷️",
      metric: "43 → 33 etiquetas",
      detail: "sin duplicadas — colecciones del home más completas",
    },
  },
  {
    date: "22 mayo 2026",
    title: "101 personas entraron hoy — y 4 llegaron desde ChatGPT",
    description:
      "289 páginas vistas, 101 sesiones únicas, 7 usuarios logueados. Lo más visitado después del home: /publish con 22 visitas, lo que significa que hay gente queriendo publicar libros hoy. Y algo que me pareció importante registrar: 4 sesiones llegaron con utm_source=chatgpt.com — alguien le preguntó a ChatGPT dónde comprar libros usados en Chile y tuslibros.cl apareció como respuesta. El llms.txt que publicamos hace unas semanas está funcionando.",
    tag: "Señal",
    visual: {
      kind: "stat",
      stats: [
        { big: "101", small: "sesiones únicas hoy" },
        { big: "22", small: "visitas a /publish" },
        { big: "4", small: "llegaron desde ChatGPT" },
      ],
    },
  },
  {
    date: "21 mayo 2026",
    title: "Bloqueamos bots de Vietnam, India y Filipinas",
    description:
      "Google Analytics mostró algo raro: 195 usuarios de Vietnam en 7 días — el doble que Chile. Para un marketplace chileno de libros, eso no es tráfico real. Activamos reglas en el Vercel Firewall para bloquear tráfico de Vietnam, India y Filipinas a nivel de plataforma, antes de que los requests consuman recursos. Brasil y México los dejamos pasar porque son hispanohablantes y podrían tener compradores reales.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "🛡️",
      metric: "3 países bloqueados",
      detail: "Vietnam · India · Filipinas — tráfico bot eliminado",
    },
  },
  {
    date: "21 mayo 2026",
    title: "Rate limiting en todos los endpoints de la API",
    description:
      "Agregamos un límite de 60 requests por minuto por IP en todas las rutas /api/*. En modo monitoreo por ahora: registra pero no bloquea, para detectar si algún cliente legítimo podría verse afectado. En 48 horas, si no hay falsos positivos, lo pasamos a bloqueo real con error 429.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "⚡️",
      metric: "60 req/min",
      detail: "rate limit por IP en /api — en modo log",
    },
  },
  {
    date: "19 mayo 2026",
    title: "Nunca te vas con las manos vacías: Rediseño de Búsquedas",
    description:
      "Cuando buscabas un libro que no teníamos, la página se veía un poco triste (literalmente decía \"No lo encontramos\" y te dejaba una pantalla en blanco). Rediseñamos esa experiencia: ahora el buscador te invita amigablemente a dejar tu pedido para que la comunidad lo vea, y mientras tanto, te muestra una selección curada de libros destacados de la semana para que descubras algo nuevo.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "🎨",
      metric: "UX Search",
      detail: "rediseño del empty state + recomendaciones",
    },
  },
  {
    date: "19 mayo 2026",
    title: "Más fáciles de encontrar en Google: Landings locales y de nicho",
    description:
      "Publicamos tres páginas maestras para el buscador. Una dedicada a \"Libros antiguos y coleccionables\", y dos enfocadas en la búsqueda local más fuerte: \"Libros usados en Santiago\" y la hiperlocal \"Libros usados en Providencia\" (donde se concentra nuestro catálogo). Además, ahora cada vez que ves un libro, la misma página te recomienda más libros del mismo autor o género, conectando todo el catálogo de forma automática. Google ahora puede rastrear tus libros de forma más plana y rápida.",
    tag: "Lanzamiento",
    visual: {
      kind: "milestone",
      icon: "🗺️",
      metric: "Landings SEO",
      detail: "Santiago + Libros Antiguos + Internal Linking",
    },
  },
  {
    date: "13 mayo 2026",
    title: "Posición #1 en Google para \"vender libros usados Chile\"",
    description:
      "Ayer estábamos en posición 11. Hoy Google nos puso en el primer lugar para la búsqueda \"vender libros usados Chile\". El salto fue de 10 posiciones en menos de 24 horas, con visibilidad del 100% según SEMrush. Lo que lo desencadenó: agregamos preguntas frecuentes a la página /vender con el formato que Google prefiere para mostrar respuestas directas en los resultados. Si alguien busca dónde vender sus libros, tuslibros.cl aparece primero.",
    tag: "SEO",
    visual: {
      kind: "milestone",
      icon: "🥇",
      metric: "#1 en Google",
      detail: "\"vender libros usados Chile\" — salto de 89 posiciones",
    },
  },
  {
    date: "13 mayo 2026",
    title: "Libros destacados con movimiento",
    description:
      "La fila de libros destacados en la portada ahora se desplaza sola. Los libros circulan en loop para que siempre haya algo nuevo a la vista. El scroll se pausa si pasas el mouse encima.",
    tag: "UX",
    visual: {
      kind: "covers",
      match: (l) => !!(l as any).featured,
      limit: 6,
    },
  },
  {
    date: "12 mayo 2026",
    title: "Tiendas de vendedores con URL propia",
    description:
      "Cada vendedor tiene ahora su propia dirección web con nombre: tuslibros.cl/vendedor/buhardilla, tuslibros.cl/vendedor/cimlibros, etc. Antes la URL era una cadena de letras y números que nadie podía recordar ni compartir. Ahora es tu nombre.",
    tag: "Mejora",
    link: "/vendedor/buhardilla",
    linkText: "Ver ejemplo",
  },
  {
    date: "12 mayo 2026",
    title: "Aviso automático cuando aparece un libro que buscabas",
    description:
      "Si pediste un libro en la sección \"Se busca\" y alguien lo publica, te llega un email al tiro con el link directo. Sin que tengas que volver a revisar el sitio. Hoy funcionó por primera vez: alguien pidió El gato negro de Poe, Libros De La Buhardilla lo publicó y el buscador recibió el aviso en minutos.",
    tag: "Nuevo",
    link: "/solicitudes",
    linkText: "Pedir un libro",
  },
  {
    date: "6 mayo 2026",
    title: "API para librerías: sincroniza tu catálogo desde cualquier sistema",
    description:
      "Si tienes una librería con inventario en otro sistema — PrestaShop, Shopify, una base propia — ahora puedes conectarla a tuslibros.cl por código. Con la nueva API REST v1 puedes listar tus publicaciones, crear nuevas, actualizar precios y condición, y pausar libros cuando los vendas en otro canal. Todo con una API key que generas desde tu perfil. El caso de uso más útil: vender un libro en MercadoLibre o Instagram y, en el mismo momento, mandar un PATCH a tuslibros para pausar esa publicación automáticamente — así no le vendes el mismo libro a dos personas. Si te interesa integrar tu catálogo, avísame por WhatsApp.",
    tag: "Nueva herramienta",
    link: "/perfil",
    linkText: "Generar mi API key",
    visual: {
      kind: "milestone",
      icon: "🔌",
      metric: "API v1",
      detail: "listar · crear · pausar · sincronizar stock",
    },
  },
  {
    date: "6 mayo 2026",
    title: "Tags que siempre tienen libros: adiós a los clicks vacíos",
    description:
      "Los tags del sidebar (Poesía, Historia, PremioNobel, etc.) ahora solo aparecen si hay al menos un libro activo con esa etiqueta. Se calcula en tiempo real desde el catálogo y se refresca cada 5 minutos. Antes podías hacer click en \"#Suspenso\" y llegar a cero resultados. Ya no.",
    tag: "Fix",
    visual: {
      kind: "milestone",
      icon: "🏷️",
      metric: "Tags dinámicos",
      detail: "solo muestran lo que existe en el catálogo hoy",
    },
  },
  {
    date: "5 mayo 2026",
    title: "Vitrinas escolares y limpieza profunda para el lanzamiento 🚀",
    description:
      "Hoy preparamos la casa para la nueva fase de distribución. Reorganizamos la portada para destacar exclusivamente los textos de Lectura Complementaria (¡hola, Julito Cabello!). Además, limpiamos el mapa del sitio (Sitemap) eliminando 43 URLs conflictivas que confundían a Google, exterminamos cuentas bot de la base de datos, y arreglamos un bug que hacía que algunas categorías principales como 'Idiomas' mostraran 0 libros. La plataforma está rápida, limpia y lista para recibir a los nuevos lectores.",
    tag: "Lanzamiento",
    visual: {
      kind: "milestone",
      icon: "🧹",
      metric: "Ready to launch",
      detail: "SEO limpio y portada enfocada en colegios",
    },
  },
  {
    date: "5 mayo 2026",
    title: "🇨🇱 Nueva taxonomía literaria chilena",
    description:
      "Hoy dimos un salto gigante en la organización del catálogo. Estrenamos categorías específicas para el lector chileno: Poesía, Novela Negra/Policial, Teatro, Humanidades y una sección reforzada de Lectura Complementaria. Ahora es mucho más fácil encontrar esa joya literaria o el libro que piden en el colegio, con una estructura pensada en cómo buscamos libros nosotros.",
    tag: "Lanzamiento",
    link: "/",
    linkText: "Explorar categorías",
    visual: {
      kind: "milestone",
      icon: "📚",
      metric: "Taxonomía Pro",
      detail: "Poesía, Policial, Teatro y más",
    },
  },
  {
    date: "5 mayo 2026",
    title: "Descubre por 'vibras': Nueva Nube de Temas",
    description:
      "¿No sabes qué buscar? Estrenamos una 'Nube de Temas sugeridos' en la barra lateral. Ahora puedes saltar directo a #NovelaChilena, #Suspenso, #Borges o #PrimeraEdición con un solo clic. Etiquetamos automáticamente más de 100 libros del catálogo para que estas etiquetas siempre tengan contenido fresco esperándote.",
    tag: "Nuevo",
    link: "/",
    linkText: "Ver temas sugeridos",
    visual: {
      kind: "milestone",
      icon: "🏷️",
      metric: "#Temas",
      detail: "Navegación por etiquetas visuales",
    },
  },
  {
    date: "5 mayo 2026",
    title: "Más rápido que nunca en tu celular",
    description:
      "Escuchamos a la comunidad: algunos celulares se sentían 'pegados' al navegar. Aplicamos una optimización de choque eliminando procesos invisibles y simplificando animaciones en móviles. El resultado es un sitio que vuela, con un tiempo de respuesta mucho más bajo para que puedas comprar y vender sin lag, estés donde estés.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "⚡️",
      metric: "Speed Boost",
      detail: "Optimización de TBT en móviles",
    },
  },
  {
    date: "29 abril 2026",
    title: "Nuevo lector con linterna (flash) y escaneo más sensible",
    description:
      "Vero me reportó que el lector de libros andaba 'pésimo' con algunos títulos nuevos. Lo rehice completo. Ahora el escáner tiene un botón de linterna ⚡️ para esos libros en estantes oscuros, un área de captura más grande y mejor sensibilidad (20 FPS). Además, si escaneas un libro que no está en las bases de datos internacionales, te permite seguir con el ingreso manual sin perder el ISBN que ya detectó. Y para que no hayan puntos ciegos, ahora me avisa por Telegram cada vez que alguien escanea algo que no encontramos, así podemos ver qué falta y agregarlo.",
    tag: "Mejora",
    link: "/publish",
    linkText: "Probar el nuevo lector",
    visual: {
      kind: "milestone",
      icon: "⚡️",
      metric: "Flash activo",
      detail: "escaneo en la oscuridad +20 FPS",
    },
  },
  {
    date: "22 abril 2026",
    title: "Día del Libro: 13 libros con hasta 50% de descuento",
    description:
      "Para el 23 de abril armé ofertas reales en 13 libros del catálogo. No son números inflados para simular descuentos: son libros que tenía a precio de librería tradicional y que bajé agresivamente para que sirvan como regalo o antojo de fin de mes. Carpe Diem de $29.900 → $14.900. Elogio de la sombra y Opus nigrum, ambos de Yourcenar, de $32.990 → $16.490. Ojo del Espíritu (Ken Wilber) de $28.000 → $13.990. La montaña mágica de Mann de $18.000 → $8.990. Tres ediciones de Biblioteca de Babel (Borges dirigió esa colección) con 40% off: Bartleby el escribiente, La puerta en el muro, El cardenal Napellus. El precio anterior queda tachado en la ficha para que la oferta sea transparente.",
    tag: "Oferta",
    link: "/",
    linkText: "Ver el home con ofertas",
    visual: {
      kind: "milestone",
      icon: "🎉",
      metric: "Hasta 50% off",
      detail: "13 libros con precio tachado real",
    },
  },
  {
    date: "22 abril 2026",
    title: "Registro simplificado: 3 campos y listo",
    description:
      "El formulario de registro pedía nombre, correo, contraseña, país, región y comuna. Era demasiado para alguien que solo quiere mirar. Lo dejé en tres campos: nombre, correo, contraseña. País y región se deducen después cuando vas a comprar o publicar (ahí sí hace sentido pedirlos). También moví el botón de Google arriba del formulario para que el registro con un clic sea la primera opción visible. Y si te registras con correo, automáticamente te suscribo al newsletter — así los avisos de libros nuevos te llegan sin que tengas que hacer un paso extra.",
    tag: "Mejora",
    link: "/register",
    linkText: "Probar el registro",
    visual: {
      kind: "milestone",
      icon: "✍️",
      metric: "3 campos",
      detail: "antes pedía 6, ahora solo lo esencial",
    },
  },
  {
    date: "22 abril 2026",
    title: "Segundo testimonio en la home: Camilo de Concepción",
    description:
      "Camilo fue el comprador del primer envío a región — un bundle de 3 libros a Concepción por Starken. Esta semana me escribió contando que llegaron rápido, en buen estado y con una sorpresa: puse una postal a mano dentro del paquete. Me dio permiso para publicar sus palabras y ahora la home muestra dos testimonios reales: el de Z. (retiro en Providencia) y el de Camilo (envío a región). Dos tipos de compra, dos lugares, dos voces. La prueba social deja de ser un caso aislado.",
    tag: "Hito",
    visual: {
      kind: "quote",
      text: "Encantado con mi primera compra. Los libros llegaron rápido y en buen estado hasta la puerta de mi casa, además con una sorpresa buenísima. Una experiencia recomendada 👌🏻",
      who: "Camilo · Concepción",
      book: "Bundle de 3 libros por Starken",
    },
  },
  {
    date: "22 abril 2026",
    title: "Si te vas sin comprar, déjame tu correo y te aviso cuando llegue algo",
    description:
      "Agregué una tarjeta discreta que aparece después de 25 segundos navegando el home: pide un correo a cambio de avisos cuando entren libros que puedan gustarte. No es un pop-up agresivo, no tapa la pantalla, se cierra con una X. Si ya me dejaste tu correo no la volvemos a mostrar. Es una red para capturar interés temprano — la gente que entra, mira y se va sin registrarse es la que más se pierde, y ahora al menos queda un hilo.",
    tag: "Lanzamiento",
    visual: {
      kind: "milestone",
      icon: "📬",
      metric: "Lead capture",
      detail: "correo antes de que se vayan",
    },
  },
  {
    date: "22 abril 2026",
    title: "Publicar es más fácil: sin ISBN también puedes, y Vero te ayuda si tienes muchos",
    description:
      "Arreglé el formulario de publicar para que no asuma que todos tienen el ISBN a la mano. Ahora hay dos botones grandes, al mismo nivel: \"Escanear código de barras\" y \"Sin ISBN · ingreso manual\". Además agregué una explicación clara del despacho puerta a puerta con Shipit (tú imprimes la etiqueta, el courier pasa a buscar el libro a tu casa, no tienes que ir a ninguna oficina). Y una invitación: si tienes varios libros, no pierdas la tarde subiéndolos de a uno — me mandas un Excel o una foto de la ruma por WhatsApp y te los cargo yo. Quitar fricción en el onboarding del vendedor es lo único que permite escalar el catálogo sin pedirle esfuerzo al usuario.",
    tag: "Mejora",
    link: "/publish",
    linkText: "Ir a publicar",
    visual: {
      kind: "milestone",
      icon: "📦",
      metric: "Puerta a puerta",
      detail: "Shipit pasa por tu casa · sin oficinas",
    },
  },
  {
    date: "22 abril 2026",
    title: "Protección contra bots y scrapers de LLM",
    description:
      "Vercel me alertó de un ataque automatizado desde proxies residenciales chilenos — alguien con un script de scraping golpeando el sitio en paralelo. Agregué bloqueos en el middleware contra los user-agents típicos de bots (Puppeteer, Playwright, Selenium, PhantomJS, scripts en Python, Go y Node que no se identifican). Además actualicé el robots.txt para bloquear por completo los crawlers que entrenan LLMs sin devolver tráfico — GPTBot, ClaudeBot, CCBot, Bytespider, Amazonbot, Google-Extended, entre otros. Google y Bing de búsqueda siguen pasando normal, y ChatGPT-User y PerplexityBot también (esos sí citan con clicks reales al sitio). Es higiene de infraestructura pero ahorra compute y protege a los vendedores que publican fotos y descripciones de su catálogo.",
    tag: "Fix",
    visual: {
      kind: "milestone",
      icon: "🛡️",
      metric: "13 crawlers",
      detail: "bloqueados del scraping LLM",
    },
  },
  {
    date: "22 abril 2026",
    title: "Primera semana en el radar SEO de Chile — somos el único dominio del sector que sube",
    description:
      "SEMrush me mandó el reporte de Position Tracking del sector librerías online en Chile (período 15-22 abril). Buscalibre, Librería Literata, Green Libros, Libros del Ayer, Libros El Cid, Casa del Libro: los siete competidores que me rodean están en rojo esta semana (entre -0.13% y -2.68%). tuslibros.cl es el único dominio que sube — +2.19% en visibilidad orgánica. Pasé de posición 9 a posición 5. Es una semana, no una tendencia — pero es la señal más clara que he tenido de que los fixes de SEO de los últimos 15 días están siendo leídos por Google. La siguiente métrica a cruzar es cuánto de esto se traduce en clicks reales.",
    tag: "Señal",
    visual: {
      kind: "milestone",
      icon: "📈",
      metric: "+2.19%",
      detail: "visibilidad SEO — único del sector subiendo",
    },
  },
  {
    date: "22 abril 2026",
    title: "17 títulos que alguien está buscando y no encuentra — si los tienes en casa, súbelos",
    description:
      "Revisé las búsquedas que hacen los usuarios en el buscador interno del sitio. De las 19 búsquedas más repetidas, 17 no tienen match en el catálogo hoy. Son títulos concretos que alguien vino a buscar y se fue sin encontrar: Aun tenemos patria, El túnel (Sábato), Administración una perspectiva global (Koontz), MBA personal, El archivo de Sherlock Holmes, Hollywood (Bukowski), Percy Jackson El ladrón del rayo, Medicina interna Farreras Rozman, Historia de Chile 4, Seda (Baricco), Traficantes y lavadores (Salazar), Física Giancoli, Bajo la misma estrella, Gran libro del Kamasutra, Microeconomía, Magnus Chase y los dioses de Asgard. Si tienes alguno durmiendo en una estantería, súbelo — hay demanda real, específica, esperando.",
    tag: "Demanda",
    link: "/publish",
    linkText: "Publicar un libro",
    visual: {
      kind: "milestone",
      icon: "🔍",
      metric: "17 títulos",
      detail: "buscados sin resultado esta semana",
    },
  },
  {
    date: "21 abril 2026",
    title: "Nueva página dedicada a libros usados en Chile",
    description:
      "Publiqué una landing específica en /libros-usados-chile con foco en quién llega desde Google buscando la frase exacta. Tiene el hero de la casa, los tres diferenciadores (mapa, curación, pago seguro), el testimonio de Z., una grilla con los libros destacados del día y una sección de preguntas frecuentes que suelo responder por WhatsApp. Esta página trabaja a la par del home: el home es para quien ya conoce tuslibros.cl; esta es para quien recién lo está encontrando.",
    tag: "Lanzamiento",
    link: "/libros-usados-chile",
    linkText: "Ver la página nueva",
    visual: {
      kind: "milestone",
      icon: "🌱",
      metric: "Página SEO",
      detail: "para quien llega desde Google",
    },
  },
  {
    date: "21 abril 2026",
    title: "40 libros ahora tienen ficha enriquecida",
    description:
      "Pasé 40 libros del catálogo por Google Books y Open Library para completarles sinopsis, editorial y número de páginas. Son libros que habían quedado con ficha pelada — solo título y autor. Ahora tienen contexto real para el comprador que llega desde una búsqueda. Quedaron 69 libros sin datos públicos disponibles (ediciones demasiado antiguas o locales); a esos los enriqueceremos a mano cuando pueda.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "📚",
      metric: "40 fichas",
      detail: "con sinopsis, editorial y páginas",
    },
  },
  {
    date: "21 abril 2026",
    title: "Los títulos en Google ya no se cortan a la mitad",
    description:
      "Google recorta títulos de más de 60 caracteres en los resultados de búsqueda. Muchas fichas de libros quedaban cortadas feo — aparecían como \"Historia de la filosofía occidental desde Grec...\" sin autor ni precio. Ajusté el generador de títulos para que priorice el título del libro, el autor y el precio de forma inteligente, truncando con puntos suspensivos sólo cuando hace falta.",
    tag: "Fix",
    visual: {
      kind: "milestone",
      icon: "🔍",
      metric: "94 fichas",
      detail: "con títulos optimizados para Google",
    },
  },
  {
    date: "21 abril 2026",
    title: "Adiós al banner de \"Versión beta\"",
    description:
      "Llevo 3 semanas con el sitio abierto al público, con ventas reales, split payment funcionando, 207 libros publicados y 17 usuarios registrados. Ya no es beta. Saqué el banner amarillo que estaba arriba del navbar — de ahora en adelante tuslibros.cl es un producto en marcha, no un experimento.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "🚀",
      metric: "De beta a producto",
      detail: "3 semanas, 207 libros, ventas reales",
    },
  },
  {
    date: "21 abril 2026",
    title: "El mapa ahora abre por default en desktop",
    description:
      "Antes había que scrollear hasta \"Tienda\" y hacer click en \"Mapa\" para verlo. Ahora en computador la tienda parte directo con el mapa abierto — 144 libros en Providencia, 32 en Ñuñoa, 2 en Las Condes, todos visibles al entrar. En celular se queda en grilla (ahí el scroll manda). También subí la sección completa arriba de las colecciones, para que el toggle esté más cerca del hero, y cambié el estilo del mapa a uno con más detalle (nombres de calles, relieves suaves).",
    tag: "Mejora",
    link: "/mapa",
    linkText: "Ver el mapa completo",
    visual: {
      kind: "milestone",
      icon: "🗺️",
      metric: "Mapa arriba",
      detail: "los libros por ubicación como primera impresión",
    },
  },
  {
    date: "21 abril 2026",
    title: "Click en un libro del mapa ahora te lleva a su ficha",
    description:
      "Esto era un detalle que me molestaba: si estabas en el mapa y clickeabas un libro de la lista lateral, te centraba el mapa en ese punto — lo cual era útil, pero no era lo que uno espera. Ahora el click te lleva directo a la ficha del libro (ver descripción, fotos, comprar). El \"centrar en el mapa\" queda como un botón chico de pin que aparece al hacer hover.",
    tag: "Fix",
    visual: {
      kind: "milestone",
      icon: "🎯",
      metric: "Click = ficha",
      detail: "comportamiento esperado, sin clicks perdidos",
    },
  },
  {
    date: "21 abril 2026",
    title: "\"Se busca\" ahora también aparece arriba del hero",
    description:
      "Las solicitudes que hace la comunidad (el /solicitudes) estaban solo en la mitad del home. Agregué una franja ámbar arriba de todo, pegada al navbar, que muestra la solicitud más reciente: \"Alguien en X busca tal libro — ¿lo tienes? Publícalo →\". Click lleva directo a publicar ese libro con el título ya autocompletado. Es un gancho de demanda — los vendedores ven una oportunidad concreta al entrar.",
    tag: "Lanzamiento",
    link: "/solicitudes",
    linkText: "Ver todas las solicitudes",
    visual: {
      kind: "milestone",
      icon: "🔔",
      metric: "Demanda visible",
      detail: "solicitud activa en el primer vistazo",
    },
  },
  {
    date: "20 abril 2026",
    title: "Nuevo titular en la home: tuslibros, los que ya leíste y los que te faltan",
    description:
      "El H1 de la home decía \"Libros usados en Chile, con envío o retiro en mano\" — funcional pero genérico, podía ser cualquier marketplace. Lo cambié a \"tuslibros, los que ya leíste y los que te faltan\". Más corto, más emocional, y pone el nombre arriba (que es lo que Google también va a indexar). El subtítulo ahora dice \"X ejemplares disponibles hoy\" en vez de \"libros publicados\", para dejar claro que son stock real.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "📖",
      metric: "tuslibros",
      detail: "los que ya leíste y los que te faltan",
    },
  },
  {
    date: "19 abril 2026",
    title: "Economía inversa: ahora los compradores piden y los vendedores escuchan",
    description:
      "Un usuario me escribió por WhatsApp buscando \"El fin de la historia y el último hombre\" de Fukuyama — no lo teníamos. Le dije que buenísima idea: en vez de que solo los vendedores publiquen y los compradores busquen, que también funcione al revés. Los compradores dejan una solicitud y los vendedores que tienen el libro lo publican. Ya vive en la home como \"Se busca · La comunidad pide\" y tiene su propia página en /solicitudes. La primera solicitud es justo la de Fukuyama — si alguien la tiene, que la publique.",
    tag: "Lanzamiento",
    link: "/solicitudes",
    linkText: "Ver solicitudes abiertas",
    visual: {
      kind: "milestone",
      icon: "🔁",
      metric: "Demanda → Oferta",
      detail: "la comunidad pide, los vendedores responden",
    },
  },
  {
    date: "19 abril 2026",
    title: "La home ahora muestra libros arriba en 1 segundo",
    description:
      "Revisé Analytics: 72% de la gente entraba a la home y se iba sin clickear nada. Motivo: no se veía ni un libro arriba, había que pasar el manifiesto entero antes de ver catálogo. Lo reordené. Ahora el hero ocupa menos espacio, tiene un mini-testimonio de Z. al lado, y los libros destacados aparecen al segundo. También saqué 4 secciones largas de marketing (scan, pago, envío, arriendo) que duplicaban lo de arriba — viven en sus landings (/vender, /como-funciona, /como-despachar). Y en mobile compacté el navbar.",
    tag: "Mejora",
    visual: {
      kind: "stat",
      stats: [
        { big: "~6000 → 3800 px", small: "altura total de la home" },
        { big: "10 → 6", small: "secciones de scroll" },
        { big: "72% → ?", small: "bounce rate (a medir en 48h)" },
      ],
    },
  },
  {
    date: "18 abril 2026",
    title: "Limpieza grande de SEO: Google va a volver a mirar el sitio con cariño",
    description:
      "Trabajé toda la tarde el SEO. 10,9 mil URLs basura legacy de la versión Woocommerce ahora responden con 410 (se fue para siempre). Agregué schema.org WebSite con SearchAction, extendí el Organization con areaServed=Chile y enriquecí 78 fichas de libros con sinopsis, editorial y páginas. En 2–4 semanas las páginas indexadas deberían saltar de 19 a varios cientos.",
    tag: "Mejora",
    visual: {
      kind: "stat",
      stats: [
        { big: "10,9K", small: "URLs legacy devueltas con 410 Gone" },
        { big: "78", small: "fichas enriquecidas con sinopsis + editorial" },
        { big: "19 → 100s", small: "páginas indexadas proyectadas en 2–4 semanas" },
      ],
    },
  },
  {
    date: "18 abril 2026",
    title: "El courier pasa a buscar los libros a tu casa (sí, a TU casa)",
    description:
      "La guía de despacho decía al revés (\"lleva el paquete a la sucursal\"). Error viejo, ya arreglado: Shipit coordina un retiro a domicilio y un courier pasa por el paquete a la dirección que tienes registrada. Corte diario 11 AM. También saqué un \"etiqueta demorada · pide ayuda\" en rojo que aparecía en Mis Ventas cuando en realidad el courier trae el manifiesto impreso al retiro.",
    tag: "Fix",
    visual: {
      kind: "milestone",
      icon: "📦",
      metric: "11 AM",
      detail: "corte diario del retiro Shipit a domicilio",
    },
  },
  {
    date: "18 abril 2026",
    title: "El comparador de precios ahora también es para quien compra",
    description:
      "Un usuario me lo pidió por WhatsApp: que los compradores también pudieran comparar el precio del libro con otros sitios. Dicho y hecho. Ahora en cada libro ves el precio de tuslibros.cl al lado de cuatro links directos — Buscalibre, MercadoLibre, IberLibro y Facebook Marketplace — para chequear el mismo título afuera. Nada que ocultar.",
    tag: "Nuevo",
    visual: {
      kind: "milestone",
      icon: "🔍",
      metric: "4 sitios",
      detail: "Buscalibre · MercadoLibre · IberLibro · Facebook Marketplace",
    },
  },
  {
    date: "16 abril 2026",
    title: "El primer testimonio en la home",
    description:
      "Un comprador real que ya recibió su libro accedió a que publicara su experiencia. Ahora aparece en la portada. No es copy mío: son sus palabras. Ojalá el primero de muchos.",
    tag: "Hito",
    visual: {
      kind: "quote",
      text: "Fácil y sin complicaciones. Muy buena disposición por parte del vendedor, volvería a comprar sin ningún problema.",
      who: "— Z.",
      book: "La Marina en la historia de Chile — Tomo I",
      match: (l) => titleMatches(l, ["marina"]) && /chile/i.test(l.book.title ?? ""),
    },
  },
  {
    date: "16 abril 2026",
    title: "Home más directa + más visibilidad en Google",
    description:
      "Rehice el titular de la portada para que se entienda en 2 segundos qué es tuslibros.cl: \"Libros usados en Chile, con envío o retiro en mano\". Y corregí algo importante: hasta ayer Google indexaba fichas con URLs feas tipo /listings/UUID; ahora indexa las URLs bonitas /libro/vendedor/slug, con título, precio y \"usado\" en el resultado. Cada libro pasa a ser una puerta de entrada nueva.",
    tag: "Mejora",
    visual: {
      kind: "milestone",
      icon: "🏠",
      metric: "/libro/vendedor/slug",
      detail: "cada libro, una puerta de entrada nueva a Google",
    },
  },
  {
    date: "16 abril 2026",
    title: "Tres nuevas piezas de colección en el catálogo",
    description:
      "Sumé tres joyas a la sección de coleccionables: \"Un Año\" y \"Ayer\" de Juan Emar (vanguardia chilena del 35, edición Biblioteca Claves de Chile + LOM), y una antología de Pablo de Rokha editada en La Habana en 1991 durante el Período Especial, papel rústico y todo. Si te gusta la literatura chilena de los márgenes, míralas.",
    tag: "Lanzamiento",
    visual: {
      kind: "covers",
      match: (l) => titleMatches(l, ["emar", "rokha", "un año", "ayer"]),
      limit: 4,
      caption: "Juan Emar · Pablo de Rokha",
    },
  },
  {
    date: "16 abril 2026",
    title: "Nueva fila: Ediciones especiales y coleccionables",
    description:
      "Hay libros que no son \"libros usados\" — son objetos con historia: primeras ediciones, tirajes viejos de Nascimento, títulos agotados. Ahora tienen su propia sección en la home y un sello distintivo. El primer destacado: una edición Nascimento 1972 de Poemas y Antipoemas de Nicanor Parra.",
    tag: "Nuevo",
    visual: {
      kind: "covers",
      match: (l) => Boolean(l._isCollectible),
      limit: 6,
      caption: "Fila nueva en la home — objetos con historia",
    },
  },
  {
    date: "16 abril 2026",
    title: "Top 10 de libros destacados, ordenado a mano",
    description:
      "Renové los 10 libros destacados de la portada. Antes salían títulos muy de nicho; ahora verás primero los nombres que vale la pena mostrar: Parra, Donoso, Borges, García Márquez, Vargas Llosa, Fuentes, Wilde, Kundera, Monterroso, Franzen.",
    tag: "Mejora",
    visual: {
      kind: "covers",
      match: (l) => Boolean(l._featured),
      limit: 8,
      caption: "Los 10 destacados de la portada, hoy",
    },
  },
  {
    date: "16 abril 2026",
    title: "Mapa con más alma",
    description:
      "El mapa ahora muestra miniaturas de las portadas en el listado lateral, diferencia los libros de colección (círculo oscuro con borde dorado) y los destacados (ámbar vibrante), y cambié el copy: \"Libros a la vuelta de la esquina\". Que aunque tengamos pocos puntos hoy, se vea vivo y con intención.",
    tag: "Mejora",
  },
  {
    date: "16 abril 2026",
    title: "Catálogo más curado en la home y el mapa",
    description:
      "Ahora tengo una forma simple de bajar en el orden libros que no calzan con el tono, sin esconderlos: siguen encontrándose al buscarlos por nombre o en el perfil del vendedor, pero no aparecen arriba en la home ni en el listado del mapa. La primera impresión la cuido yo.",
    tag: "Mejora",
  },
  {
    date: "15 abril 2026",
    title: "Home más rápida (y estable)",
    description:
      "Ajusté el cache del home para que responda al instante y sin quemar CPU. Si pillaste un error pasajero en la tarde, ya quedó resuelto. La portada carga fluida aunque tengamos más tráfico.",
    tag: "Mejora",
  },
  {
    date: "15 abril 2026",
    title: "Portada correcta al compartir en WhatsApp",
    description:
      "Cuando compartías un link de tuslibros.cl por WhatsApp, salía la portada genérica de Open Library en vez de la foto real del libro que subió el vendedor. Ya no. Ahora aparece primero la foto del vendedor, y solo si no tiene se usa la portada por defecto.",
    tag: "Fix",
  },
  {
    date: "15 abril 2026",
    title: "Fix: publicar libros antiguos sin ISBN",
    description:
      "Algunos vendedores reportaron que al publicar libros antiguos sin ISBN, el formulario manual parecía borrarse al tocar el campo. Arreglado: los datos que escribes a mano se conservan aunque cambies de modo.",
    tag: "Fix",
  },
  {
    date: "15 abril 2026",
    title: "La portada ya no empieza en alemán",
    description:
      "Reordené la home: los libros en español y con portada aparecen primero; los que están en otros idiomas quedan al final y llevan una etiqueta visible (DE, EN, FR) para que sepas antes de hacer clic. La primera impresión importa.",
    tag: "Mejora",
  },
  {
    date: "13 abril 2026",
    title: "Vendedores destacados",
    description:
      "Ahora los mejores vendedores aparecen destacados en la portada con su nombre, ciudad y cantidad de libros. Si vendes seguido y cuidas tus publicaciones, podrías ser el próximo.",
    tag: "Nuevo",
  },
  {
    date: "13 abril 2026",
    title: "WhatsApp directo",
    description:
      "¿Tienes una duda? Ahora puedes escribirnos por WhatsApp desde el menú de navegación. Responde Vero, no un bot.",
    tag: "Nuevo",
  },
  {
    date: "13 abril 2026",
    title: "Más filtros de búsqueda",
    description:
      "Ahora puedes filtrar por encuadernación (tapa dura o blanda), editorial y rango de páginas. Para los que saben exactamente lo que buscan.",
    tag: "Mejora",
  },
  {
    date: "13 abril 2026",
    title: "Buscador en tienda del vendedor",
    description:
      "Si un vendedor tiene muchos libros, ahora puedes buscar dentro de su tienda por título o autor. Sin scroll infinito.",
    tag: "Mejora",
  },
  {
    date: "12 abril 2026",
    title: "Página para vendedores",
    description:
      "Nueva landing en tuslibros.cl/vender que explica en 30 segundos cómo publicar un libro. Tres pasos, cero complicaciones. Si conoces a alguien con libros juntando polvo, mándale el link.",
    link: "/vender",
    linkText: "Ver la página",
    tag: "Nuevo",
  },
  {
    date: "12 abril 2026",
    title: "Banners promocionales en el sitio",
    description:
      "Cuando buscas libros o revisas novedades, ves un banner que te invita a vender los tuyos. Porque todo comprador es un vendedor que todavía no se anima.",
    tag: "Mejora",
  },
  {
    date: "12 abril 2026",
    title: "Libros vendidos se quedan en el catálogo",
    description:
      "Cuando un libro se vende, ahora aparece marcado como \"Vendido\" en vez de desaparecer. Así puedes ver qué se ha vendido, buscar similares o contactar al vendedor por si tiene más.",
    tag: "Nuevo",
  },
  {
    date: "12 abril 2026",
    title: "Mantenedor de categorías",
    description:
      "Las categorías ahora se pueden agregar, editar y reordenar desde el panel de administración. Ya no hace falta tocar código para crear una categoría nueva.",
    tag: "Mejora",
  },
  {
    date: "12 abril 2026",
    title: "33 novelas de Maigret, colección Luis de Caralt",
    description:
      "Toda la colección de Georges Simenon — el comisario más famoso de la novela policial francesa — en la edición vintage Luis de Caralt. Investigamos el mercado y estas ediciones valen más de lo que les habíamos puesto: ahora cada una está a $7.990. Si tienes alguno, cuídalo.",
    link: "/search?q=maigret",
    linkText: "Ver la colección",
    tag: "Lanzamiento",
    visual: {
      kind: "covers",
      match: (l) => titleMatches(l, ["maigret", "simenon"]),
      limit: 8,
      caption: "33 tomos · Luis de Caralt · $7.990 c/u",
    },
  },
  {
    date: "11 abril 2026",
    title: "Compra múltiple en un solo pago",
    description:
      "Si tienes varios libros del mismo vendedor en el carrito, ahora los pagas todos juntos con un solo checkout. Un pago, un envío, un tracking. Así debió ser siempre.",
    tag: "Nuevo",
  },
  {
    date: "11 abril 2026",
    title: "Badge del carrito en vivo",
    description:
      "El ícono del carrito ahora muestra cuántos libros tienes. Se actualiza al instante cuando agregas o quitas algo, sin recargar la página.",
    tag: "Mejora",
  },
  {
    date: "11 abril 2026",
    title: "Vendedores ven tus carritos",
    description:
      "Si un vendedor ve que tienes sus libros en el carrito hace días, te puede escribir para ofrecerte un trato. Rescate de ventas en tiempo real.",
    tag: "Nueva herramienta",
  },
  {
    date: "11 abril 2026",
    title: "Perfil progresivo",
    description:
      "Ya no te pedimos todo al registrarte. Teléfono y dirección se piden justo cuando los necesitas: al publicar o al comprar. 20 segundos y sigues.",
    tag: "Mejora",
  },
  {
    date: "11 abril 2026",
    title: "Categoría Mitología",
    description:
      "Mitología griega, nórdica, romana, celta, leyendas y folklore. Sugerida por un vendedor de la comunidad.",
    tag: "Nuevo",
  },
  {
    date: "10 abril 2026",
    title: "Flujo de despacho para vendedores",
    description:
      "Si vendes un libro por courier, ahora recibes un email con la etiqueta de envío lista para imprimir, el tracking y 5 pasos claros para despachar. Todo automático.",
    tag: "Nuevo",
  },
  {
    date: "10 abril 2026",
    title: "Cómo despachar y devoluciones",
    description:
      "Dos páginas nuevas: guía paso a paso para vendedores que despachan por primera vez, y política clara de devoluciones vía Chilexpress.",
    link: "/como-despachar",
    linkText: "Ver guía de despacho",
    tag: "Nueva herramienta",
  },
  {
    date: "10 abril 2026",
    title: "Correo @tuslibros.cl funcionando",
    description:
      "Ahora puedes escribirnos a cualquier dirección @tuslibros.cl y nos llega. Correo de dominio propio para contacto y soporte.",
    tag: "Mejora",
  },
  {
    date: "9 abril 2026",
    title: "Envíos a todo Chile con Shipit",
    description:
      "Ahora puedes recibir libros en tu casa. Al elegir envío courier en el checkout, cotizas en tiempo real entre Starken, Chilexpress, Blue Express, 99 Minutos y más. Eliges el que más te convenga y pagas todo junto.",
    tag: "Lanzamiento",
  },
  {
    date: "9 abril 2026",
    title: "Recuperar contraseña",
    description:
      "¿Olvidaste tu contraseña? Ahora puedes recuperarla desde el login. Te llega un link al correo para crear una nueva.",
    tag: "Nuevo",
  },
  {
    date: "9 abril 2026",
    title: "Categoría Esoterismo",
    description:
      "Tarot, astrología, masonería, ciencias ocultas, espiritismo, metafísica, ovnis y más. Pedido directo de nuestra comunidad.",
    tag: "Nuevo",
  },
  {
    date: "9 abril 2026",
    title: "URLs amigables con tienda por vendedor",
    description:
      "Cada libro ahora tiene su propia URL legible: tuslibros.cl/libro/vendedor/titulo-del-libro. Mejor para compartir, mejor para Google, y cada vendedor empieza a construir su identidad dentro de la plataforma.",
    tag: "Mejora",
  },
  {
    date: "9 abril 2026",
    title: "Categorías y etiquetas",
    description:
      "Todo el catálogo ahora está organizado en 5 categorías principales, 32 subcategorías y etiquetas temáticas. Navega por Novela, Ensayo, No ficción, Infantil o Coleccionable desde el sidebar.",
    tag: "Nueva herramienta",
  },
  {
    date: "9 abril 2026",
    title: "Buscador en Mis Libros",
    description:
      "Si tienes muchos libros publicados, ahora puedes buscar por título o autor directamente en tu panel de publicaciones.",
    tag: "Mejora",
  },
  {
    date: "9 abril 2026",
    title: "Imágenes más rápidas",
    description:
      "Las portadas ahora se comprimen en formato WebP antes de subirse. Cargan más rápido y pesan menos, sin perder calidad visible.",
    tag: "Mejora",
  },
  {
    date: "9 abril 2026",
    title: "Ficha bibliográfica completa",
    description:
      "Cada libro muestra editorial, cantidad de páginas, año de publicación y tipo de encuadernación (tapa dura o blanda). Los datos se auto-completan al buscar por ISBN.",
    tag: "Mejora",
  },
  {
    date: "9 abril 2026",
    title: "Navegación mejorada",
    description:
      "Sidebar de categorías visible en toda la tienda. Breadcrumbs para nunca perder el camino. Tipografía de precios más clara y legible.",
    tag: "Mejora",
  },
  {
    date: "9 abril 2026",
    title: "Portadas restauradas",
    description:
      "Corrimos un barrido automático y restauramos las portadas de 41 libros que estaban sin imagen. Ahora el catálogo se ve mucho mejor.",
    tag: "Mejora",
  },
  {
    date: "8 abril 2026",
    title: "Programa de referidos",
    description:
      "Invita vendedores a tuslibros.cl con tu código personal. Cuando publiquen su primer libro, ganas un descuento en tu próximo despacho.",
    link: "/referidos",
    linkText: "Ver mi código",
    tag: "Nueva herramienta",
  },
  {
    date: "8 abril 2026",
    title: "Alianzas institucionales",
    description:
      "Universidades, bibliotecas y centros de alumnos pueden aliarse con tuslibros.cl para complementar su catálogo. Sin costo, con comisión por referido.",
    link: "/alianzas",
    linkText: "Ver propuesta",
    tag: "Lanzamiento",
  },
  {
    date: "8 abril 2026",
    title: "Mensajería interna",
    description:
      "Ahora puedes enviar mensajes directos a vendedores y compradores dentro de la plataforma. Cada conversación queda vinculada al libro, con bandeja de entrada y notificaciones por email.",
    link: "/mensajes",
    linkText: "Ir a mensajes",
    tag: "Nueva herramienta",
  },
  {
    date: "8 abril 2026",
    title: "Importador masivo CSV",
    description:
      "Ahora puedes subir todos tus libros de una vez con un archivo CSV. Ideal para vendedores con muchos libros. Incluye plantilla descargable y vista previa antes de importar.",
    link: "/mis-libros/importar",
    linkText: "Ir al importador",
    tag: "Nueva herramienta",
  },
  {
    date: "8 abril 2026",
    title: "Contacto directo con vendedores",
    description:
      "Los vendedores ahora pueden mostrar su email e Instagram en su perfil y tienda, para que los compradores los contacten directamente.",
    tag: "Mejora",
  },
  {
    date: "7 abril 2026",
    title: "Ranking por tendencias",
    description:
      "Los libros más buscados en Google ahora aparecen destacados automáticamente. El ranking se actualiza todos los días.",
    tag: "Nueva herramienta",
  },
  {
    date: "6 abril 2026",
    title: "Pagos seguros con MercadoPago",
    description:
      "Ya puedes comprar y vender con pago dividido: el dinero llega directo al vendedor, sin intermediarios manuales.",
    tag: "Lanzamiento",
  },
  {
    date: "6 abril 2026",
    title: "WhatsApp en checkout",
    description:
      "Para entregas presenciales o punto de retiro, ahora puedes coordinar directamente por WhatsApp sin pagar comisión.",
    tag: "Mejora",
  },
];

async function fetchListingPool(): Promise<PoolListing[]> {
  const supabase = createPublicClient();
  const [featured, collectible, maigret, marina, emar, rokha] = await Promise.all([
    supabase
      .from("listings")
      .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username)`)
      .eq("status", "active")
      .eq("featured", true)
      .order("featured_rank", { ascending: true, nullsFirst: false })
      .limit(12),
    supabase
      .from("listings")
      .select(`*, book:books(*), seller:users(id, full_name, avatar_url, username)`)
      .in("status", ["active", "completed"])
      .eq("is_collectible", true)
      .limit(12),
    supabase
      .from("listings")
      .select(`*, book:books!inner(*), seller:users(id, full_name, avatar_url, username)`)
      .in("status", ["active", "completed"])
      .ilike("book.title", "%maigret%")
      .limit(12),
    supabase
      .from("listings")
      .select(`*, book:books!inner(*), seller:users(id, full_name, avatar_url, username)`)
      .in("status", ["active", "completed"])
      .ilike("book.title", "%marina%")
      .limit(4),
    supabase
      .from("listings")
      .select(`*, book:books!inner(*), seller:users(id, full_name, avatar_url, username)`)
      .in("status", ["active", "completed"])
      .or("title.ilike.%emar%,author.ilike.%emar%", { referencedTable: "book" })
      .limit(6),
    supabase
      .from("listings")
      .select(`*, book:books!inner(*), seller:users(id, full_name, avatar_url, username)`)
      .in("status", ["active", "completed"])
      .or("title.ilike.%rokha%,author.ilike.%rokha%", { referencedTable: "book" })
      .limit(6),
  ]);

  const map = new Map<string, PoolListing>();
  const push = (rows: ListingWithBook[] | null, flags: { featured?: boolean; collectible?: boolean } = {}) => {
    rows?.forEach((r) => {
      if (!r?.book) return;
      const existing = map.get(r.id);
      if (existing) {
        if (flags.featured) existing._featured = true;
        if (flags.collectible) existing._isCollectible = true;
        return;
      }
      map.set(r.id, {
        ...r,
        _featured: flags.featured || r._featured,
        _isCollectible: flags.collectible,
      });
    });
  };
  push(featured.data as ListingWithBook[] | null, { featured: true });
  push(collectible.data as ListingWithBook[] | null, { collectible: true });
  push(maigret.data as ListingWithBook[] | null);
  push(marina.data as ListingWithBook[] | null);
  push(emar.data as ListingWithBook[] | null);
  push(rokha.data as ListingWithBook[] | null);
  return Array.from(map.values());
}

function CoverCard({ listing, size = "md" }: { listing: PoolListing; size?: "sm" | "md" | "lg" }) {
  const cover = listing.cover_image_url || listing.book.cover_url;
  const dims =
    size === "lg" ? "w-40 h-56" : size === "sm" ? "w-24 h-32" : "w-32 h-44";
  const titleClass = size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <Link href={libroUrl(listing)} className={`group flex-shrink-0 ${size === "lg" ? "w-40" : size === "sm" ? "w-24" : "w-32"}`}>
      <div className={`relative ${dims} rounded-lg overflow-hidden bg-ink/5 border border-cream-dark/40 shadow-sm group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-300`}>
        {cover ? (
          <Image src={cover} alt={listing.book.title} fill className="object-cover" sizes="200px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-[10px] p-2 text-center font-display italic">
            {listing.book.title}
          </div>
        )}
      </div>
      <p className={`${titleClass} font-semibold text-ink mt-2 line-clamp-2 leading-tight group-hover:text-brand-600 transition-colors`}>
        {listing.book.title}
      </p>
      {listing.price != null && (
        <p className={`${titleClass} text-ink-muted mt-0.5`}>${listing.price.toLocaleString("es-CL")}</p>
      )}
    </Link>
  );
}

function TagPill({ tag, isRecent }: { tag: string; isRecent: boolean }) {
  const label = isRecent ? "Nuevo" : tag;
  const cls = isRecent
    ? "bg-green-50 text-green-700 ring-1 ring-green-200"
    : tag === "Hito"
      ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
      : tag === "Lanzamiento"
        ? "bg-green-50 text-green-700 ring-1 ring-green-200"
        : tag === "Nueva herramienta"
          ? "bg-brand-50 text-brand-600 ring-1 ring-brand-200"
          : tag === "Fix"
            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
            : "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200";
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function daysAgo(date: string): number {
  const meses: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };
  const parts = date.split(" ");
  const d = new Date(Number(parts[2]), meses[parts[1]] ?? 0, Number(parts[0]));
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

async function fetchFulfilledRequests(): Promise<Entry[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("book_requests")
    .select(`
      id, title, author, requester_location, fulfilled_at,
      fulfilled_listing:listings!fulfilled_listing_id(id, slug, cover_image_url, seller:users(username))
    `)
    .eq("fulfilled", true)
    .not("fulfilled_at", "is", null)
    .order("fulfilled_at", { ascending: false })
    .limit(10);
  if (!data) return [];
  const mesesES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return data.map((r: any) => {
    const d = new Date(r.fulfilled_at);
    const dateStr = `${d.getDate()} ${mesesES[d.getMonth()]} ${d.getFullYear()}`;
    const seller = r.fulfilled_listing?.seller?.username;
    const slug = r.fulfilled_listing?.slug;
    const link = seller && slug ? `/libro/${seller}/${slug}` : null;
    const locationText = r.requester_location ? ` en ${r.requester_location}` : "";
    return {
      date: dateStr,
      title: `¡Cumplida! Alguien pedía "${r.title}" y apareció`,
      description: `Alguien${locationText} buscaba este libro en la sección "Se busca". Esta semana apareció: un vendedor lo publicó y ahora está disponible para comprar. La economía inversa funcionando — los compradores piden, los vendedores aparecen.`,
      tag: "Cumplida",
      link: link ?? undefined,
      linkText: link ? "Ver el libro" : undefined,
      visual: {
        kind: "milestone",
        icon: "🎯",
        metric: "Pedido → publicado",
        detail: `${r.title} de ${r.author}`,
      },
    } as Entry;
  });
}

function parseSpanishDate(s: string): number {
  // "21 abril 2026" → timestamp
  const meses: Record<string, number> = { enero:0, febrero:1, marzo:2, abril:3, mayo:4, junio:5, julio:6, agosto:7, septiembre:8, octubre:9, noviembre:10, diciembre:11 };
  const m = s.match(/^(\d+)\s+(\w+)\s+(\d+)$/);
  if (!m) return 0;
  return new Date(Number(m[3]), meses[m[2].toLowerCase()] ?? 0, Number(m[1])).getTime();
}

export default async function NovedadesPage() {
  const pool = await fetchListingPool();
  const fulfilled = await fetchFulfilledRequests();

  // Mezclar novedades hardcoded + cumplimientos dinámicos, ordenar desc por fecha
  const allEntries = [...fulfilled, ...novedades].sort(
    (a, b) => parseSpanishDate(b.date) - parseSpanishDate(a.date)
  );

  const pick = (match: (l: PoolListing) => boolean, limit = 6) =>
    pool.filter(match).slice(0, limit);

  const marinaListing = pool.find((l) =>
    /marina/i.test(l.book.title ?? "") && /chile/i.test(l.book.title ?? "")
  ) ?? pool.find((l) => /marina/i.test(l.book.title ?? ""));

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-warm via-gray-50 to-gray-50">
      {/* MASTHEAD editorial */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-libros.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-50"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/85 to-ink/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,23,0.18),transparent_55%)]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 pt-14 pb-20 md:pt-20 md:pb-28">
          <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
            <span className="h-px w-10 bg-amber-300/70" />
            <p className="text-[11px] uppercase tracking-[0.32em] text-amber-300 font-semibold">
              Diario de tuslibros.cl · Julio 2026
            </p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-cream mb-6 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
            Día 93 — <em className="text-amber-300 not-italic font-normal italic">colecciones, compra clara y menos fricción</em>.
          </h1>
          <p className="text-base md:text-lg text-cream/80 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            Seis vitrinas temáticas con URL propia, la ficha de compra que por fin dice lo que importa y el formulario de publicar sin trámite previo.
            66 libros vendidos y el catálogo sigue creciendo. Lo escribo yo. — Vero
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-10 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
            {[
              { big: "66", small: "libros que encontraron nuevo dueño" },
              { big: "1.100", small: "libros publicados hoy" },
              { big: "40", small: "tiendas activas" },
              { big: "#1", small: "Google \"vender libros usados Chile\"" },
            ].map((s) => (
              <div key={s.small} className="border-l-2 border-amber-300/40 pl-4">
                <p className="font-display text-3xl md:text-4xl text-cream leading-none">{s.big}</p>
                <p className="text-[11px] uppercase tracking-wider text-cream/60 mt-2">{s.small}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 -mt-10 md:-mt-14 relative z-10 pb-16">
        {/* SPOTLIGHT — tres momentos grandes */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <div className="bg-white rounded-2xl border border-cream-dark/40 shadow-sm p-5 hover:shadow-md transition-shadow">
            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-2">Lanzamiento · 2 jul</p>
            <p className="font-display text-lg text-ink leading-snug mb-2">6 colecciones editoriales con URL propia</p>
            <p className="text-xs text-ink-muted">Historia de Chile, Novela Negra, Clásicos, Literatura Chilena, Tarde de Lluvia y Latinoamérica.</p>
          </div>
          <div className="bg-white rounded-2xl border border-cream-dark/40 shadow-sm p-5 hover:shadow-md transition-shadow">
            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-2">Mejora · 1 jul</p>
            <p className="font-display text-lg text-ink leading-snug mb-2">La ficha dice lo que importa</p>
            <p className="text-xs text-ink-muted">Pago protegido visible junto al botón, envío desde $2.900 sin sorpresas, menos ruido.</p>
          </div>
          <div className="bg-white rounded-2xl border border-cream-dark/40 shadow-sm p-5 hover:shadow-md transition-shadow">
            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-2">Mejora · 1 jul</p>
            <p className="font-display text-lg text-ink leading-snug mb-2">Publicar sin trámite previo</p>
            <p className="text-xs text-ink-muted">Antes te mandaba a completar el perfil primero. Ahora entras directo a subir tu libro.</p>
          </div>
        </section>

        <div className="mb-10">
          <PromoBanner variant="circulate" />
        </div>

        {/* TIMELINE de entradas */}
        <div className="space-y-6">
          {allEntries.map((item, i) => {
            const isRecent = daysAgo(item.date) <= 3;
            const v = item.visual;

            // Entry base (shared header + title + description)
            const base = (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <TagPill tag={item.tag} isRecent={isRecent} />
                  <span className="text-[11px] text-ink-muted uppercase tracking-wider">{item.date}</span>
                </div>
                <h2 className="font-display text-xl md:text-2xl text-ink leading-snug mb-2">
                  {item.title}
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed">{item.description}</p>
                {item.link && (
                  <Link
                    href={item.link}
                    className="inline-flex items-center gap-1 mt-4 text-sm text-brand-600 font-semibold hover:gap-2 transition-all"
                  >
                    {item.linkText} <span aria-hidden>→</span>
                  </Link>
                )}
              </>
            );

            // QUOTE — testimonio
            if (v?.kind === "quote") {
              const cover = marinaListing?.cover_image_url || marinaListing?.book.cover_url;
              return (
                <article
                  key={i}
                  className="relative bg-gradient-to-br from-cream-warm to-white rounded-2xl border border-amber-300/40 shadow-sm overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" />
                  <div className="p-6 md:p-8">
                    {base}
                    <div className="mt-6 grid grid-cols-[auto_1fr] gap-6 items-center bg-white/70 rounded-xl border border-cream-dark/30 p-5">
                      {cover && marinaListing ? (
                        <Link href={libroUrl(marinaListing)} className="relative block w-20 h-28 md:w-24 md:h-32 rounded-md overflow-hidden border border-cream-dark/40 shadow-sm hover:shadow-md transition-shadow">
                          <Image src={cover} alt={v.book ?? ""} fill className="object-cover" sizes="120px" />
                        </Link>
                      ) : (
                        <div className="w-20 h-28 bg-cream-dark/30 rounded-md" />
                      )}
                      <blockquote className="relative">
                        <span aria-hidden className="absolute -top-4 -left-2 text-5xl font-display text-amber-500/60 leading-none select-none">“</span>
                        <p className="font-display italic text-base md:text-lg text-ink leading-relaxed">
                          {v.text}
                        </p>
                        <footer className="mt-3 text-xs text-ink-muted">
                          <span className="font-semibold text-ink">{v.who}</span>
                          {v.book && <span> · compró <em>{v.book}</em></span>}
                        </footer>
                      </blockquote>
                    </div>
                  </div>
                </article>
              );
            }

            // STAT — números grandes
            if (v?.kind === "stat") {
              return (
                <article
                  key={i}
                  className="bg-white rounded-2xl border border-cream-dark/40 shadow-sm p-6 md:p-8 animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  {base}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {v.stats.map((s) => (
                      <div key={s.small} className="bg-gradient-to-br from-ink to-ink/90 text-cream rounded-xl p-5">
                        <p className="font-display text-3xl md:text-4xl text-amber-300 leading-none mb-2">
                          {s.big}
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-cream/70 leading-snug">
                          {s.small}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            }

            // MILESTONE — métrica con icono
            if (v?.kind === "milestone") {
              return (
                <article
                  key={i}
                  className="bg-white rounded-2xl border border-cream-dark/40 shadow-sm p-6 md:p-8 animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  {base}
                  <div className="mt-5 flex items-center gap-4 bg-cream-warm/60 rounded-xl border border-cream-dark/30 p-4">
                    <span className="text-3xl" aria-hidden>{v.icon}</span>
                    <div>
                      <p className="font-display text-xl text-ink leading-tight">{v.metric}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{v.detail}</p>
                    </div>
                  </div>
                </article>
              );
            }

            // COVERS — strip de portadas reales
            if (v?.kind === "covers") {
              const listings = pick(v.match, v.limit ?? 6);
              if (listings.length === 0) {
                return (
                  <article
                    key={i}
                    className="bg-white rounded-2xl border border-cream-dark/40 shadow-sm p-6 md:p-8 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                  >
                    {base}
                  </article>
                );
              }
              return (
                <article
                  key={i}
                  className="bg-white rounded-2xl border border-cream-dark/40 shadow-sm overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  <div className="p-6 md:p-8 pb-4">{base}</div>
                  <div className="bg-gradient-to-b from-cream-warm/40 to-cream-warm/70 border-t border-cream-dark/30 px-6 md:px-8 py-6">
                    {v.caption && (
                      <p className="text-[11px] uppercase tracking-wider text-ink-muted mb-3 font-semibold">
                        {v.caption}
                      </p>
                    )}
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                      {listings.map((l) => (
                        <CoverCard key={l.id} listing={l} size="md" />
                      ))}
                    </div>
                  </div>
                </article>
              );
            }

            // Default card
            return (
              <article
                key={i}
                className="bg-white rounded-2xl border border-cream-dark/30 p-6 hover:shadow-sm transition-shadow animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              >
                {base}
              </article>
            );
          })}
        </div>

        {/* FOOTER share */}
        <section className="mt-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700 font-semibold mb-3">Haz circular</p>
          <p className="font-display text-2xl text-ink mb-6 max-w-xl mx-auto leading-snug">
            Si algo de esto te pareció interesante, mándalo a alguien que aún no conoce tuslibros.cl.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/?text=Vero%20est%C3%A1%20construyendo%20tuslibros.cl%20%E2%80%94%20marketplace%20chileno%20de%20libros%20usados%20entre%20personas.%20Con%20pago%20seguro%20y%20env%C3%ADo%20puerta%20a%20puerta.%20Este%20es%20el%20diario%3A%20https%3A%2F%2Ftuslibros.cl%2Fnovedades"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href="https://x.com/intent/post?text=tuslibros.cl%20%E2%80%94%20marketplace%20chileno%20de%20libros%20usados%20entre%20personas.%20Pago%20seguro%20y%20env%C3%ADo%20puerta%20a%20puerta.&url=https%3A%2F%2Ftuslibros.cl%2Fnovedades&via=tuslibroscl"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-ink/85 transition-colors"
            >
              X / Twitter
            </a>
            <Link
              href="/vender"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink/20 text-ink text-sm font-semibold hover:bg-cream-warm transition-colors"
            >
              Publicar mis libros →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
