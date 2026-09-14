"use client";

import { useState } from "react";

/**
 * "Me llegó la transferencia" — el equivalente manual del webhook de
 * MercadoPago. Hasta que el vendedor aprieta esto, el pedido sigue en
 * `pending` y el despacho no arranca: el cron de Shipit solo mira órdenes
 * pagadas.
 *
 * Pide confirmación en dos pasos a propósito. Marcar un pago que no llegó
 * despacha un libro que nadie pagó, y eso no se deshace desde acá.
 */
export default function ConfirmarTransferencia({
  bundleId,
  monto,
}: {
  bundleId: string;
  monto: number;
}) {
  const [paso, setPaso] = useState<"inicio" | "confirmando" | "enviando" | "listo">("inicio");
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setPaso("enviando");
    setError(null);
    try {
      const res = await fetch("/api/orders/pago-recibido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle_id: bundleId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo confirmar. Intenta de nuevo.");
        setPaso("confirmando");
        return;
      }
      setPaso("listo");
      setTimeout(() => window.location.reload(), 900);
    } catch {
      setError("Se cayó la conexión. Intenta de nuevo.");
      setPaso("confirmando");
    }
  }

  if (paso === "listo") {
    return <span className="text-[11px] font-semibold text-green">✓ Pago confirmado</span>;
  }

  if (paso === "confirmando") {
    return (
      <div className="space-y-1.5">
        <p className="text-[11px] text-ink-muted leading-snug">
          ¿Ya viste los <strong>${monto.toLocaleString("es-CL")}</strong> en tu cuenta?
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={confirmar}
            className="px-2.5 py-1 rounded-md bg-green text-white text-[11px] font-semibold hover:opacity-90"
          >
            Sí, llegaron
          </button>
          <button
            type="button"
            onClick={() => { setPaso("inicio"); setError(null); }}
            className="px-2.5 py-1 rounded-md border border-cream-dark text-[11px] text-ink-muted hover:bg-cream"
          >
            Todavía no
          </button>
        </div>
        {error && <p className="text-[11px] text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={paso === "enviando"}
      onClick={() => setPaso("confirmando")}
      className="px-2.5 py-1 rounded-md bg-ink text-cream text-[11px] font-semibold hover:bg-ink-deep disabled:opacity-60"
    >
      {paso === "enviando" ? "Confirmando…" : "Me llegó la transferencia"}
    </button>
  );
}
