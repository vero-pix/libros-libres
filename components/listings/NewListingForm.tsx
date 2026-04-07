"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ISBNInput from "@/components/books/ISBNInput";
import BookPreview from "@/components/books/BookPreview";
import dynamic from "next/dynamic";
const LocationPicker = dynamic(
  () => import("@/components/map/LocationPicker"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl" /> }
);
import type { BookData } from "@/types";

interface Props {
  userId: string;
}

type Modality = "sale" | "loan" | "both";

export default function NewListingForm({ userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [book, setBook] = useState<BookData | null>(null);
  const [modality, setModality] = useState<Modality>("sale");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("good");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!book) { setError("Selecciona un libro"); return; }
    if (!location) { setError("Indica la ubicación del libro"); return; }
    if (modality !== "loan" && !price) { setError("Ingresa el precio"); return; }

    setLoading(true);
    setError(null);

    try {
      // Upsert book
      const { data: bookRow, error: bookErr } = await supabase
        .from("books")
        .upsert({ ...book, created_by: userId }, { onConflict: "isbn", ignoreDuplicates: false })
        .select()
        .single();

      if (bookErr) throw bookErr;

      // Create listing
      const { error: listingErr } = await supabase.from("listings").insert({
        book_id: bookRow.id,
        seller_id: userId,
        modality,
        price: modality !== "loan" ? parseFloat(price) : null,
        condition,
        notes,
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
        status: "active",
      });

      if (listingErr) throw listingErr;

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Book selection */}
      <div>
        {book ? (
          <BookPreview book={book} onClear={() => setBook(null)} />
        ) : (
          <ISBNInput onBookFound={setBook} />
        )}
      </div>

      {/* Modality */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Modalidad
        </label>
        <div className="flex gap-2">
          {(["sale", "loan", "both"] as Modality[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModality(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                modality === m
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white text-gray-700 border-gray-200 hover:border-brand-300"
              }`}
            >
              {{ sale: "Venta", loan: "Préstamo", both: "Venta y préstamo" }[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      {modality !== "loan" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio (ARS)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      )}

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estado del libro
        </label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="new">Como nuevo</option>
          <option value="good">Buen estado</option>
          <option value="fair">Estado regular</option>
          <option value="poor">Con detalles</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas adicionales (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Describí el estado, edición especial, etc."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ubicación del libro
        </label>
        <LocationPicker onLocationChange={setLocation} />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? "Publicando..." : "Publicar libro"}
      </button>
    </form>
  );
}
