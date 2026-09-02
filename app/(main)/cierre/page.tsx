// Página pública del cierre (sept 2026). La linkea el banner AvisoCierre.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "tuslibros.cl cierra el 30 de septiembre",
  description:
    "Después de un año y medio cierro tuslibros.cl. Se puede comprar hasta el 15 de septiembre. A los vendedores les entrego su catálogo exportado.",
};

export default function CierrePage() {
  return (
    <main className="bg-cream min-h-screen">
      <article className="max-w-2xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-stone-500 mb-4">
          1 de septiembre de 2026
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-[1.15] text-stone-900">
          tuslibros.cl cierra el 30 de septiembre
        </h1>

        <div className="mt-8 space-y-5 text-[16px] sm:text-[17px] leading-relaxed text-stone-700">
          <p>
            Hace un año y medio armé este sitio porque me cargaba que vender un libro
            usado en Chile fuera o regalarlo en Facebook Marketplace o no venderlo nunca.
          </p>
          <p>
            Llegó a tener <strong>3.900 libros publicados por 121 personas</strong>.
            Libreros de verdad, gente que vaciaba la casa, un profesor de Talca, una
            señora que vendía la biblioteca de su papá. Hubo ventas reales, plata que
            llegó a bolsillos de personas y no a una bodega.
          </p>
          <p>
            Lo cierro porque no puedo seguir pagando la infraestructura. No es una
            metáfora de nada: son servidores, base de datos y dominio que cuestan plata
            todos los meses, y este mes ya no me da.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-stone-300 bg-white p-6 sm:p-7">
          <h2 className="font-display text-xl font-bold text-stone-900">Las fechas</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-stone-700">
            <li className="flex gap-3">
              <span className="font-mono text-sm text-[--coral] shrink-0 pt-0.5">15 sept</span>
              <span>Último día para comprar. Hasta acá el sitio funciona igual.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-sm text-[--coral] shrink-0 pt-0.5">30 sept</span>
              <span>El sitio deja de estar disponible.</span>
            </li>
          </ul>
          <p className="mt-5 text-[15px] text-stone-700">
            Si tienes una compra o una venta en curso, se cierra igual. La plata llega y
            yo respondo por eso.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 sm:p-7">
          <h2 className="font-display text-xl font-bold text-stone-900">
            Si vendes acá: llévate tus libros
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-stone-700">
            Te mandé por correo un archivo con todo tu catálogo — títulos, autores,
            editorial, precios y tus notas — para que lo subas donde quieras sin tipear
            nada de nuevo. Si no te llegó, escríbeme al WhatsApp{" "}
            <a
              href="https://wa.me/56994583067"
              className="font-semibold underline decoration-[--coral] decoration-2 underline-offset-4"
            >
              +56 9 9458 3067
            </a>{" "}
            y te lo mando de nuevo.
          </p>
        </div>

        <p className="mt-10 text-[16px] leading-relaxed text-stone-700">
          Gracias a los que publicaron sus estantes acá, a los que compraron libros
          usados a personas y no a una bodega, y a los que me escribieron a preguntar si
          esto era en serio. Era en serio.
        </p>
        <p className="mt-6 font-display text-lg text-stone-900">Vero</p>

        <div className="mt-12 border-t border-stone-300 pt-6">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full bg-[--coral] px-6 py-2.5 text-sm font-bold text-white hover:brightness-105 transition-all"
          >
            Ver los libros que quedan →
          </Link>
        </div>
      </article>
    </main>
  );
}
