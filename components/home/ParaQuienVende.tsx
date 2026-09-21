import Link from "next/link";

/**
 * La sección que faltaba: la home le hablaba solo a quien viene a comprar,
 * pero el 10,5% del tráfico entra a publicar (30 días de page_views, 17-09).
 * Hasta hoy, quien venía a vender tenía el botón del hero y nada más.
 *
 * Va en fondo tinta a propósito: es el único corte oscuro de la página, así
 * que separa sin necesidad de un título que grite. Y no promete "10 segundos"
 * —eso es lo que dice /publish y no es verdad: el formulario tiene siete
 * secciones—, promete lo que sí se cumple.
 */
export default function ParaQuienVende({ vendedores }: { vendedores: number }) {
  const pasos = [
    {
      titulo: "Escanea el código de barras",
      texto: "Con la cámara del teléfono. Título, autor y portada se llenan solos.",
    },
    {
      titulo: "Pones tu precio",
      texto: "El tuyo. Si se aleja mucho de lo que cuesta ese libro acá, te aviso antes de publicar.",
    },
    {
      titulo: "Cobras como prefieras",
      texto: "Con MercadoPago o por transferencia. El comprador paga el envío al comprar y esa plata te llega a ti.",
    },
  ];

  return (
    <section className="bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <h2 className="font-display text-3xl leading-tight tracking-[-0.01em] sm:text-4xl">
            Tus libros también son una librería.
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-cream/75">
            Somos {vendedores} personas y librerías vendiendo lo que ya leímos.
            Publicar es gratis y siempre lo será. Solo cobro un 8% cuando el
            libro se vende por acá — si lo cierras por WhatsApp en persona, no
            me debes nada.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/publish"
              className="rounded-full bg-cream px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-white"
            >
              Publicar un libro
            </Link>
            <Link
              href="/vender"
              className="rounded-full border border-cream/30 px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:border-cream"
            >
              Cómo funciona vender
            </Link>
          </div>
        </div>

        {/* Sí es una secuencia, por eso van numerados. */}
        <ol className="flex flex-col gap-6 border-t border-cream/15 pt-8 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
          {pasos.map((p, i) => (
            <li key={p.titulo} className="flex gap-4">
              <span className="font-mono text-sm text-cream/40 tabular-nums">{i + 1}</span>
              <div>
                <h3 className="font-semibold">{p.titulo}</h3>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-cream/70">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
