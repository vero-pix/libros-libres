// Aviso de cierre de tuslibros.cl (sept 2026). Va arriba de todo, en cada
// página de (main), para que nadie se entere tarde. Fechas anunciadas
// públicamente el 1 de septiembre en Reddit, Instagram y LinkedIn:
// se compra hasta el 15, el sitio queda visible hasta el 30.
// Cuando llegue el 30, borrar el componente y su montaje en el layout.
import Link from "next/link";

const ULTIMA_COMPRA = new Date("2026-09-16T03:00:00Z"); // 15 sept, fin del día en Chile

export default function AvisoCierre() {
  const cerradoParaComprar = Date.now() >= ULTIMA_COMPRA.getTime();

  return (
    <div className="relative overflow-hidden bg-[#241b14] text-cream border-b border-amber-900/40">
      <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-[--coral]/20 blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1 text-center">
        <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-amber-300/90">
          Cerramos
        </p>
        <p className="text-sm sm:text-[15px] leading-snug">
          {cerradoParaComprar ? (
            <>
              <span className="font-semibold">tuslibros.cl cierra el 30 de septiembre.</span>{" "}
              Ya no se pueden hacer compras nuevas.
            </>
          ) : (
            <>
              <span className="font-semibold">tuslibros.cl cierra el 30 de septiembre.</span>{" "}
              Se puede comprar hasta el 15.
            </>
          )}{" "}
          <Link
            href="/cierre"
            className="underline decoration-[--coral] decoration-2 underline-offset-4 hover:text-[--coral] transition-colors"
          >
            Por qué →
          </Link>
        </p>
      </div>
    </div>
  );
}
