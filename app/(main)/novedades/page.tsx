import Link from "next/link";

export const metadata = { title: "Novedades — tuslibros.cl" };

const novedades = [
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

        <div className="space-y-6">
          {novedades.map((item, i) => (
            <article
              key={i}
              className="bg-white rounded-xl border border-cream-dark/30 p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    item.tag === "Nueva herramienta"
                      ? "bg-brand-50 text-brand-600"
                      : item.tag === "Lanzamiento"
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {item.tag}
                </span>
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
