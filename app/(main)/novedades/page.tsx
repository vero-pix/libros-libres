import Link from "next/link";
import Image from "next/image";
import { createPublicClient } from "@/lib/supabase/public";
import PromoBanner from "@/components/ui/PromoBanner";
import { libroUrl } from "@/lib/urls";
import type { ListingWithBook } from "@/types";

export const metadata = {
  title: "Diario de tuslibros.cl — Abril 2026",
  description:
    "Lo que pasó estas dos semanas en tuslibros.cl: primer testimonio, primer envío a Concepción, 78 fichas enriquecidas, limpieza de SEO y ediciones de colección en el catálogo.",
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
    date: "21 abril 2026",
    title: "Gente de confianza: una página propia para los amigos de la casa",
    description:
      "Abrí una página nueva, /gente-de-confianza, con profesores y servicios de gente cercana que recomiendo personalmente. No es publicidad fría — son contactos que uso y que funcionan. Parte con Jose María (Excel, Power BI, VBA, Portugués, +10 años dando clases). Si a alguien le hace sentido aparecer ahí, que me escriba: yo elijo uno por uno. Además cambié el hero: el botón \"Publicar el mío (gratis)\" quedó como \"Ofrecer mi libro\", y sumé un tercero \"¿No está? Búscalo acá\" que te lleva a solicitudes.",
    tag: "Lanzamiento",
    link: "/gente-de-confianza",
    linkText: "Conocer a los amigos de la casa",
    visual: {
      kind: "milestone",
      icon: "🤝",
      metric: "Gente de confianza",
      detail: "contactos que uso y que recomiendo yo",
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

export default async function NovedadesPage() {
  const pool = await fetchListingPool();

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
              Diario de tuslibros.cl · Abril 2026
            </p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-cream mb-6 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
            Dos semanas en las que <em className="text-amber-300 not-italic font-normal italic">pasaron cosas</em>.
          </h1>
          <p className="text-base md:text-lg text-cream/80 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            Primer testimonio de un comprador real. Primer envío a región (Concepción, tres libros, Starken).
            Limpieza grande del SEO. Nuevas piezas de colección. Esto es lo que fue pasando, contado por orden
            de importancia y no solo cronológico. Lo escribo yo. — Vero
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-10 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
            {[
              { big: "2", small: "compradores reales" },
              { big: "1", small: "testimonio publicado" },
              { big: "78", small: "fichas enriquecidas" },
              { big: "10,9K", small: "URLs legacy limpiadas" },
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
            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-2">Hito · 16 abr</p>
            <p className="font-display text-lg text-ink leading-snug mb-2">Primer testimonio en la home</p>
            <p className="text-xs text-ink-muted">Un comprador real aceptó que publicara sus palabras.</p>
          </div>
          <div className="bg-white rounded-2xl border border-cream-dark/40 shadow-sm p-5 hover:shadow-md transition-shadow">
            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-2">Hito · 17 abr</p>
            <p className="font-display text-lg text-ink leading-snug mb-2">Primer envío a región</p>
            <p className="text-xs text-ink-muted">Bundle de 3 libros a Concepción por Starken. $48.647 pagados.</p>
          </div>
          <div className="bg-white rounded-2xl border border-cream-dark/40 shadow-sm p-5 hover:shadow-md transition-shadow">
            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-2">Catálogo · 16 abr</p>
            <p className="font-display text-lg text-ink leading-snug mb-2">Emar y de Rokha entran</p>
            <p className="text-xs text-ink-muted">Vanguardia chilena del 35 y una antología editada en La Habana, 1991.</p>
          </div>
        </section>

        <div className="mb-10">
          <PromoBanner variant="circulate" />
        </div>

        {/* TIMELINE de entradas */}
        <div className="space-y-6">
          {novedades.map((item, i) => {
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
              href="https://wa.me/?text=Vero%20est%C3%A1%20construyendo%20tuslibros.cl%20—%20marketplace%20de%20libros%20usados%20en%20Chile.%20Este%20es%20el%20diario%20de%20lo%20que%20pas%C3%B3%20estas%20dos%20semanas%3A%20https%3A%2F%2Ftuslibros.cl%2Fnovedades"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href="https://twitter.com/intent/tweet?text=Dos%20semanas%20en%20tuslibros.cl%3A%20primer%20testimonio%2C%20primer%20env%C3%ADo%20a%20regi%C3%B3n%2C%2078%20fichas%20enriquecidas%20y%20ediciones%20de%20colecci%C3%B3n.&url=https%3A%2F%2Ftuslibros.cl%2Fnovedades"
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
