"use client";

import { vendedorPuedeRecibirOfertas } from "@/lib/offers";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  /** `users.mercadopago_user_id` presente. */
  mpConnected: boolean;
}

/**
 * "Se aceptan ofertas" (lib/offers.ts). Hasta el 30-09-2026 lo puede activar
 * cualquiera; desde el 1 de octubre, sin MercadoPago aparece apagado y con el
 * aviso de que es solo con MP: queda a la vista a propósito, para que se note
 * lo que se pierde sin conectarlo.
 */
export default function AceptaOfertasToggle({ checked, onChange, mpConnected }: Props) {
  const habilitado = vendedorPuedeRecibirOfertas(mpConnected);
  const activo = habilitado && checked;
  const temporal = habilitado && !mpConnected;

  return (
    <div
      className={`rounded-xl border p-3.5 transition-colors ${
        !habilitado
          ? "border-amber-200 bg-amber-50/60"
          : activo
            ? "border-brand-300 bg-brand-50"
            : "border-gray-200 bg-white"
      }`}
    >
      <label className={`flex items-start gap-3 ${habilitado ? "cursor-pointer" : "cursor-not-allowed"}`}>
        <input
          type="checkbox"
          checked={activo}
          disabled={!habilitado}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-400 disabled:opacity-50"
        />
        <span className="flex-1">
          <span className={`flex flex-wrap items-center gap-2 text-sm font-medium ${habilitado ? "text-ink" : "text-gray-500"}`}>
            Se aceptan ofertas
            {!habilitado && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Solo con MercadoPago
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
            {habilitado
              ? "Los compradores te pueden proponer un precio menor. Tú lo aceptas o lo rechazas; nada se vende sin tu sí."
              : "Conecta MercadoPago y tus compradores te podrán proponer un precio. Tú decides si lo aceptas."}
          </span>
          {temporal && (
            <span className="mt-1.5 block text-xs font-medium text-amber-700">
              Gratis para todos hasta el 30 de septiembre. Después queda solo para quienes cobran con MercadoPago.
            </span>
          )}
          {!habilitado && (
            <a
              href="/api/auth/mercadopago"
              className="mt-2 inline-block text-xs font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
            >
              Conectar MercadoPago →
            </a>
          )}
        </span>
      </label>
    </div>
  );
}
