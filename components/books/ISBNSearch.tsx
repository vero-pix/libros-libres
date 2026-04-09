"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { BookData } from "@/types";

const BarcodeScanner = dynamic(() => import("@/components/books/BarcodeScanner"), { ssr: false });

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
  const [showScanner, setShowScanner] = useState(false);
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
          setError("No encontramos ese ISBN. Puedes ingresar los datos manualmente.");
          setShowManual(true);
        } else {
          setError(data.error ?? "Error al consultar el servicio.");
        }
        return;
      }

      // Si la API encontró el ISBN pero sin título, pedir datos manuales
      if (!data.title?.trim()) {
        setError("Encontramos el ISBN pero sin título. Completa los datos manualmente.");
        setShowManual(true);
        setManual({ title: data.title || "", author: data.author || "" });
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

  async function handleScanned(scannedIsbn: string) {
    setShowScanner(false);
    setIsbn(scannedIsbn);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/books/isbn?isbn=${scannedIsbn}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setError("No encontramos ese ISBN. Puedes ingresar los datos manualmente.");
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
      {/* Barcode scanner overlay */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Scan button */}
      <button
        type="button"
        onClick={() => setShowScanner(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-brand-300 hover:border-brand-500 hover:bg-brand-50 text-brand-600 hover:text-brand-700 font-medium rounded-xl text-sm transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
          <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
          <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
          <line x1="7" y1="12" x2="7" y2="12.01"/>
          <line x1="12" y1="7" x2="12" y2="17"/>
          <line x1="17" y1="12" x2="17" y2="12.01"/>
        </svg>
        Escanear código de barras
      </button>

      <div className="flex items-center gap-2 text-xs text-gray-300">
        <span className="flex-1 border-t border-gray-200" />
        o ingresa el ISBN manualmente
        <span className="flex-1 border-t border-gray-200" />
      </div>

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
