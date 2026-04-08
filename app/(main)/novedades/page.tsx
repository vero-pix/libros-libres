import Link from "next/link";

export const metadata = { title: "Novedades — tuslibros.cl" };

const novedades = [
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
          Todo lo nuevo en Libros Libres. Herramientas, mejoras y lanzamientos.
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
