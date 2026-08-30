"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Cierre de cuenta desde el perfil. Vive plegado tras un enlace discreto: es una
 * acción que tiene que existir y estar a mano, no una que se tropiece sin
 * querer.
 */
export default function DeleteAccount({ listingsCount }: { listingsCount: number }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soporte, setSoporte] = useState<string | null>(null);

  async function eliminar() {
    setError(null);
    setSoporte(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmacion: texto }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "No pudimos cerrar la cuenta.");
        setSoporte(data?.soporte ?? null);
        setLoading(false);
        return;
      }
      router.push("/?cuenta=eliminada");
      router.refresh();
    } catch {
      setError("No pudimos conectar. Intenta de nuevo en un momento.");
      setLoading(false);
    }
  }

  if (!abierto) {
    return (
      <div className="mt-8 mb-4 text-center">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="text-xs text-gray-400 underline underline-offset-4 hover:text-gray-600 transition-colors"
        >
          Eliminar mi cuenta
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-4 rounded-xl border border-red-200 bg-red-50 p-5">
      <h2 className="text-sm font-semibold text-red-900">Eliminar mi cuenta</h2>
      <p className="mt-2 text-sm text-red-800">
        Se borran tus datos, tu perfil y{" "}
        {listingsCount === 0
          ? "no tienes libros publicados"
          : listingsCount === 1
            ? "el libro que tienes publicado"
            : `los ${listingsCount} libros que tienes publicados`}
        . No se puede deshacer.
      </p>
      <p className="mt-2 text-sm text-red-800">
        Si solo quieres dejar de aparecer un tiempo, puedes{" "}
        <a href="/mis-libros" className="underline font-medium">
          pausar tus libros
        </a>{" "}
        en vez de cerrar la cuenta.
      </p>

      <label className="mt-4 block text-xs font-medium text-red-900">
        Escribe ELIMINAR para confirmar
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none"
          placeholder="ELIMINAR"
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-red-900">
          {error}
          {soporte && (
            <>
              {" "}
              <a href={`mailto:${soporte}`} className="underline font-medium">
                {soporte}
              </a>
            </>
          )}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={eliminar}
          disabled={loading || texto.trim().toUpperCase() !== "ELIMINAR"}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 transition-colors"
        >
          {loading ? "Eliminando…" : "Eliminar definitivamente"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setTexto("");
            setError(null);
          }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
