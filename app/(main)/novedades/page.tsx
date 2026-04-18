import Link from "next/link";
import PromoBanner from "@/components/ui/PromoBanner";

export const metadata = { title: "Novedades — tuslibros.cl" };

const novedades = [
  {
    date: "18 abril 2026",
    title: "El courier pasa a buscar los libros a tu casa (sí, a TU casa)",
    description:
      "Siempre fue así, pero la guía de despacho decía al revés (\"lleva el paquete a la sucursal del courier\") y era un error viejo que no había actualizado. Lo arreglé hoy: ahora /como-despachar explica bien que Shipit coordina un retiro a domicilio y un courier pasa por el paquete a la dirección que tienes registrada, sin que tengas que moverte de la casa. El corte diario es a las 11 AM (si la venta se paga antes, el retiro suele ser ese mismo día; si es después, al día hábil siguiente). También arreglé un mensaje feo en Mis Ventas que decía \"etiqueta demorada · pide ayuda\" en rojo, cuando en realidad para la mayoría de los envíos el courier trae el manifiesto impreso al retiro y tú no necesitas imprimir nada.",
    tag: "Fix",
  },
  {
    date: "18 abril 2026",
    title: "El comparador de precios ahora también es para quien compra (y suma Facebook Marketplace)",
    description:
      "Hasta hoy, los botones para comparar con Buscalibre, MercadoLibre e IberLibro los veía solo el vendedor al publicar, para calibrar su precio. Me lo pidió un usuario por WhatsApp: que los compradores también pudieran ver esos accesos directos en la ficha del libro, y de paso que sumáramos Facebook Marketplace. Dicho y hecho. Ahora en cada libro aparece el precio de tuslibros.cl y al lado cuatro links (Buscalibre, MercadoLibre, IberLibro, Facebook) para chequear el mismo título en otros sitios. Nada que ocultar.",
    tag: "Nuevo",
  },
  {
    date: "16 abril 2026",
    title: "Home más directa + más visibilidad en Google",
    description:
      "Rehice el titular de la portada para que se entienda en 2 segundos qué es tuslibros.cl: 'Libros usados en Chile, con envío o retiro en mano'. Sumé dos botones grandes (Explorar / Publicar). Y corregí algo importante del SEO: hasta ayer, Google indexaba las fichas con URLs feas tipo /listings/UUID; ahora indexa las URLs bonitas /libro/vendedor/slug, con título, precio y 'usado' en el resultado de búsqueda. Cada libro pasa a ser una puerta de entrada nueva.",
    tag: "Mejora",
  },
  {
    date: "16 abril 2026",
    title: "El primer testimonio en la home",
    description:
      "Un comprador real que ya recibió su libro accedió a que publicara su experiencia. Ahora aparece en la portada, debajo de los destacados. No es copy mío: son sus palabras. Ojalá el primero de muchos.",
    tag: "Nuevo",
  },
  {
    date: "16 abril 2026",
    title: "Tres nuevas piezas de colección en el catálogo",
    description:
      "Sumé tres joyas a la sección de coleccionables: 'Un Año' y 'Ayer' de Juan Emar (vanguardia chilena del 35, edición Biblioteca Claves de Chile + LOM), y una antología de Pablo de Rokha editada en La Habana en 1991 durante el Período Especial, papel rústico y todo. Si te gusta la literatura chilena de los márgenes, míralas.",
    tag: "Nuevo",
  },
  {
    date: "16 abril 2026",
    title: "Nueva fila: Ediciones especiales y coleccionables",
    description:
      "Hay libros que no son 'libros usados' — son objetos con historia: primeras ediciones, tirajes viejos de Nascimento, títulos agotados. Ahora tienen su propia sección en la home y un sello distintivo. El primer destacado: una edición Nascimento 1972 de Poemas y Antipoemas de Nicanor Parra.",
    tag: "Nuevo",
  },
  {
    date: "16 abril 2026",
    title: "Top 10 de libros destacados, ordenado a mano",
    description:
      "Renové los 10 libros destacados de la portada. Antes salían títulos muy de nicho; ahora verás primero los nombres que vale la pena mostrar: Parra, Donoso, Borges, García Márquez, Vargas Llosa, Fuentes, Wilde, Kundera, Monterroso, Franzen.",
    tag: "Mejora",
  },
  {
    date: "16 abril 2026",
    title: "Mapa con más alma",
    description:
      "El mapa ahora muestra miniaturas de las portadas en el listado lateral, diferencia los libros de colección (círculo oscuro con borde dorado) y los destacados (ámbar vibrante), y cambié el copy: 'Libros a la vuelta de la esquina'. La idea: que aunque tengamos pocos puntos hoy, se vea vivo y con intención.",
    tag: "Mejora",
  },
  {
    date: "16 abril 2026",
    title: "Catálogo más curado en la home y el mapa",
    description:
      "Ahora tengo una forma simple de bajar en el orden libros que no calzan con el tono del catálogo, sin esconderlos: siguen encontrándose al buscarlos por nombre o en el perfil del vendedor, pero no aparecen arriba en la home ni en el listado del mapa. La primera impresión la cuido yo.",
    tag: "Mejora",
  },
  {
    date: "15 abril 2026",
    title: "Home más rápida (y estable)",
    description:
      "Ajusté el cache del home para que responda al instante y sin quemar CPU. Si pillaste un error pasajero en la tarde, ya quedó resuelto. Ahora la portada carga fluida aunque tengamos más tráfico.",
    tag: "Mejora",
  },
  {
    date: "15 abril 2026",
    title: "Portada correcta al compartir en WhatsApp",
    description:
      "Cuando compartías un link de tuslibros.cl por WhatsApp u otras redes, salía la portada genérica de Open Library en vez de la foto real del libro que subió el vendedor. Ya no. Ahora aparece primero la foto del vendedor, y solo si no tiene se usa la portada por defecto.",
    tag: "Fix",
  },
  {
    date: "15 abril 2026",
    title: "Fix: publicar libros antiguos sin ISBN",
    description:
      "Algunos vendedores reportaron que al publicar libros antiguos que no tienen ISBN, el formulario manual parecía borrarse al tocar el campo de ISBN. Arreglado: ahora los datos que escribes a mano se conservan aunque cambies de un modo a otro.",
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
      "Ahora cuando buscas libros o revisas novedades, ves un banner que te invita a vender los tuyos. Porque todo comprador es un vendedor que todavía no se anima.",
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
      "Las categorías del sitio ahora se pueden agregar, editar y reordenar desde el panel de administración. Ya no hace falta tocar código para crear una categoría nueva.",
    tag: "Mejora",
  },
  {
    date: "12 abril 2026",
    title: "Maigret sube de precio",
    description:
      "La colección Maigret de Luis de Caralt ahora está a $7.990. Investigamos el mercado y estas ediciones vintage valen más de lo que les habíamos puesto. Si tienes alguno, cuídalo.",
    link: "/search?q=maigret",
    linkText: "Ver la colección",
    tag: "Mejora",
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
    title: "33 novelas de Maigret",
    description:
      "Toda la colección Luis de Caralt de Georges Simenon, el comisario más famoso de la novela policial francesa. 33 títulos de colección.",
    link: "/search?q=maigret",
    linkText: "Ver la colección",
    tag: "Lanzamiento",
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
      "Dos páginas nuevas: una guía paso a paso para vendedores que despachan por primera vez, y una política clara de devoluciones vía Chilexpress.",
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
    tag: "Nuevo",
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
      "Ahora cada libro muestra editorial, cantidad de páginas, año de publicación y tipo de encuadernación (tapa dura o blanda). Los datos se auto-completan al buscar por ISBN.",
    tag: "Mejora",
  },
  {
    date: "9 abril 2026",
    title: "Navegación mejorada",
    description:
      "Sidebar de categorías visible en toda la tienda, incluyendo la ficha de cada libro. Breadcrumbs para nunca perder el camino. Tipografía de precios más clara y legible.",
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

export default function NovedadesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Novedades</h1>
        <p className="text-ink-muted mb-8">
          Lo que vamos arreglando, mejorando y construyendo acá adentro. Lo escribo yo, lo lees tú. — Vero
        </p>

        <div className="mb-8">
          <PromoBanner variant="circulate" />
        </div>

        <div className="space-y-6">
          {novedades.map((item, i) => (
            <article
              key={i}
              className="bg-white rounded-xl border border-cream-dark/30 p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  // Parse "12 abril 2026" format
                  const meses: Record<string, number> = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
                  const parts = item.date.split(" ");
                  const d = new Date(Number(parts[2]), meses[parts[1]] ?? 0, Number(parts[0]));
                  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
                  const isRecent = diffDays <= 3;

                  const tagLabel = isRecent ? "Nuevo" : item.tag;
                  const tagClass = isRecent
                    ? "bg-green-50 text-green-700"
                    : item.tag === "Nueva herramienta"
                      ? "bg-brand-50 text-brand-600"
                      : item.tag === "Lanzamiento"
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700";

                  return (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tagClass}`}>
                      {tagLabel}
                    </span>
                  );
                })()}
                <span className="text-xs text-ink-muted">{item.date}</span>
              </div>
              <h2 className="text-lg font-semibold text-ink mb-1">
                {item.title}
              </h2>
              <p className="text-sm text-ink-muted">{item.description}</p>
              {item.link && (
                <Link
                  href={item.link}
                  className="inline-block mt-3 text-sm text-brand-600 font-semibold hover:underline"
                >
                  {item.linkText} &rarr;
                </Link>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
