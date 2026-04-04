"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ISBNSearch from "@/components/books/ISBNSearch";
import DraggableLocationPicker, { type LocationData } from "@/components/map/DraggableLocationPicker";
import type { BookData } from "@/types";
import Image from "next/image";
import { CATEGORY_OPTIONS } from "@/lib/genres";
import CoverUpload from "@/components/books/CoverUpload";

type Modality = "sale" | "loan" | "both";
type Condition = "new" | "good" | "fair" | "poor";

const MODALITY_OPTIONS: { value: Modality; label: string; icon: string; desc: string }[] = [
  { value: "sale",  label: "Venta",            icon: "🏷️", desc: "Quieres vender el libro" },
  { value: "loan",  label: "Préstamo",          icon: "📖", desc: "Lo prestas y te lo devuelven" },
  { value: "both",  label: "Venta o préstamo",  icon: "📚", desc: "Cualquiera de las dos" },
];

const CONDITION_OPTIONS: { value: Condition; label: string; color: string }[] = [
  { value: "new",  label: "Como nuevo",    color: "text-green-700 bg-green-50 border-green-200" },
  { value: "good", label: "Buen estado",   color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "fair", label: "Estado regular", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  { value: "poor", label: "Con detalles",  color: "text-red-700 bg-red-50 border-red-200" },
];

interface DefaultLocation {
  lat: number;
  lng: number;
  address: string;
}

interface Props {
  userId: string;
  existingPhone?: string | null;
  defaultLocation?: DefaultLocation | null;
}

export default function PublishForm({ userId, existingPhone, defaultLocation }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [book, setBook] = useState<BookData | null>(null);
  const [genre, setGenre] = useState("");
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [modality, setModality] = useState<Modality>("sale");
  const [price, setPrice] = useState("");
  const [rentalPrice, setRentalPrice] = useState("");
  const [rentalDeposit, setRentalDeposit] = useState("");
  const [rentalPeriod, setRentalPeriod] = useState<7 | 14 | 30>(14);
  const [condition, setCondition] = useState<Condition>("good");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState(existingPhone ?? "");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(
    defaultLocation ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PHONE_REGEX = /^\+56[0-9]{9}$/;

  const handleLocationChange = useCallback((loc: LocationData) => {
    setLocation(loc);
  }, []);

  // Se llama solo cuando el usuario usa GPS — guarda la ubicación en su perfil
  const handleGeolocated = useCallback(async (loc: LocationData) => {
    await supabase.from("users").update({
      default_latitude: loc.lat,
      default_longitude: loc.lng,
      default_address: loc.address,
    }).eq("id", userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!book) { setError("Busca un libro por ISBN primero."); return; }
    if (!location) { setError("Marca la ubicación del libro en el mapa."); return; }
    if (modality !== "loan" && !price) { setError("Ingresa el precio de venta."); return; }
    if (modality !== "sale" && !rentalPrice) { setError("Ingresa el precio de arriendo."); return; }
    if (phone && !PHONE_REGEX.test(phone)) {
      setPhoneError("Formato inválido. Usa +56 seguido de 9 dígitos. Ej: +56912345678");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Si el libro tiene ISBN, hacer upsert para evitar duplicados.
      // Si no tiene ISBN (ingreso manual), hacer insert directo.
      const bookPayload = {
        isbn: book.isbn ?? null,
        title: book.title,
        author: book.author,
        description: book.description ?? null,
        cover_url: customCoverUrl ?? book.cover_url ?? null,
        genre: genre || book.genre || null,
        published_year: book.published_year ?? null,
        created_by: userId,
      };

      let bookId: string;

      if (book.isbn) {
        const { data: bookRow, error: bookErr } = await supabase
          .from("books")
          .upsert(bookPayload, { onConflict: "isbn", ignoreDuplicates: false })
          .select("id")
          .single();
        if (bookErr) throw bookErr;
        bookId = bookRow.id;
      } else {
        const { data: bookRow, error: bookErr } = await supabase
          .from("books")
          .insert(bookPayload)
          .select("id")
          .single();
        if (bookErr) throw bookErr;
        bookId = bookRow.id;
      }

      // Insertar publicación
      const { error: listingErr } = await supabase.from("listings").insert({
        book_id: bookId,
        seller_id: userId,
        modality,
        price: modality !== "loan" ? parseFloat(price) : null,
        rental_price: modality !== "sale" ? parseFloat(rentalPrice) : null,
        rental_deposit: modality !== "sale" && rentalDeposit ? parseFloat(rentalDeposit) : null,
        rental_period_days: modality !== "sale" ? rentalPeriod : null,
        condition,
        notes: notes.trim() || null,
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
        cover_image_url: customCoverUrl ?? book.cover_url ?? null,
        status: "active",
      });

      if (listingErr) throw listingErr;

      // Guardar teléfono en el perfil del usuario si fue ingresado
      if (phone) {
        await supabase.from("users").update({ phone }).eq("id", userId);
      }

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
            ¿Qué libro quieres publicar?
          </h2>
        </div>
        <div className="px-6 py-5">
          {book ? (
            <div className="flex gap-4 items-start">
              <CoverUpload
                currentUrl={customCoverUrl ?? book.cover_url}
                onUploaded={setCustomCoverUrl}
              />
              <div className="flex-1 min-w-0">
                <BookCard book={book} onClear={() => { setBook(null); setGenre(""); setCustomCoverUrl(null); }} />
              </div>
            </div>
          ) : (
            <ISBNSearch onBookFound={(b) => { setBook(b); setGenre(b.genre ?? ""); }} />
          )}
        </div>
      </section>

      {/* ── Sección 1b: Categoría ── */}
      {book && (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Categoría
              <span className="text-gray-400 font-normal">(opcional)</span>
            </h2>
          </div>
          <div className="px-6 py-5">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              <option value="">Sin categoría</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {book.genre && genre !== book.genre && (
              <p className="text-xs text-gray-400 mt-1.5">
                Categoría original: {book.genre}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Sección 2: Modalidad y precio ── */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">2</span>
            ¿Cómo lo quieres ofrecer?
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

          {/* Arriendo: precio, garantía, período */}
          {modality !== "sale" && (
            <div className="space-y-3 p-4 bg-brand-50 border border-brand-100 rounded-xl">
              <p className="text-xs font-semibold text-brand-700">Datos del arriendo</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio del arriendo <span className="text-gray-400 font-normal">(CLP por período)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm font-medium pointer-events-none">$</span>
                  <input
                    type="number"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    placeholder="3000"
                    min="0"
                    step="100"
                    className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período <span className="text-gray-400 font-normal">(días)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([7, 14, 30] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setRentalPeriod(d)}
                      className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                        rentalPeriod === d
                          ? "border-brand-500 bg-white text-brand-700 ring-1 ring-brand-400"
                          : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                      }`}
                    >
                      {d} días
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Garantía <span className="text-gray-400 font-normal">(opcional, reembolsable)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm font-medium pointer-events-none">$</span>
                  <input
                    type="number"
                    value={rentalDeposit}
                    onChange={(e) => setRentalDeposit(e.target.value)}
                    placeholder="5000"
                    min="0"
                    step="500"
                    className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Se devuelve al arrendatario cuando devuelve el libro en buen estado.</p>
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

      {/* ── Sección 4: Teléfono WhatsApp ── */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">4</span>
            Tu WhatsApp
            <span className="text-gray-400 font-normal">(opcional)</span>
            {existingPhone && (
              <span className="ml-auto text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                Guardado en tu perfil
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 mt-1 ml-7">
            {existingPhone
              ? "Tu número está pre-rellenado. Puedes cambiarlo solo para esta publicación o actualízalo en tu perfil."
              : "Los compradores podrán contactarte directamente por WhatsApp."}
          </p>
        </div>
        <div className="px-6 py-5">
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.trim());
              setPhoneError(null);
            }}
            placeholder="+56912345678"
            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors ${
              phoneError ? "border-red-300 bg-red-50" : "border-gray-200"
            }`}
          />
          {phoneError ? (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <span>⚠</span> {phoneError}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1.5">
              Formato: +56912345678 (sin espacios ni guiones)
            </p>
          )}
        </div>
      </section>

      {/* ── Sección 5: Ubicación ── */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">5</span>
            ¿Dónde está el libro?
            {defaultLocation && (
              <span className="ml-auto text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                Guardada en tu perfil
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 mt-1 ml-7">
            {defaultLocation
              ? "Usando tu ubicación guardada. Puedes moverla para esta publicación."
              : "Usa GPS, busca una dirección o arrastra el pin en el mapa."}
          </p>
        </div>
        <div className="px-6 py-5">
          <DraggableLocationPicker
            onLocationChange={handleLocationChange}
            onGeolocated={handleGeolocated}
            initialLat={defaultLocation?.lat}
            initialLng={defaultLocation?.lng}
            initialAddress={defaultLocation?.address}
          />
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
