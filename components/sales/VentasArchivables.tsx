"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { claveArchivo, type TipoArchivo } from "@/lib/ventasArchivadas";

/**
 * Qué se ve en "Mis ventas" (07-10-2026, pedido de Vero: "ponle una (x) a
 * ciertas conversaciones o historial para poder archivar").
 *
 * - Las canceladas se esconden por defecto: no hay nada que hacer con ellas.
 * - Una venta entregada o cancelada, y un carrito, se pueden archivar con la
 *   (x). Archivar solo esconde: la orden y el carrito quedan intactos.
 *
 * La página es de servidor; este contexto decide en el navegador qué filas se
 * muestran. Sin la tabla `ventas_archivadas` (`disponible: false`) la (x) no
 * aparece y todo se ve como antes, salvo las canceladas, que igual se pliegan.
 */

export interface FilaRegistrada {
  clave: string;
  tipo: TipoArchivo;
  cancelada?: boolean;
}

interface Contexto {
  disponible: boolean;
  esArchivada: (clave: string) => boolean;
  visible: (fila: FilaRegistrada) => boolean;
  cambiar: (tipo: TipoArchivo, ref: string, archivar: boolean) => Promise<void>;
  verCanceladas: boolean;
  setVerCanceladas: (v: boolean) => void;
  verArchivadas: Record<TipoArchivo, boolean>;
  setVerArchivadas: (tipo: TipoArchivo, v: boolean) => void;
  conteo: (tipo: TipoArchivo) => { archivadas: number; canceladas: number; visibles: number };
  error: { tipo: TipoArchivo; mensaje: string } | null;
}

const Ctx = createContext<Contexto | null>(null);

/** null fuera del proveedor: los componentes se comportan como antes. */
export function useArchivo(): Contexto | null {
  return useContext(Ctx);
}

const CLAVE_CANCELADAS = "tl_ventas_ver_canceladas";

export function VentasArchivables({
  disponible,
  archivadasIniciales,
  filas,
  children,
}: {
  disponible: boolean;
  archivadasIniciales: string[];
  filas: FilaRegistrada[];
  children: ReactNode;
}) {
  const [archivadas, setArchivadas] = useState<Set<string>>(() => new Set(archivadasIniciales));
  const [verCanceladas, setVerCanceladasState] = useState(false);
  const [verArchivadas, setVerArchivadasState] = useState<Record<TipoArchivo, boolean>>({ orden: false, carrito: false });
  const [error, setError] = useState<{ tipo: TipoArchivo; mensaje: string } | null>(null);

  // La preferencia de ver canceladas se recuerda en este navegador. Es una
  // comodidad: si el almacenamiento falla, parten ocultas.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLAVE_CANCELADAS) === "1") setVerCanceladasState(true);
    } catch {}
  }, []);

  const setVerCanceladas = useCallback((v: boolean) => {
    setVerCanceladasState(v);
    try {
      window.localStorage.setItem(CLAVE_CANCELADAS, v ? "1" : "0");
    } catch {}
  }, []);

  const setVerArchivadas = useCallback((tipo: TipoArchivo, v: boolean) => {
    setVerArchivadasState((prev) => ({ ...prev, [tipo]: v }));
  }, []);

  const esArchivada = useCallback((clave: string) => archivadas.has(clave), [archivadas]);

  const visible = useCallback(
    (fila: FilaRegistrada) => {
      if (archivadas.has(fila.clave)) return verArchivadas[fila.tipo];
      if (fila.cancelada) return verCanceladas;
      return true;
    },
    [archivadas, verArchivadas, verCanceladas]
  );

  const cambiar = useCallback(async (tipo: TipoArchivo, ref: string, archivar: boolean) => {
    const clave = claveArchivo(tipo, ref);
    setError(null);
    // Optimista: la fila desaparece al tiro; si el servidor falla, vuelve.
    setArchivadas((prev) => {
      const next = new Set(prev);
      if (archivar) next.add(clave);
      else next.delete(clave);
      return next;
    });
    try {
      const res = await fetch("/api/ventas/archivar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, ref, archivar }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "No pude guardar el cambio.");
      }
    } catch (e) {
      setArchivadas((prev) => {
        const next = new Set(prev);
        if (archivar) next.delete(clave);
        else next.add(clave);
        return next;
      });
      setError({ tipo, mensaje: e instanceof Error ? e.message : "No pude guardar el cambio." });
    }
  }, []);

  const conteo = useCallback(
    (tipo: TipoArchivo) => {
      let archivadasN = 0;
      let canceladasN = 0;
      let visiblesN = 0;
      for (const f of filas) {
        if (f.tipo !== tipo) continue;
        if (archivadas.has(f.clave)) archivadasN++;
        else if (f.cancelada) canceladasN++;
        if (visible(f)) visiblesN++;
      }
      return { archivadas: archivadasN, canceladas: canceladasN, visibles: visiblesN };
    },
    [filas, archivadas, visible]
  );

  const valor = useMemo<Contexto>(
    () => ({
      disponible,
      esArchivada,
      visible,
      cambiar,
      verCanceladas,
      setVerCanceladas,
      verArchivadas,
      setVerArchivadas,
      conteo,
      error,
    }),
    [disponible, esArchivada, visible, cambiar, verCanceladas, setVerCanceladas, verArchivadas, setVerArchivadas, conteo, error]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/** Las filas de una venta (la de escritorio y la de celular), o nada si está oculta. */
export function FilaVenta({ fila, children }: { fila: FilaRegistrada; children: ReactNode }) {
  const ctx = useArchivo();
  if (ctx && !ctx.visible(fila)) return null;
  return <>{children}</>;
}

/** Fila de aviso cuando la tabla quedó sin nada que mostrar. */
export function SinVentasVisibles({ colSpan }: { colSpan: number }) {
  const ctx = useArchivo();
  if (!ctx) return null;
  const { visibles, canceladas, archivadas } = ctx.conteo("orden");
  if (visibles > 0 || canceladas + archivadas === 0) return null;
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-ink-muted">
        No tengo ventas activas que mostrarte. Las canceladas y archivadas están abajo.
      </td>
    </tr>
  );
}

/**
 * La (x) para archivar, o "Desarchivar" si la fila ya está archivada y se
 * está mostrando. No aparece sin la tabla.
 */
export function BotonArchivar({ tipo, refId, className = "" }: { tipo: TipoArchivo; refId: string; className?: string }) {
  const ctx = useArchivo();
  if (!ctx?.disponible) return null;
  const archivada = ctx.esArchivada(claveArchivo(tipo, refId));
  if (archivada) {
    return (
      <button
        type="button"
        onClick={() => ctx.cambiar(tipo, refId, false)}
        className={`text-[11px] font-medium text-brand-600 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
      >
        Desarchivar
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => ctx.cambiar(tipo, refId, true)}
      aria-label="Archivar"
      title="Archivar"
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-muted hover:bg-cream-warm hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

/** "Ver canceladas (N)" y "Ver archivadas (N)", al pie de una lista. */
export function ControlesArchivo({ tipo }: { tipo: TipoArchivo }) {
  const ctx = useArchivo();
  if (!ctx) return null;
  const { archivadas, canceladas } = ctx.conteo(tipo);
  const mostrarCanceladas = tipo === "orden" && canceladas > 0;
  const mostrarArchivadas = ctx.disponible && archivadas > 0;
  const error = ctx.error?.tipo === tipo ? ctx.error.mensaje : null;
  if (!mostrarCanceladas && !mostrarArchivadas && !error) return null;

  const enlace =
    "text-xs font-medium text-brand-600 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
  const etiquetaArchivadas = tipo === "orden" ? "archivadas" : "archivados";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      {mostrarCanceladas && (
        <button type="button" className={enlace} onClick={() => ctx.setVerCanceladas(!ctx.verCanceladas)}>
          {ctx.verCanceladas ? "Ocultar canceladas" : `Ver canceladas (${canceladas})`}
        </button>
      )}
      {mostrarArchivadas && (
        <button type="button" className={enlace} onClick={() => ctx.setVerArchivadas(tipo, !ctx.verArchivadas[tipo])}>
          {ctx.verArchivadas[tipo] ? `Ocultar ${etiquetaArchivadas}` : `Ver ${etiquetaArchivadas} (${archivadas})`}
        </button>
      )}
      {error && (
        <span className="text-xs text-red-700" role="status">
          {error}
        </span>
      )}
    </div>
  );
}
