"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ISBNSearch from "@/components/books/ISBNSearch";
import DraggableLocationPicker from "@/components/map/DraggableLocationPicker";
import type { BookData } from "@/types";
import Image from "next/image";

type Modality = "sale" | "loan" | "both";
type Condition = "new" | "good" | "fair" | "poor";

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

const MODALITY_OPTIONS: { value: Modality; label: string; icon: string; desc: string }[] = [
  { value: "sale",  label: "Venta",            icon: "🏷️", desc: "Querés vender el libro" },
  { value: "loan",  label: "Préstamo",          icon: "📖", desc: "Lo prestás y te lo devuelven" },
  { value: "both",  label: "Venta o préstamo",  icon: "📚", desc: "Cualquiera de las dos" },
];

const CONDITION_OPTIONS: { value: Condition; label: string; color: string }[] = [
  { value: "new",  label: "Como nuevo",    color: "text-green-700 bg-green-50 border-green-200" },
  { value: "good", label: "Buen estado",   color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "fair", label: "Estado regular", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  { value: "poor", label: "Con detalles",  color: "text-red-700 bg-red-50 border-red-200" },
];

interface Props {
  userId: string;
}

export default function PublishForm({ userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [book, setBook] = useState<BookData | null>(null);
  const [modality, setModality] = useState<Modality>("sale");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<Condition>("good");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationChange = useCallback((loc: LocationData) => {
    setLocation(loc);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!book) { setError("Buscá un libro por ISBN primero."); return; }
    if (!location) { setError("Marcá la ubicación del libro en el mapa."); return; }
    if (modality !== "loan" && !price) { setError("Ingresá el precio de venta."); return; }

    setLoading(true);
    setError(null);

    try {
      // Upsert book en catálogo
      const { data: bookRow, error: bookErr } = await supabase
        .from("books")
        .upsert(
          {
            isbn: book.isbn ?? null,
            title: book.title,
            author: book.author,
            description: book.description ?? null,
            cover_url: book.cover_url ?? null,
            genre: book.genre ?? null,
            published_year: book.published_year ?? null,
            created_by: userId,
          },
          { onConflict: "isbn", ignoreDuplicates: false }
        )
        .select("id")
        .single();

      if (bookErr) throw bookErr;

      // Insertar publicación
      const { error: listingErr } = await supabase.from("listings").insert({
        book_id: bookRow.id,
        seller_id: userId,
        modality,
        price: modality !== "loan" ? parseFloat(price) : null,
        condition,
        notes: notes.trim() || null,
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
        status: "active",
      });

      if (listingErr) throw listingErr;

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al publicar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Sección 1: Libro ── */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">1</span>
            ¿Qué libro querés publicar?
          </h2>
        </div>
        <div className="px-6 py-5">
          {book ? (
            <BookCard book={book} onClear={() => setBook(null)} />
          ) : (
            <ISBNSearch onBookFound={setBook} />
          )}
        </div>
      </section>

      {/* ── Sección 2: Modalidad y precio ── */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">2</span>
            ¿Cómo lo querés ofrecer?
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Modalidad */}
          <div className="grid grid-cols-3 gap-2">
            {MODALITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setModality(opt.value)}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-center transition-all ${
                  modality === opt.value
                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-400"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <span className={`text-xs font-semibold ${modality === opt.value ? "text-brand-700" : "text-gray-700"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-gray-400 leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>

          {/* Precio */}
          {modality !== "loan" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio <span className="text-gray-400 font-normal">(CLP)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm font-medium pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="100"
                  className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>
          )}

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado del libro</label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCondition(opt.value)}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium text-left transition-all ${
                    condition === opt.value
                      ? `${opt.color} ring-1 ring-offset-0`
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Sección 3: Descripción adicional ── */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">3</span>
            Descripción adicional
            <span className="text-gray-400 font-normal">(opcional)</span>
          </h2>
        </div>
        <div className="px-6 py-5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: Subrayado con lápiz en algunos capítulos. Edición especial con prólogo. Sin la sobrecubierta..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{notes.length}/500</p>
        </div>
      </section>

      {/* ── Sección 4: Ubicación ── */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">4</span>
            ¿Dónde está el libro?
          </h2>
          <p className="text-xs text-gray-400 mt-1 ml-7">
            Arrastrá el pin naranja para marcar la ubicación exacta.
          </p>
        </div>
        <div className="px-6 py-5">
          <DraggableLocationPicker onLocationChange={handleLocationChange} />
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors text-base shadow-sm"
      >
        {loading ? "Publicando..." : "Publicar libro"}
      </button>
    </form>
  );
}

/* ── BookCard: preview rico tras búsqueda ISBN ── */
function BookCard({ book, onClear }: { book: BookData; onClear: () => void }) {
  return (
    <div className="flex gap-4">
      {book.cover_url ? (
        <div className="flex-shrink-0">
          <Image
            src={book.cover_url}
            alt={book.title}
            width={72}
            height={100}
            className="rounded-lg object-cover shadow-sm border border-gray-100"
          />
        </div>
      ) : (
        <div className="w-[72px] h-[100px] bg-gray-100 rounded-lg flex items-center justify-center text-3xl flex-shrink-0 border border-gray-200">
          📚
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 leading-tight">{book.title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {book.genre && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {book.genre}
            </span>
          )}
          {book.published_year && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {book.published_year}
            </span>
          )}
        </div>
        {book.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
            {book.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="self-start text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0"
        aria-label="Cambiar libro"
      >
        ✕
      </button>
    </div>
  );
}
