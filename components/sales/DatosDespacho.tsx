"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Los datos que el mesón del courier pide para despachar: a quién, a dónde y a
 * qué teléfono. Antes vivían truncados en una columna de la tabla de Mis Ventas
 * y el teléfono no estaba en ninguna parte, así que el vendedor llegaba a la
 * sucursal sin poder completar el formulario (21-09-2026).
 *
 * El botón copia las tres líneas de una, que es como se usa: pegar en el
 * formulario del courier o mandárselo a alguien por WhatsApp.
 */
export default function DatosDespacho({
  nombre,
  direccion,
  comuna,
  telefono,
  buyerId,
}: {
  nombre: string | null;
  direccion: string | null;
  comuna: string | null;
  telefono: string | null;
  buyerId: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const lineas = [nombre, direccion, telefono].filter(Boolean) as string[];

  async function copiar() {
    try {
      await navigator.clipboard.writeText(lineas.join("\n"));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles (Safari en contextos raros): que al menos
      // no se caiga. Los datos están a la vista y se pueden copiar a mano.
      setCopiado(false);
    }
  }

  // Sin dirección no hay nada que mostrar, pero tampoco se deja al vendedor sin
  // salida: se le ofrece escribirle al comprador.
  if (!direccion) {
    return (
      <div className="mt-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2.5">
        <p className="text-[11px] text-amber-900 leading-snug">
          Esta compra no trae dirección de envío. Escríbele al comprador para pedírsela.
        </p>
        <Link
          href={`/mensajes?to=${buyerId}`}
          className="inline-block mt-1.5 text-[11px] font-semibold text-brand-600 hover:underline"
        >
          Escribirle →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-1.5 rounded-lg border border-cream-dark bg-cream-warm/60 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
        Envíaselo a
      </p>
      <p className="mt-1 text-xs font-medium text-ink leading-snug">{nombre ?? "—"}</p>
      <p className="text-[11px] text-ink leading-snug">{direccion}</p>
      {comuna && !direccion.toLowerCase().includes(comuna.toLowerCase()) && (
        <p className="text-[11px] text-ink leading-snug">{comuna}</p>
      )}
      {telefono ? (
        <p className="text-[11px] text-ink leading-snug">{telefono}</p>
      ) : (
        <p className="text-[11px] text-ink-muted leading-snug">
          Sin teléfono — si el courier lo pide, pídeselo por mensajería.
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copiar}
          className="rounded-md border border-cream-dark bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink hover:border-brand-500 hover:text-brand-600"
        >
          {copiado ? "✓ Copiado" : "Copiar datos"}
        </button>
        <Link
          href={`/mensajes?to=${buyerId}`}
          className="text-[11px] font-semibold text-brand-600 hover:underline"
        >
          Escribirle
        </Link>
      </div>
    </div>
  );
}
