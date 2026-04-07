"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface ImportResult {
  title: string;
  status: "ok" | "error" | "skip";
  message?: string;
}

export default function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ created: number; skipped: number; failed: number; results: ImportResult[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResults(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const rows = lines.slice(0, 6).map((line) => {
        const fields: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const ch of line) {
          if (ch === '"') inQuotes = !inQuotes;
          else if (ch === "," && !inQuotes) { fields.push(current.trim()); current = ""; }
          else current += ch;
        }
        fields.push(current.trim());
        return fields;
      });
      setPreview(rows);
    };
    reader.readAsText(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/listings/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al importar");
      } else {
        setResults(data);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-white rounded-xl border border-cream-dark/30 p-6">
        <h2 className="font-semibold text-ink mb-3">Formato del CSV</h2>
        <p className="text-sm text-ink-muted mb-3">
          Tu archivo debe tener estas columnas (la primera fila son los encabezados):
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs text-ink-muted border-collapse w-full">
            <thead>
              <tr className="bg-cream-warm">
                <th className="border border-cream-dark/30 px-3 py-2 text-left font-semibold">Columna</th>
                <th className="border border-cream-dark/30 px-3 py-2 text-left font-semibold">Obligatorio</th>
                <th className="border border-cream-dark/30 px-3 py-2 text-left font-semibold">Ejemplo</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["titulo", "Sí", "Cien Años de Soledad"],
                ["autor", "Sí", "Gabriel García Márquez"],
                ["isbn", "No", "9780307474728"],
                ["precio", "Sí", "8000"],
                ["condicion", "Sí", "buen_estado"],
                ["tipo", "Sí", "venta"],
                ["categoria", "No", "Ficción"],
              ].map(([col, req, ex]) => (
                <tr key={col}>
                  <td className="border border-cream-dark/30 px-3 py-1.5 font-mono">{col}</td>
                  <td className="border border-cream-dark/30 px-3 py-1.5">{req}</td>
                  <td className="border border-cream-dark/30 px-3 py-1.5">{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-muted mt-3">
          <strong>condicion</strong>: como_nuevo, buen_estado, estado_regular, con_detalles
          <br />
          <strong>tipo</strong>: venta, arriendo, ambos
          <br />
          <strong>precio</strong>: en pesos sin puntos ni signos (ej: 8000)
        </p>
        <a
          href="/plantilla_carga_masiva.csv"
          download
          className="inline-flex items-center gap-2 mt-4 text-sm text-brand-600 font-semibold hover:underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar plantilla de ejemplo
        </a>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-cream-dark/30 p-6">
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-cream-dark/50 rounded-xl py-10 flex flex-col items-center gap-2 hover:border-brand-400 hover:bg-brand-50/30 transition-colors cursor-pointer"
        >
          <svg className="w-8 h-8 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-sm text-ink-muted font-medium">
            {file ? file.name : "Haz clic para seleccionar tu archivo CSV"}
          </span>
        </button>
      </div>

      {/* Preview */}
      {preview.length > 1 && !results && (
        <div className="bg-white rounded-xl border border-cream-dark/30 p-6">
          <h2 className="font-semibold text-ink mb-3">
            Vista previa ({preview.length - 1} {preview.length - 1 === 1 ? "libro" : "libros"} detectados)
          </h2>
          <div className="overflow-x-auto">
            <table className="text-xs text-ink-muted border-collapse w-full">
              <thead>
                <tr className="bg-cream-warm">
                  {preview[0].map((h, i) => (
                    <th key={i} className="border border-cream-dark/30 px-3 py-2 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-cream-dark/30 px-3 py-1.5 max-w-[150px] truncate">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 6 && (
            <p className="text-xs text-ink-muted mt-2">Mostrando primeros 5 libros...</p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {uploading ? "Importando..." : `Importar ${preview.length - 1} libros`}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-white rounded-xl border border-cream-dark/30 p-6">
          <h2 className="font-semibold text-ink mb-3">Resultado</h2>
          <div className="flex gap-4 mb-4">
            {results.created > 0 && (
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {results.created} importados
              </span>
            )}
            {results.skipped > 0 && (
              <span className="text-sm font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                {results.skipped} omitidos
              </span>
            )}
            {results.failed > 0 && (
              <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                {results.failed} fallidos
              </span>
            )}
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {results.results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={r.status === "ok" ? "text-green-500" : r.status === "skip" ? "text-yellow-500" : "text-red-500"}>
                  {r.status === "ok" ? "✓" : r.status === "skip" ? "—" : "✗"}
                </span>
                <span className="text-ink-muted truncate">{r.title}</span>
                {r.message && <span className="text-xs text-gray-400">({r.message})</span>}
              </div>
            ))}
          </div>
          <Link
            href="/mis-libros"
            className="inline-block mt-4 text-sm text-brand-600 font-semibold hover:underline"
          >
            Ver mis libros &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
