"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// Captcha de Cloudflare (Turnstile) para registro, ingreso y recuperar clave.
// Entró después del phishing del 03-10-2026: dos cuentas desechables creadas
// en minutos. Supabase valida el token solo si el captcha está activado en
// Authentication → Attack Protection; mientras esté apagado, lo ignora.
// Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY no se muestra nada y los formularios
// funcionan como antes.

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** Mensaje para cuando Supabase rechaza el captcha. */
export function esErrorDeCaptcha(mensaje: string | undefined): boolean {
  return !!mensaje && /captcha/i.test(mensaje);
}

export const MENSAJE_CAPTCHA =
  "No pudimos confirmar que eres una persona. Espera que aparezca el check y vuelve a intentar.";

interface Props {
  /** Recibe el token, o null si expiró o falló. Debe ser estable (un setState). */
  onToken: (token: string | null) => void;
  /** Cambiarlo reinicia el captcha: cada token sirve una sola vez. */
  reinicio?: number;
}

export default function Turnstile({ onToken, reinicio = 0 }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !listo || !contenedor.current || widgetId.current) return;
    widgetId.current =
      window.turnstile?.render(contenedor.current, {
        sitekey: TURNSTILE_SITE_KEY,
        language: "es",
        theme: "light",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      }) ?? null;
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [listo, onToken]);

  useEffect(() => {
    if (reinicio && widgetId.current) {
      window.turnstile?.reset(widgetId.current);
      onToken(null);
    }
  }, [reinicio, onToken]);

  if (!TURNSTILE_SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setListo(true)}
      />
      <div ref={contenedor} className="flex justify-center min-h-[65px]" />
    </>
  );
}
