"use client";

import { REGIONES_CHILE } from "@/lib/comunas";

/**
 * Selector de comuna del comprador.
 *
 * Es el primer `<select>` de comuna del sitio: hasta ahora la comuna siempre se
 * adivinaba parseando un string libre, y de ahí venían tanto el "No
 * reconocimos la comuna de tu dirección" como el fallback de $2.900 que se
 * cobra bajo el costo real. Acá la comuna es un dato, no una inferencia.
 *
 * Va agrupado por región con `<optgroup>` para que la lista de 346 comunas se
 * pueda recorrer, y porque la región es justo lo que hay que comparar para
 * saber si el retiro en persona es viable.
 */
export default function ComunaSelect({
  value,
  onChange,
  id = "comuna",
  required = true,
}: {
  value: string;
  onChange: (comuna: string) => void;
  id?: string;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-cream/30"
    >
      <option value="">Elige tu comuna…</option>
      {Object.entries(REGIONES_CHILE).map(([region, comunas]) => (
        <optgroup key={region} label={region}>
          {comunas.map((c) => (
            <option key={`${region}-${c}`} value={c}>
              {c}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
