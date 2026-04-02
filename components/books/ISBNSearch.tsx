"use client";

import { useState, useRef } from "react";
import type { BookData } from "@/types";

interface Props {
  onBookFound: (book: BookData) => void;
}

export default function ISBNSearch({ onBookFound }: Props) {
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function formatISBN(raw: string) {
    // Solo dígitos y guiones
    return raw.replace(/[^\d-]/g, "").slice(0, 17);
  }

  async function handleSearch() {
    const clean = isbn.replace(/[-\s]/g, "");
    if (clean.length < 10) {
      setError("El ISBN debe tener 10 o 13 dígitos.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/books/isbn?isbn=${clean}`);
      const data = await res.json();

      if (!res.ok) {
        setError(
          res.status === 404
            ? "No encontramos ese ISBN en Google Books. Podés intentar con otro."
            : data.error ?? "Error al consultar el servicio."
        );
        return;
      }

      onBookFound(data);
      setIsbn("");
      setError(null);
    } catch {
      setError("Sin conexión. Verificá tu internet e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Número ISBN
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={isbn}
            onChange={(e) => {
              setIsbn(formatISBN(e.target.value));
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="978-956-000-0000"
            className={`flex-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors ${
              error ? "border-red-300 bg-red-50" : "border-gray-200"
            }`}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || isbn.replace(/\D/g, "").length < 10}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors min-w-[90px] flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Buscando
              </>
            ) : (
              "Buscar"
            )}
          </button>
        </div>

        {error ? (
          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <span>💡</span> El ISBN está en el reverso del libro, junto al código de barras.
          </p>
        )}
      </div>
    </div>
  );
}
