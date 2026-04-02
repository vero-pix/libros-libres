"use client";

import { useState } from "react";
import type { BookData } from "@/types";

interface Props {
  onBookFound: (book: BookData) => void;
}

export default function ISBNInput({ onBookFound }: Props) {
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup() {
    const clean = isbn.replace(/[-\s]/g, "");
    if (clean.length < 10) {
      setError("Ingresa un ISBN válido (10 o 13 dígitos).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/books/isbn?isbn=${clean}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se encontró el libro");
        return;
      }

      onBookFound(data);
      setIsbn("");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Buscar por ISBN
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          placeholder="978-950-000-0000"
          maxLength={17}
          className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={loading}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors"
        >
          {loading ? "..." : "Buscar"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-400">
        El ISBN está en el reverso del libro, junto al código de barras.
      </p>
    </div>
  );
}
