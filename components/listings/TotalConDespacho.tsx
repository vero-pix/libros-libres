"use client";

import { useEffect, useState } from "react";
import ComunaSelect from "@/components/checkout/ComunaSelect";
import { cargoServicio } from "@/lib/cargo-servicio";
import { precioCoordinado, type DespachoFicha } from "@/lib/shipping/coordinado";

/**
 * El total con despacho, en la ficha y antes del checkout (07-10-2026).
 *
 * De las órdenes con despacho coordinado que se cancelaron entre el 15-09 y el
 * 07-10, las dos que eran ventas perdidas abandonaron en MercadoPago al ver el
 * total: $16.290 por un libro de $10.000. La ficha decía "desde $4.490" y el
 * cargo recién aparecía en el checkout. Acá el comprador elige su comuna y ve
 * lo mismo que va a pagar: libro + despacho + cargo, con las mismas funciones
 * que usan el checkout y /api/orders.
 *
 * La comuna se recuerda en este navegador para la próxima ficha. Es una
 * comodidad: si el almacenamiento falla, se vuelve a elegir.
 */
const CLAVE_COMUNA = "tl_comuna_despacho";

const clp = (n: number) => `$${n.toLocaleString("es-CL")}`;

export default function TotalConDespacho({
  despacho,
  precioLibro,
  vendedorConMP,
}: {
  despacho: DespachoFicha;
  precioLibro: number;
  vendedorConMP: boolean;
}) {
  const [comuna, setComuna] = useState("");

  useEffect(() => {
    try {
      const guardada = window.localStorage.getItem(CLAVE_COMUNA);
      if (guardada) setComuna(guardada);
    } catch {}
  }, []);

  function elegir(c: string) {
    setComuna(c);
    try {
      if (c) window.localStorage.setItem(CLAVE_COMUNA, c);
      else window.localStorage.removeItem(CLAVE_COMUNA);
    } catch {}
  }

  const flete = comuna ? precioCoordinado(despacho.tarifas, despacho.origen, comuna) : null;
  // Con MercadoPago el cargo es la comisión; si el vendedor cobra solo por
  // transferencia, no hay cargo (lib/cargo-servicio.ts).
  const cargo = cargoServicio({
    enPersona: false,
    porTransferencia: !vendedorConMP,
    vendedorConMP,
    totalLibros: precioLibro,
  });

  return (
    <div className="mt-2 border-t border-line/70 pt-2.5">
      <label htmlFor="comuna-ficha" className="block text-[11px] text-ink-muted mb-1.5">
        ¿Cuánto pagas en total? Elige tu comuna
      </label>
      <ComunaSelect id="comuna-ficha" value={comuna} onChange={elegir} required={false} />
      {comuna && flete != null && (
        <div className="mt-2.5" aria-live="polite">
          <p className="flex items-baseline justify-between gap-3 text-sm text-ink">
            <span>Total con despacho a {comuna}</span>
            <strong className="tabular-nums whitespace-nowrap">{clp(precioLibro + flete + cargo)}</strong>
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted tabular-nums">
            Libro {clp(precioLibro)} + despacho {clp(flete)}
            {/* "con MercadoPago": si el vendedor también acepta transferencia, pagando así no hay
                cargo y el total baja. Aclarado el 07-10-2026 (auditoría de copy). */}
            {cargo > 0 ? ` + cargo por servicio ${clp(cargo)} (pagando con MercadoPago)` : ""}
          </p>
        </div>
      )}
      {comuna && flete == null && (
        <p className="mt-2 text-[11px] text-ink-muted" aria-live="polite">
          No pude calcular el despacho a {comuna}. En el checkout te muestro el precio exacto.
        </p>
      )}
    </div>
  );
}
