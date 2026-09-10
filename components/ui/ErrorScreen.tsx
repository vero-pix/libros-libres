"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { waSoporte } from "@/lib/soporte";

/**
 * La pantalla de error del sitio. Hasta el 10-09-2026 no existía ninguna: si algo
 * fallaba en producción —una consulta caída, un timeout— la persona quedaba
 * mirando la pantalla por defecto de Next, sin saber qué hacer ni a quién decirle.
 *
 * Sigue la misma regla que el checkout: nunca dejar a alguien sin salida. Acá la
 * salida es reintentar, volver al catálogo, o escribirle a Vero por WhatsApp —
 * y el mensaje va prellenado con la dirección donde se rompió, para no tener que
 * preguntarle a la persona dónde estaba.
 *
 * El contenido vive acá y no en `app/error.tsx` porque hacen falta DOS bordes de
 * error: el de `(main)`, que queda dentro del layout con la barra de navegación, y
 * el de la raíz, que atrapa lo que se rompe fuera de ese grupo y por eso se dibuja
 * sin barra. Los dos muestran esto mismo.
 */
export default function ErrorScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Queda en la consola del navegador y en los logs de Vercel. El `digest` es
    // lo único que identifica el error en produccion, donde el mensaje se oculta.
    console.error("[error boundary]", error.digest ?? "", error);
  }, [error]);

  const donde = typeof window !== "undefined" ? window.location.pathname : "";
  const mensaje = `Hola Vero, me salió un error en tuslibros.cl${
    donde ? ` (en ${donde})` : ""
  }${error.digest ? ` — código ${error.digest}` : ""}`;

  return (
    <main className="max-w-2xl mx-auto px-6 py-20 sm:py-28">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-coral">
        Algo se cayó
      </p>

      <h1 className="font-display text-4xl sm:text-5xl text-ink leading-[1.1] mt-4">
        Esto no cargó bien.
      </h1>

      <p className="mt-5 text-lg text-ink-muted leading-relaxed">
        No es culpa tuya. A veces se cae una consulta y con reintentar basta. Si
        insiste, escríbeme y lo veo yo.
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
        <Button size="lg" onClick={reset}>
          Reintentar
        </Button>
        <ButtonLink href="/search" variant="outline" size="lg">
          Ir al catálogo
        </ButtonLink>
        <ButtonLink
          href={waSoporte(mensaje)}
          variant="ghost"
          size="lg"
          target="_blank"
          rel="noopener noreferrer"
        >
          Escribirle a Vero
        </ButtonLink>
      </div>

      {error.digest && (
        <p className="mt-12 pt-6 border-t border-line font-mono text-xs text-ink-muted">
          Código del error: {error.digest}
          <span className="block mt-1 font-sans text-[13px]">
            Si me lo mandas, lo puedo buscar en los registros.
          </span>
        </p>
      )}
    </main>
  );
}
