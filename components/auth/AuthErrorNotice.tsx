"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Cuando el intercambio de OAuth falla, Supabase NO vuelve por
 * /api/auth/callback: rebota directo a la Site URL (la home) con
 * ?error=...&error_code=... El sitio no leía esos parámetros en ninguna parte,
 * así que la persona aterrizaba en una home normal, sin ningún mensaje, y el
 * destino al que iba se perdía.
 *
 * Entre junio y septiembre de 2026 pasó 23 veces, 19 de ellas en Android y 22
 * viniendo de accounts.google.com. De los 10 usuarios identificados, 6 no
 * volvieron a hacer nada nunca más. Uno de ellos (Roberto Vega) tenía una
 * compra de $10.000 a medio pagar.
 *
 * No se puede impedir que Android pierda la cookie del code_verifier, pero sí
 * decirle a la persona qué pasó y darle el botón para reintentar.
 */
export default function AuthErrorNotice() {
  const params = useSearchParams();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);

  const errorCode = params.get("error_code");
  const error = params.get("error");

  useEffect(() => {
    if (!errorCode && !error) return;
    setCodigo(errorCode);
    setVisible(true);
    // Limpiar la URL para que un refresh o un enlace compartido no arrastre el
    // error, pero sin recargar ni perder el aviso que se acaba de mostrar.
    const limpia = new URLSearchParams(params.toString());
    for (const k of ["error", "error_code", "error_description"]) limpia.delete(k);
    const qs = limpia.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }, [errorCode, error, pathname, params]);

  if (!visible) return null;

  const expirado = codigo === "bad_oauth_state";

  return (
    <div
      role="alert"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-amber-300 bg-white p-4 shadow-xl sm:inset-x-auto sm:right-4 sm:bottom-4 animate-[fade-up_.35s_ease-out]"
    >
      <div className="flex gap-3">
        <span aria-hidden className="text-xl leading-none">🔑</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink text-[15px]">
            {expirado ? "Se cortó el ingreso" : "No pudimos completar el ingreso"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {expirado
              ? "Volviste de Google, pero la sesión de ingreso ya no estaba. Pasa sobre todo en Android. No es tu cuenta: basta con entrar de nuevo."
              : "Algo falló al volver del inicio de sesión. Vuelve a intentarlo, no perdiste nada."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/login"
              className="rounded-full bg-[--coral] px-4 py-2 text-sm font-bold text-white transition-all hover:brightness-105"
            >
              Entrar de nuevo
            </Link>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="rounded-full px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Ahora no
            </button>
          </div>
          <p className="mt-2.5 text-xs text-ink-muted">
            ¿Se repite?{" "}
            <a
              href="https://wa.me/56994583067"
              className="underline underline-offset-2"
            >
              Escríbeme y lo veo yo
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
