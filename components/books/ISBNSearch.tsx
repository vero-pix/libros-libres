"use client";

import { useState, useRef } from "react";
import type { BookData } from "@/types";

interface Props {
  onBookFound: (book: BookData) => void;
}

interface ManualForm {
  title: string;
  author: string;
}

export default function ISBNSearch({ onBookFound }: Props) {
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState<ManualForm>({ title: "", author: "" });
  const inputRef = useRef<HTMLInputElement>(null);

  function formatISBN(raw: string) {
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
        if (res.status === 404) {
          setError("No encontramos ese ISBN en Google Books.");
          setShowManual(true);
        } else {
          setError(data.error ?? "Error al consultar el servicio.");
        }
        return;
      }

      onBookFound(data);
      setIsbn("");
      setError(null);
      setShowManual(false);
    } catch {
      setError("Sin conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit() {
    if (!manual.title.trim() || !manual.author.trim()) return;
    onBookFound({
      title: manual.title.trim(),
      author: manual.author.trim(),
      isbn: isbn.replace(/[-\s]/g, "") || undefined,
    });
    setShowManual(false);
    setError(null);
    setIsbn("");
    setManual({ title: "", author: "" });
  }

  return (
    <div className="space-y-3">
      {/* ISBN input */}
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
              setShowManual(false);
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

      {/* Fallback: ingreso manual */}
      {showManual && (
        <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3 bg-gray-50">
          <p className="text-sm text-gray-600 font-medium">
            Ingresa los datos del libro manualmente
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
            <input
              type="text"
              value={manual.title}
              onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))}
              placeholder="Ej: El nombre del viento"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Autor</label>
            <input
              type="text"
              value={manual.author}
              onChange={(e) => setManual((m) => ({ ...m, author: e.target.value }))}
              placeholder="Ej: Patrick Rothfuss"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={!manual.title.trim() || !manual.author.trim()}
              className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Usar estos datos
            </button>
            <button
              type="button"
              onClick={() => { setShowManual(false); setError(null); }}
              className="px-3 py-2 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Link para saltar directo al manual sin ISBN */}
      {!showManual && (
        <button
          type="button"
          onClick={() => setShowManual(true)}
          className="text-xs text-gray-400 hover:text-brand-500 transition-colors"
        >
          ¿No tienes el ISBN? Ingresar título y autor manualmente →
        </button>
      )}
    </div>
  );
}
