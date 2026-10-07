"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  COURIERS_PERFIL,
  DIAS_DESPACHO_MIN,
  DIAS_DESPACHO_MAX,
  TARIFA_PROPIA_MIN,
  TARIFA_PROPIA_MAX,
  ZONAS_ENVIO,
  type PerfilDespacho,
  type TarifasCoordinado,
  type ZonaEnvio,
} from "@/lib/shipping/coordinado";

/**
 * "Tu despacho" en /perfil (07-10-2026, PR 1.3 del plan de despacho propio).
 *
 * El vendedor decide si ofrece despacho coordinado, con qué tarifas, cuántos
 * días necesita y con qué couriers trabaja. Las tarifas propias SÍ cambian lo
 * que paga el comprador (ficha, checkout y servidor salen de la misma función,
 * `tarifasEfectivas`). Los couriers y los días se guardan para cuando se
 * conecten los couriers; hoy no cambian el checkout, y la pantalla lo dice.
 *
 * Se guarda por /api/perfil/despacho: las columnas no se conceden a la sesión.
 */
type Tarifas = Pick<TarifasCoordinado, ZonaEnvio>;

const NOMBRE_ZONA: Record<ZonaEnvio, string> = {
  santiago: "Dentro de la Región Metropolitana",
  misma_region: "Dentro de tu misma región",
  otra_region: "A otra región",
  extremos: "Zonas extremas",
};

export default function DespachoVendedor({
  inicial,
  tarifasSitio,
}: {
  inicial: PerfilDespacho;
  /** Las de tuslibros (site_config.envio_coordinado). null = el coordinado está apagado en el sitio. */
  tarifasSitio: Tarifas | null;
}) {
  const [coordinadoActivo, setCoordinadoActivo] = useState(inicial.coordinadoActivo);
  const [propias, setPropias] = useState(!!inicial.tarifasPropias);
  const [tarifas, setTarifas] = useState<Record<ZonaEnvio, string>>(() => {
    const base = inicial.tarifasPropias ?? tarifasSitio;
    return Object.fromEntries(ZONAS_ENVIO.map((z) => [z, base ? String(base[z]) : ""])) as Record<ZonaEnvio, string>;
  });
  const [dias, setDias] = useState(String(inicial.dias));
  const [couriers, setCouriers] = useState<string[]>(inicial.couriers);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function volverATuslibros() {
    setPropias(false);
    if (tarifasSitio) {
      setTarifas(Object.fromEntries(ZONAS_ENVIO.map((z) => [z, String(tarifasSitio[z])])) as Record<ZonaEnvio, string>);
    }
  }

  function alternarCourier(c: string) {
    setCouriers((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function guardar() {
    setError(null);
    setGuardado(false);

    const diasN = Number(dias);
    if (!Number.isInteger(diasN) || diasN < DIAS_DESPACHO_MIN || diasN > DIAS_DESPACHO_MAX) {
      setError(`Los días para despachar tienen que ser un número entre ${DIAS_DESPACHO_MIN} y ${DIAS_DESPACHO_MAX}.`);
      return;
    }

    let tarifasBody: Tarifas | null = null;
    // Apagar el coordinado no borra las tarifas propias: si lo vuelve a
    // encender, siguen ahí.
    if (propias) {
      const t = {} as Tarifas;
      for (const z of ZONAS_ENVIO) {
        const n = Number(tarifas[z].replace(/\D/g, ""));
        if (!Number.isInteger(n) || n < TARIFA_PROPIA_MIN || n > TARIFA_PROPIA_MAX) {
          setError(
            `"${NOMBRE_ZONA[z]}" tiene que ser un monto entre $${TARIFA_PROPIA_MIN.toLocaleString("es-CL")} y $${TARIFA_PROPIA_MAX.toLocaleString("es-CL")}.`
          );
          return;
        }
        t[z] = n;
      }
      // Si quedaron iguales a las de tuslibros, no son propias: así siguen a
      // las de tuslibros cuando yo las cambie.
      const iguales = tarifasSitio && ZONAS_ENVIO.every((z) => t[z] === tarifasSitio[z]);
      tarifasBody = iguales ? null : t;
    }

    setGuardando(true);
    try {
      const res = await fetch("/api/perfil/despacho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couriers, dias: diasN, coordinadoActivo, tarifas: tarifasBody }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar. Inténtalo de nuevo.");
        return;
      }
      setPropias(!!tarifasBody);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">Tu despacho</h2>
        <p className="text-xs text-gray-400 mt-1">
          Cómo despachas tus libros y cuánto le cobras al comprador por el envío.
        </p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Despacho coordinado */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer" htmlFor="coordinado-activo">
            <input
              type="checkbox"
              id="coordinado-activo"
              checked={coordinadoActivo}
              onChange={(e) => setCoordinadoActivo(e.target.checked)}
              className="mt-0.5 accent-brand-500"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-800">Ofrezco despacho coordinado</span>
              <span className="block text-xs text-gray-500 mt-0.5">
                El comprador te paga el envío junto con el libro, tú lo despachas por el courier que
                quieras y anotas el número de seguimiento en Mis ventas.
              </span>
            </span>
          </label>
          {!coordinadoActivo && (
            <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Sin despacho coordinado, a los compradores de otras comunas solo les quedan el encuentro
              en persona y escribirte. Algunos no van a poder comprarte.
            </p>
          )}
        </div>

        {/* Tarifas */}
        {coordinadoActivo && tarifasSitio && (
          <div>
            <p className="text-sm font-medium text-gray-800">Cuánto cobras por el envío</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">
              {propias
                ? "Estás usando tus propias tarifas. Es lo que el comprador ve en la ficha y paga en el checkout."
                : "Estás usando las tarifas de tuslibros. Si tu courier te cobra más, ponle las tuyas."}
            </p>
            <div className="grid gap-2">
              {ZONAS_ENVIO.map((z) => (
                <label key={z} htmlFor={`tarifa-${z}`} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-600 min-w-0">{NOMBRE_ZONA[z]}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      id={`tarifa-${z}`}
                      inputMode="numeric"
                      value={tarifas[z]}
                      onChange={(e) => {
                        setPropias(true);
                        setTarifas((prev) => ({ ...prev, [z]: e.target.value }));
                      }}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </span>
                </label>
              ))}
            </div>
            {propias && (
              <button
                type="button"
                onClick={volverATuslibros}
                className="mt-2 text-xs text-brand-600 hover:text-brand-700 underline underline-offset-2"
              >
                Volver a las tarifas de tuslibros
              </button>
            )}
          </div>
        )}

        {/* Días y couriers: se guardan para cuando conectemos los couriers */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <p className="text-[11px] text-gray-500">
            Lo que sigue lo vamos a usar cuando conectemos los couriers. Por ahora no cambia lo que ve
            el comprador.
          </p>

          <label htmlFor="despacho-dias" className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-800 min-w-0">Días hábiles que necesitas para despachar</span>
            <input
              id="despacho-dias"
              inputMode="numeric"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              className="w-16 px-3 py-2 border border-gray-200 rounded-xl text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </label>

          <fieldset>
            <legend className="text-sm text-gray-800 mb-2">Couriers con los que trabajas</legend>
            <div className="flex flex-wrap gap-2">
              {COURIERS_PERFIL.map((c) => {
                const marcado = couriers.includes(c.value);
                return (
                  <label
                    key={c.value}
                    htmlFor={`courier-${c.value}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                      marcado ? "border-brand-500 bg-brand-50 text-gray-800" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`courier-${c.value}`}
                      checked={marcado}
                      onChange={() => alternarCourier(c.value)}
                      className="accent-brand-500"
                    />
                    {c.label}
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Si lo dejas en un punto o te lo retiran lo eliges más arriba, en &ldquo;Cuando vendas con
              despacho&rdquo;.
            </p>
          </fieldset>
        </div>

        {error && <p className="text-xs text-red-600">⚠ {error}</p>}
        {guardado && <p className="text-xs text-green-600">✓ Guardado.</p>}

        <Button onClick={guardar} disabled={guardando} fullWidth>
          {guardando ? "Guardando..." : "Guardar mi despacho"}
        </Button>
      </div>
    </div>
  );
}
