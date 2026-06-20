"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";

interface ImportResult {
  title: string;
  status: "ok" | "error" | "skip";
  message?: string;
}

function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/\.\w+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").slice(0, 40);
}

export default function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [results, setResults] = useState<{
    created: number;
    skipped: number;
    failed: number;
    results: ImportResult[];
    photos?: { provided: number; coversFromOwnPhotos: number; galleryImagesAdded: number; unmatched: string[] };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos(files);
    setResults(null);
    setError(null);
  }

  // Cuántas fotos referencia el CSV (columnas foto_portada / resto_fotos / fotos).
  function csvPhotoNames(): Set<string> {
    const names = new Set<string>();
    if (preview.length < 2) return names;
    const header = preview[0].map((h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const idxPortada = header.findIndex((h) => ["foto_portada", "portada"].includes(h));
    const idxResto = header.findIndex((h) => ["resto_fotos", "fotos_resto", "fotos_galeria"].includes(h));
    const idxFotos = header.findIndex((h) => h === "fotos");
    for (const row of preview.slice(1)) {
      for (const i of [idxPortada, idxResto, idxFotos]) {
        if (i < 0 || !row[i]) continue;
        row[i].split(";").map((n) => n.trim()).filter(Boolean).forEach((n) => names.add(n.toLowerCase()));
      }
    }
    return names;
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      // 1) Si hay fotos, subirlas a Storage y armar el mapa nombre→URL.
      let photoMap: Record<string, string> = {};
      if (photos.length > 0) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Debes iniciar sesión");
          setUploading(false);
          return;
        }
        for (let i = 0; i < photos.length; i++) {
          const raw = photos[i];
          setProgress(`Subiendo fotos… ${i + 1}/${photos.length}`);
          if (!raw.type.startsWith("image/") && !/\.heic$|\.heif$/i.test(raw.name)) continue;
          if (raw.size > 25 * 1024 * 1024) continue; // 25MB raw máx, se comprime
          const compressed = await compressImage(raw);
          const path = `${user.id}/import/${Date.now()}-${i}-${sanitizeName(raw.name)}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("covers")
            .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
          if (upErr) continue;
          const { data: { publicUrl } } = supabase.storage.from("covers").getPublicUrl(path);
          // Clave = nombre original tal como aparece en el CSV (sin importar mayúsculas).
          photoMap[raw.name.toLowerCase()] = publicUrl;
        }
      }

      // 2) Mandar CSV + mapa de fotos a la API.
      setProgress("Creando publicaciones…");
      const formData = new FormData();
      formData.append("file", file);
      if (Object.keys(photoMap).length > 0) {
        formData.append("photoMap", JSON.stringify(photoMap));
      }

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
      setProgress(null);
    }
  }

  // Fotos del CSV que no están entre las seleccionadas (avisar al vendedor).
  const referenced = csvPhotoNames();
  const selectedNames = new Set(photos.map((p) => p.name.toLowerCase()));
  const missingPhotos = Array.from(referenced).filter((n) => !selectedNames.has(n));

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
                ["foto_portada", "No", "tapa.jpg"],
                ["resto_fotos", "No", "lomo.jpg;contra.jpg"],
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
          <br />
          <strong>foto_portada</strong>: nombre del archivo de tu foto de portada (ej: tapa.jpg). Si lo dejas vacío usamos la portada del catálogo.
          <br />
          <strong>resto_fotos</strong>: hasta 5 nombres de archivo separados por punto y coma (ej: lomo.jpg;contra.jpg). Súbelas abajo junto con el CSV.
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

      {/* Upload CSV */}
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
            {file ? file.name : "1. Haz clic para seleccionar tu archivo CSV"}
          </span>
        </button>
      </div>

      {/* Upload fotos (opcional) */}
      <div className="bg-white rounded-xl border border-cream-dark/30 p-6">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          onChange={handlePhotos}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="w-full border-2 border-dashed border-cream-dark/50 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-brand-400 hover:bg-brand-50/30 transition-colors cursor-pointer"
        >
          <svg className="w-8 h-8 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <span className="text-sm text-ink-muted font-medium">
            {photos.length > 0
              ? `${photos.length} foto${photos.length === 1 ? "" : "s"} seleccionada${photos.length === 1 ? "" : "s"}`
              : "2. (Opcional) Selecciona tus fotos"}
          </span>
          <span className="text-xs text-ink-muted/70">
            Los nombres deben coincidir con las columnas foto_portada / resto_fotos del CSV
          </span>
        </button>
        {missingPhotos.length > 0 && (
          <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mt-3">
            ⚠️ {missingPhotos.length} foto{missingPhotos.length === 1 ? "" : "s"} del CSV no {missingPhotos.length === 1 ? "está" : "están"} entre las seleccionadas: {missingPhotos.slice(0, 5).join(", ")}{missingPhotos.length > 5 ? "…" : ""}. Esos libros usarán la portada del catálogo.
          </p>
        )}
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
            {uploading ? (progress ?? "Importando...") : `Importar ${preview.length - 1} libros`}
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
          {/* Feedback de fotos: clave para saber si las imágenes se asociaron */}
          {results.photos && (
            results.photos.provided > 0 ? (
              <div className="mb-4 text-sm bg-cream-warm/60 border border-cream-dark/30 rounded-lg px-3 py-2.5 space-y-1">
                <p className="text-ink">
                  📷 {results.photos.coversFromOwnPhotos} portada{results.photos.coversFromOwnPhotos === 1 ? "" : "s"} propia{results.photos.coversFromOwnPhotos === 1 ? "" : "s"} asociada{results.photos.coversFromOwnPhotos === 1 ? "" : "s"}
                  {results.photos.galleryImagesAdded > 0 && ` · ${results.photos.galleryImagesAdded} de galería`}
                  {" "}(de {results.photos.provided} foto{results.photos.provided === 1 ? "" : "s"} subida{results.photos.provided === 1 ? "" : "s"})
                </p>
                {results.photos.unmatched.length > 0 && (
                  <p className="text-yellow-700">
                    ⚠️ {results.photos.unmatched.length} nombre{results.photos.unmatched.length === 1 ? "" : "s"} del CSV no encontró archivo: {results.photos.unmatched.slice(0, 6).join(", ")}{results.photos.unmatched.length > 6 ? "…" : ""}. Revisa que el nombre en el CSV sea idéntico al del archivo (incluida la extensión).
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-4 text-sm bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5 text-yellow-800">
                ℹ️ No subiste fotos propias, así que se usó la portada del catálogo (por ISBN). Si quieres tus propias fotos, vuelve a importar adjuntándolas en el paso 2 y nombrándolas igual que en las columnas <strong>foto_portada</strong> / <strong>resto_fotos</strong>.
              </div>
            )
          )}
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
