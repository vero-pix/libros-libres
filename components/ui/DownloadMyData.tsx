"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * "Descargar mis datos" (Ley 21.719, portabilidad). Dos formatos con los
 * mismos datos (perfil, publicaciones, compras, ventas, mensajes que escribió,
 * ofertas, reseñas, "Se busca" y direcciones):
 *  - el botón principal baja un HTML legible, que se abre con doble clic y se
 *    puede imprimir o guardar como PDF;
 *  - el enlace chico baja el JSON, la versión técnica para llevar a otro lado.
 */
type Formato = "html" | "json";

export default function DownloadMyData() {
  const [loading, setLoading] = useState<Formato | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function descargar(formato: Formato) {
    setLoading(formato);
    setError(null);
    try {
      const res = await fetch(`/api/account/export?formato=${formato}`, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No pude armar el archivo. Prueba de nuevo en un rato.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mis-datos-tuslibros.${formato}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude armar el archivo.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">Tus datos</h2>
      <p className="mt-1 text-sm text-gray-600">
        Te preparo un archivo con todo lo que guardo de ti: perfil, libros publicados, compras,
        ventas, mensajes que escribiste, ofertas, reseñas y tus &quot;Se busca&quot;. De las otras
        personas va solo su nombre de usuario. Se abre en tu navegador y lo puedes imprimir o
        guardar como PDF.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => descargar("html")}
          disabled={loading !== null}
        >
          {loading === "html" ? "Preparando…" : "Descargar mis datos"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="!px-2 !py-1 !text-xs !font-normal !text-gray-500 underline underline-offset-2 hover:!bg-transparent hover:!text-gray-700"
          onClick={() => descargar("json")}
          disabled={loading !== null}
        >
          {loading === "json" ? "Preparando…" : "o en formato técnico (JSON)"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
