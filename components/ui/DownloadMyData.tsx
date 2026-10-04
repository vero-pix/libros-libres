"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * "Descargar mis datos" (Ley 21.719, portabilidad). Baja un JSON con todo lo
 * que guardo de la persona: perfil, publicaciones, compras, ventas, mensajes que
 * escribió, ofertas, reseñas, "Se busca" y direcciones.
 */
export default function DownloadMyData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descargar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/export", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No pude armar el archivo. Prueba de nuevo en un rato.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mis-datos-tuslibros.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude armar el archivo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">Tus datos</h2>
      <p className="mt-1 text-sm text-gray-600">
        Te preparo un archivo con todo lo que guardo de ti: perfil, libros publicados, compras,
        ventas, mensajes que escribiste, ofertas, reseñas y tus &quot;Se busca&quot;. De las otras
        personas va solo su nombre de usuario.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={descargar}
        disabled={loading}
      >
        {loading ? "Preparando…" : "Descargar mis datos"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
