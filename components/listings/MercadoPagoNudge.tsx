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

export type NudgeUbicacion = "publish_exito" | "mis_libros";

// El descarte en el éxito de publicación dura la sesión (no repetir el mensaje
// en la misma sesión). El de /mis-libros persiste entre sesiones.
const STORAGE: Record<NudgeUbicacion, { key: string; scope: "session" | "local" }> = {
  publish_exito: { key: "tl_mp_nudge_off_publish", scope: "session" },
  mis_libros: { key: "tl_mp_nudge_off_mislibros", scope: "local" },
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

  const titulo = "Te falta un paso para que te puedan pagar";
  const cuerpo =
    "Sin MercadoPago conectado, solo te puede comprar alguien que coordine contigo en persona. Conectándolo te compran desde cualquier región — y la plata te llega directa a ti.";

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
            Conectar MercadoPago
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

  // ── Tarjeta en el estado de éxito de /publish ──
  // Va DESPUÉS de la celebración: el libro publicado es la buena noticia.
  return (
    <div className="bg-white rounded-xl border border-brand-200 p-5 text-left">
      <p className="font-semibold text-ink text-sm mb-1.5">{titulo}</p>
      <p className="text-xs text-ink-muted leading-relaxed">{cuerpo}</p>
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <a
          href="/api/auth/mercadopago"
          onClick={connect}
          className="flex-1 text-center px-4 py-2.5 bg-[#009ee3] hover:bg-[#007eb5] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Conectar MercadoPago
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="px-4 py-2.5 border border-cream-dark/40 text-ink-muted hover:text-ink hover:bg-cream-warm text-sm font-medium rounded-xl transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
