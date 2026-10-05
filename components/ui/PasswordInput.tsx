"use client";

import { useState, type InputHTMLAttributes } from "react";

/**
 * Campo de clave con el "ojo" para verla antes de enviar (pedido de Vero,
 * 05-10-2026). Recibe las mismas props que un <input>; el `type` lo maneja él.
 * El botón no envía el formulario (type="button") y deja espacio a la derecha
 * del texto para que el icono no tape lo que se escribe.
 */
export default function PasswordInput({
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar clave" : "Mostrar clave"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-gray-400 transition-colors hover:text-ink focus:outline-none focus-visible:text-ink focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 3l18 18" />
            <path d="M10.6 5.1A9.8 9.8 0 0112 5c5 0 8.7 4.1 10 7-.5 1.1-1.3 2.4-2.4 3.6M6.3 6.3C4.2 7.7 2.7 9.8 2 12c1.3 2.9 5 7 10 7 1.9 0 3.6-.6 5.1-1.5" />
            <path d="M9.9 9.9a3 3 0 004.2 4.2" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 12c1.3-2.9 5-7 10-7s8.7 4.1 10 7c-1.3 2.9-5 7-10 7S3.3 14.9 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
