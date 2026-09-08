"use client";

import { useCallback, useEffect, useState } from "react";
import { trackEvent } from "@/utils/analytics";

/**
 * Invitación a conectar MercadoPago para el vendedor que publicó sin conectarlo.
 *
 * Caso real del 25 jul 2026: un vendedor llegó de Instagram, publicó un libro y
 * nunca conectó MP — hizo exactamente lo que el producto le enseñó. Su libro solo
 * se puede comprar coordinando por WhatsApp.
 *
 * NO es un bloqueo: publicar sin MercadoPago sigue siendo perfectamente válido y
 * la vía directa sin comisión sigue siendo de primera clase. Esto es una
 * invitación bien puesta, nada más.
 *
 * No toca el flujo de conexión: el botón enlaza a /api/auth/mercadopago, que ya
 * existe y termina volviendo a /perfil?mp_connected=true.
 */

export type NudgeUbicacion = "publish_exito" | "mis_libros" | "ficha_dueno";

// El descarte en el éxito de publicación dura la sesión (no repetir el mensaje
// en la misma sesión). El de /mis-libros persiste entre sesiones.
const STORAGE: Record<NudgeUbicacion, { key: string; scope: "session" | "local" }> = {
  publish_exito: { key: "tl_mp_nudge_off_publish", scope: "session" },
  mis_libros: { key: "tl_mp_nudge_off_mislibros", scope: "local" },
  // En su propia ficha NO se puede descartar: es el estado real de ese libro,
  // no un aviso. La clave existe solo para cumplir el tipo.
  ficha_dueno: { key: "tl_mp_nudge_off_ficha", scope: "session" },
};

/** Clave que deja el origen para que /perfil pueda atribuir el mp_conectado. */
export const MP_ORIGEN_KEY = "tl_mp_connect_origen";

function store(scope: "session" | "local"): Storage | null {
  try {
    return scope === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    // Safari en modo privado puede tirar al tocar storage.
    return null;
  }
}

function track(event: string, ubicacion: NudgeUbicacion, nPublicaciones: number) {
  trackEvent(event, { ubicacion, n_publicaciones: nPublicaciones });
}

interface Props {
  ubicacion: NudgeUbicacion;
  /** Publicaciones activas del vendedor — denominador para medir la conversión. */
  nPublicaciones: number;
}

export default function MercadoPagoNudge({ ubicacion, nPublicaciones }: Props) {
  // Arranca oculto: hasta leer storage no sabemos si ya lo descartó, y así
  // evitamos el parpadeo de mostrarlo para esconderlo al instante.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // En la propia ficha no hay descarte posible: es estado, no aviso.
    if (ubicacion === "ficha_dueno") {
      setVisible(true);
      track("mp_aviso_visto", ubicacion, nPublicaciones);
      return;
    }
    const { key, scope } = STORAGE[ubicacion];
    if (store(scope)?.getItem(key) === "1") return;
    setVisible(true);
    track("mp_aviso_visto", ubicacion, nPublicaciones);
  }, [ubicacion, nPublicaciones]);

  const dismiss = useCallback(() => {
    const { key, scope } = STORAGE[ubicacion];
    try {
      store(scope)?.setItem(key, "1");
    } catch {
      // Sin storage el descarte no persiste, pero igual cerramos.
    }
    setVisible(false);
    track("mp_aviso_descartado", ubicacion, nPublicaciones);
  }, [ubicacion, nPublicaciones]);

  const connect = useCallback(() => {
    track("mp_aviso_click", ubicacion, nPublicaciones);
    try {
      window.localStorage.setItem(MP_ORIGEN_KEY, ubicacion);
    } catch {
      // Sin storage el mp_conectado llega con origen "desconocido".
    }
  }, [ubicacion, nPublicaciones]);

  if (!visible) return null;

  // El texto dice lo que le PASA a sus libros, no lo que tiene que configurar.
  // El anterior ("Te falta un paso para que te puedan pagar") hablaba de un
  // trámite pendiente y se leía como opcional: 63 vendedores publicaron 568
  // libros sin enterarse de que nadie podía comprárselos. (08-09-2026)
  const plural = nPublicaciones !== 1;
  const titulo = plural
    ? `Tus ${nPublicaciones} libros todavía no se pueden comprar`
    : "Tu libro todavía no se puede comprar";
  const cuerpo =
    `Están publicados y se ven en la tienda, pero nadie puede pagarlos por el sitio: quien lo quiera tiene que ubicarte y coordinar contigo en persona, y la mayoría no lo hace. ` +
    `Cuando conectes tu cuenta para cobrar, ${plural ? "se vuelven comprables" : "se vuelve comprable"} en un clic desde cualquier región y la plata te llega directa a ti.`;

  // ── Estado en la propia ficha del vendedor ──
  // No se puede cerrar y no dice "conecta MercadoPago" en el título: dice que
  // ese libro, el que está mirando, no se puede comprar.
  if (ubicacion === "ficha_dueno") {
    return (
      <div className="mx-6 sm:mx-8 mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">Este libro todavía no se puede comprar</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800">
          Está publicado y visible, pero nadie puede pagarlo por el sitio. Quien lo quiera tiene que
          ubicarte y coordinar contigo en persona. Conectando tu cuenta para cobrar, se vuelve
          comprable en un clic desde cualquier región.
        </p>
        <a
          href="/api/auth/mercadopago"
          onClick={connect}
          className="mt-3 inline-block rounded-lg bg-[#009ee3] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#007eb5]"
        >
          Activar los pagos de mi tienda
        </a>
      </div>
    );
  }

  // ── Franja discreta en /mis-libros ──
  // Sigue el patrón del aviso de "Completa tu perfil de contacto" que ya vive acá.
  if (ubicacion === "mis_libros") {
    return (
      <div className="flex items-start gap-3 bg-white border border-brand-200 rounded-xl p-4 mb-6">
        <svg className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">{titulo}</p>
          <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{cuerpo}</p>
          <a
            href="/api/auth/mercadopago"
            onClick={connect}
            className="inline-block mt-3 px-4 py-2 bg-[#009ee3] hover:bg-[#007eb5] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Activar los pagos de mi tienda
          </a>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="flex-shrink-0 text-ink-muted hover:text-ink transition-colors p-1 -m-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  // ── Paso 4 en el estado de éxito de /publish ──
  // Va DESPUÉS de la celebración: el libro publicado es la buena noticia y queda
  // detrás. Desde el 08-09-2026 se presenta como el paso que falta, no como una
  // sugerencia: los tres pasos que el sitio prometía ya están cumplidos y este
  // es el cuarto. Sigue sin bloquear nada — "Lo hago después" cierra la tarjeta.
  return (
    <div className="rounded-xl border-2 border-brand-300 bg-white p-5 text-left">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-brand-600">
        Paso 4 de 4 · te falta este
      </p>
      <p className="mb-1.5 text-sm font-semibold text-ink">{titulo}</p>
      <p className="text-xs leading-relaxed text-ink-muted">{cuerpo}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href="/api/auth/mercadopago"
          onClick={connect}
          className="flex-1 rounded-xl bg-[#009ee3] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#007eb5]"
        >
          Activar los pagos de mi tienda
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-xl border border-cream-dark/40 px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-cream-warm hover:text-ink"
        >
          Lo hago después
        </button>
      </div>
    </div>
  );
}
