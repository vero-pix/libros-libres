"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";
import { normalizeGenre } from "@/lib/genreNormalizer";
import { suggestTags } from "@/lib/tagSuggester";
import ISBNSearch from "@/components/books/ISBNSearch";
import dynamic from "next/dynamic";
import type { LocationData } from "@/components/map/DraggableLocationPicker";
const DraggableLocationPicker = dynamic(
  () => import("@/components/map/DraggableLocationPicker"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl" /> }
);
import type { BookData } from "@/types";
import Image from "next/image";
import CategoryPicker from "@/components/listings/CategoryPicker";
import CoverUpload from "@/components/books/CoverUpload";
import ImageUploadMultiple from "@/components/listings/ImageUploadMultiple";
import { compressImage } from "@/lib/image-compress";
import Link from "next/link";
import { trackEvent } from "@/utils/analytics";

type Modality = "sale" | "loan" | "both";
type Condition = "new" | "good" | "fair" | "poor";

const MODALITY_OPTIONS: { value: Modality; label: string; icon: string; desc: string }[] = [
  { value: "sale",  label: "Venta",            icon: "🏷️", desc: "Quieres vender el libro" },
  { value: "loan",  label: "Arriendo",           icon: "📖", desc: "Lo arriendas y te lo devuelven" },
  { value: "both",  label: "Venta o arriendo",  icon: "📚", desc: "Cualquiera de las dos" },
];

const CONDITION_OPTIONS: { value: Condition; label: string; color: string }[] = [
  { value: "new",  label: "Como nuevo",    color: "text-green-700 bg-green-50 border-green-200" },
  { value: "good", label: "Buen estado",   color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "fair", label: "Estado regular", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  { value: "poor", label: "Con detalles",  color: "text-red-700 bg-red-50 border-red-200" },
];

const DESCRIPTION_FALLBACK = "Libro usado publicado en tuslibros.cl.";

type BookDataWithDescriptionAliases = BookData & {
  synopsis?: string | null;
  summary?: string | null;
};

function getBookDescription(book?: BookDataWithDescriptionAliases | null) {
  return (book?.description ?? book?.synopsis ?? book?.summary ?? "").trim();
}

function publishErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Ocurrió un error al publicar.";
}

interface DefaultLocation {
  lat: number;
  lng: number;
  address: string;
}

interface Props {
  userId: string;
  username?: string | null;
  existingPhone?: string | null;
  defaultLocation?: DefaultLocation | null;
}

export default function PublishForm({ userId, username, existingPhone, defaultLocation }: Props) {
  const router = useRouter();
  const supabase = createClient();

  // book es metadata de prellenado opcional — ya NO bloquea el formulario
  const [book, setBook] = useState<BookData | null>(null);
  // Campos siempre editables, independientes de si book fue identificado
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [subcategorySlug, setSubcategorySlug] = useState<string | null>(null);
  const [binding, setBinding] = useState<string>("");
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [modality, setModality] = useState<Modality>("sale");
  const [originalPrice, setOriginalPrice] = useState("");
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
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const pendingInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

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

  function handlePendingFiles(files: FileList) {
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 10 * 1024 * 1024) continue;
      if (pendingImages.length + newFiles.length >= 5) break;
      newFiles.push(f);
      newPreviews.push(URL.createObjectURL(f));
    }
    setPendingImages((prev) => [...prev, ...newFiles]);
    setPendingPreviews((prev) => [...prev, ...newPreviews]);
  }

  function handleSaveDraft() {
    const draft = {
      book,
      categorySlug,
      subcategorySlug,
      binding,
      modality,
      price,
      originalPrice,
      condition,
      notes,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("tuslibros_draft", JSON.stringify(draft));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  }

  // Restaurar borrador al montar
  // (puedes activar esto si quieres auto-restore)
  // useEffect(() => {
  //   const raw = localStorage.getItem("tuslibros_draft");
  //   if (raw) { try { const d = JSON.parse(raw); setBook(d.book); ... } catch {} }
  // }, []);

  async function handleScanCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanLoading(true);
    setScanError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/books/scan-cover", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error ?? "No se pudo identificar el libro. Intenta con ISBN o ingreso manual.");
        return;
      }
      // Éxito — pre-rellenar datos del libro (nunca pisamos lo que el usuario ya escribió)
      setBook(data);
      if (data.title?.trim()) setBookTitle(data.title.trim());
      if (data.author?.trim()) setBookAuthor(data.author.trim());
      const incomingDescription = getBookDescription(data);
      if (incomingDescription) setBookDescription(incomingDescription);
      const normalized = normalizeGenre(data.genre, data.title, incomingDescription);
      if (normalized) {
        setCategorySlug(normalized.category);
        setSubcategorySlug(normalized.subcategory);
      }
    } catch {
      setScanError("Error de conexión. Usa ISBN o ingreso manual.");
    } finally {
      setScanLoading(false);
      // Reset input para permitir volver a escanear
      if (scanInputRef.current) scanInputRef.current.value = "";
    }
  }

  function removePendingImage(index: number) {
    URL.revokeObjectURL(pendingPreviews[index]);
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadPendingImages(listingId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || pendingImages.length === 0) return;

    let firstUploadedUrl: string | null = null;

    for (let i = 0; i < pendingImages.length; i++) {
      try {
        const file = await compressImage(pendingImages[i]);
        const path = `${user.id}/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

        const { error: uploadErr } = await supabase.storage
          .from("covers")
          .upload(path, file, { upsert: true });
        if (uploadErr) continue;

        const { data: { publicUrl } } = supabase.storage
          .from("covers")
          .getPublicUrl(path);

        await supabase.from("listing_images").insert({
          listing_id: listingId,
          image_url: publicUrl,
          sort_order: i,
        });

        if (!firstUploadedUrl) firstUploadedUrl = publicUrl;
      } catch {
        console.error("Failed to upload pending image", i);
      }
    }

    // If the listing has no cover image, use the first uploaded image
    if (firstUploadedUrl) {
      const { data: listing } = await supabase
        .from("listings")
        .select("cover_image_url")
        .eq("id", listingId)
        .single();

      if (listing && !listing.cover_image_url) {
        await supabase
          .from("listings")
          .update({ cover_image_url: firstUploadedUrl })
          .eq("id", listingId);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookTitle.trim()) { setError("El libro necesita un título. Complétalo antes de publicar."); return; }
    if (!bookAuthor.trim()) { setError("El libro necesita un autor. Complétalo antes de publicar."); return; }
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
      // Si el libro tiene ISBN, reutilizar el registro existente para evitar duplicados.
      // Si no existe o no tiene ISBN (ingreso manual), hacer insert directo.
      // Si el usuario eligió explícitamente: usar esa selección.
      // Si no, intentar inferir desde genre del libro (legacy path).
      let finalCategory: string | null = categorySlug;
      let finalSubcategory: string | null = subcategorySlug;
      if (!finalCategory && book?.genre) {
        const normalized = normalizeGenre(book.genre, book?.title ?? bookTitle, book?.description);
        if (normalized) {
          finalCategory = normalized.category;
          finalSubcategory = normalized.subcategory;
        }
      }
      const tags = suggestTags({
        title: bookTitle,
        author: bookAuthor,
        category: finalCategory ?? undefined,
        subcategory: finalSubcategory ?? undefined,
        description: bookDescription || getBookDescription(book),
      });
      const finalDescription = (bookDescription || getBookDescription(book)).trim() || DESCRIPTION_FALLBACK;

      const bookPayload = {
        isbn: book?.isbn ?? null,
        title: bookTitle,
        author: bookAuthor,
        description: finalDescription,
        cover_url: customCoverUrl ?? book?.cover_url ?? null,
        genre: book?.genre || null,
        category: finalCategory,
        subcategory: finalSubcategory,
        tags,
        published_year: book?.published_year ?? null,
        publisher: book?.publisher ?? null,
        pages: book?.pages ?? null,
        binding: binding || null,
        created_by: userId,
      };

      let bookId: string;

      if (book?.isbn) {
        const { data: existingBook, error: findBookErr } = await supabase
          .from("books")
          .select("id")
          .eq("isbn", book.isbn)
          .maybeSingle();
        if (findBookErr) throw new Error(findBookErr.message);

        if (existingBook?.id) {
          bookId = existingBook.id;
        } else {
          const { data: bookRow, error: bookErr } = await supabase
            .from("books")
            .insert(bookPayload)
            .select("id")
            .single();
          if (bookErr) throw new Error(bookErr.message);
          bookId = bookRow.id;
        }
      } else {
        const { data: bookRow, error: bookErr } = await supabase
          .from("books")
          .insert(bookPayload)
          .select("id")
          .single();
        if (bookErr) throw new Error(bookErr.message);
        bookId = bookRow.id;
      }

      // Insertar publicación
      // Generate unique slug
      const baseSlug = slugify(bookTitle || "libro");
      let slug = baseSlug;
      const { count } = await supabase.from("listings").select("id", { count: "exact", head: true }).eq("slug", baseSlug);
      if (count && count > 0) slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

      const { data: newListing, error: listingErr } = await supabase.from("listings").insert({
        book_id: bookId,
        seller_id: userId,
        slug,
        modality,
        price: modality !== "loan" ? parseFloat(price) : null,
        original_price: modality !== "loan" && originalPrice ? parseFloat(originalPrice) : null,
        rental_price: modality !== "sale" ? parseFloat(rentalPrice) : null,
        rental_deposit: modality !== "sale" && rentalDeposit ? parseFloat(rentalDeposit) : null,
        rental_period_days: modality !== "sale" ? rentalPeriod : null,
        condition,
        notes: notes.trim() || null,
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
        cover_image_url: customCoverUrl ?? book?.cover_url ?? null,
        status: "active",
      }).select("id, slug").single();

      if (listingErr) throw new Error(listingErr.message);

      // Gong Telegram (fire-and-forget) — Vero recibe notificación cuando alguien publica
      if (newListing?.id) {
        fetch("/api/webhooks/listing-created", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: newListing.id }),
        }).catch(() => {});
      }

      // Guardar teléfono en el perfil del usuario si fue ingresado
      if (phone) {
        await supabase.from("users").update({ phone }).eq("id", userId);
      }

      // Upload pending additional images
      if (newListing?.id && pendingImages.length > 0) {
        await uploadPendingImages(newListing.id);
      }

      if (newListing?.id) {
        trackEvent("listing_created", {
          listing_id: newListing.id,
        });
      }

      setPublishedListingId(newListing?.id ?? null);
      setPublishedSlug(newListing?.slug ?? null);
      setPublishSuccess(true);
    } catch (err: unknown) {
      setError(publishErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (publishSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-8 space-y-6">
        <div className="text-5xl">🎉</div>
        <h2 className="font-display text-2xl font-bold text-ink">¡Libro publicado!</h2>
        <p className="text-ink-muted text-sm">
          Tu libro ya está visible en la tienda y en el mapa.
        </p>

        {/* Upload additional images */}
        {publishedListingId && (
          <div className="bg-white rounded-xl border border-cream-dark/30 p-5 text-left">
            <ImageUploadMultiple
              listingId={publishedListingId}
              existingImages={[]}
              onImagesChanged={() => {}}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {publishedListingId && (
            <Link
              href={publishedSlug && username ? `/libro/${username}/${publishedSlug}` : `/listings/${publishedListingId}`}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Ver publicación
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setPublishSuccess(false);
              setPublishedListingId(null);
              // Reset form would go here
              window.location.href = "/publish";
            }}
            className="px-6 py-3 border border-cream-dark/40 text-ink font-semibold rounded-xl text-sm hover:bg-cream-warm transition-colors"
          >
            Publicar otro libro
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Sección 1: Libro ── */}
      <section className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-dark bg-cream-warm">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">1</span>
            ¿Qué libro quieres publicar?
          </h2>
        </div>
        <div className="px-6 py-5">
            {/* ── Identificación asistida: siempre visible, nunca bloqueante ── */}
          <div className="flex gap-4 items-start mb-5">
            <CoverUpload
              currentUrl={customCoverUrl ?? book?.cover_url}
              onUploaded={setCustomCoverUrl}
            />
            <div className="flex-1 min-w-0 space-y-2">
              {/* Título — siempre editable */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Ej: El nombre del viento"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              {/* Autor — siempre editable */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Autor <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="Ej: Patrick Rothfuss"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Descripción / Sinopsis <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={bookDescription}
                  onChange={(e) => setBookDescription(e.target.value)}
                  rows={3}
                  placeholder="Sinopsis o descripción del libro..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
              </div>
              {/* Badge si fue identificado */}
              {book && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ✓ Datos prellenados
                  </span>
                  <button
                    type="button"
                    onClick={() => { setBook(null); setCustomCoverUrl(null); }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Asistente de identificación: siempre disponible ── */}
          {!book && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => scanInputRef.current?.click()}
                disabled={scanLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-50 border-2 border-brand-200 hover:border-brand-400 hover:bg-brand-100 text-brand-700 font-bold rounded-2xl text-sm transition-all shadow-sm group"
              >
                {scanLoading ? (
                  <><span className="w-4 h-4 border-2 border-brand-400 border-t-brand-700 rounded-full animate-spin" /> Analizando portada...</>
                ) : (
                  <>
                    <span className="text-xl group-hover:scale-110 transition-transform">📸</span> 
                    Identificar por foto de portada
                  </>
                )}
              </button>
              <input
                ref={scanInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleScanCover}
              />
              <p className="text-[10px] text-center text-ink-muted mt-2 px-4">
                La forma más rápida: sácale una foto a la portada y nuestra IA completará todo por ti.
              </p>
              {scanError && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-red-500 font-medium">No se pudo identificar automáticamente — intenta con ISBN o ingreso manual.</p>
                </div>
              )}
            </div>
          )}

          <div className="relative flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-cream-dark/40" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">o por código</span>
            <div className="flex-1 border-t border-cream-dark/40" />
          </div>

          <ISBNSearch hideManualForm onBookFound={(b) => {
              setBook(b);
              if (b.title?.trim()) setBookTitle(b.title.trim());
              if (b.author?.trim()) setBookAuthor(b.author.trim());
              const incomingDescription = getBookDescription(b);
              if (incomingDescription) setBookDescription(incomingDescription);
              const normalized = normalizeGenre(b.genre, b.title, incomingDescription);
              if (normalized) {
                setCategorySlug(normalized.category);
                setSubcategorySlug(normalized.subcategory);
              }
            }} />
        </div>
      </section>

      {/* ── Sección 1b: Categoría ── — siempre visible */}
      <section className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-cream-dark bg-cream-warm">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Categoría
              <span className="text-gray-400 font-normal">(opcional)</span>
            </h2>
          </div>
          <div className="px-6 py-5">
            <CategoryPicker
              value={{ category: categorySlug, subcategory: subcategorySlug }}
              onChange={(v) => {
                setCategorySlug(v.category);
                setSubcategorySlug(v.subcategory);
              }}
            />
            {book?.genre && !categorySlug && (
              <p className="text-xs text-gray-400 mt-1.5">
                Sugerencia según datos del libro: {book.genre}
              </p>
            )}
          </div>

          {/* Encuadernación */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encuadernación <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "hardcover", label: "Tapa dura" },
                { value: "softcover", label: "Tapa blanda" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBinding(binding === opt.value ? "" : opt.value)}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                    binding === opt.value
                      ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-400"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info auto-completada */}
          {(book?.publisher || book?.pages) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {book?.publisher && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {book.publisher}
                </span>
              )}
              {book?.pages && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {book.pages} páginas
                </span>
              )}
            </div>
          )}
        </section>

      {/* ── Sección 2: Modalidad y precio ── */}
      <section className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-dark bg-cream-warm">
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

          {/* Precio original + Precio */}
          {modality !== "loan" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio original <span className="text-gray-400 font-normal">(opcional, se muestra tachado)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm font-medium pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Ej: 15000"
                    min="0"
                    step="1"
                    className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                {originalPrice && price && parseFloat(originalPrice) > parseFloat(price) && (
                  <p className="text-xs text-green-600 mt-1">
                    Descuento: {Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)}%
                  </p>
                )}
              </div>
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
                    step="1"
                    className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              </div>
            </>
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
                    step="1"
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
      <section className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-dark bg-cream-warm">
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

      {/* ── Sección 3b: Fotos adicionales ── */}
      <section className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-dark bg-cream-warm">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Fotos adicionales
            <span className="text-gray-400 font-normal">(opcional)</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Contraportada, estado del lomo, detalles. Se suben al publicar.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {pendingPreviews.map((src, i) => (
              <div key={i} className="relative w-16 h-20 rounded overflow-hidden border border-gray-200">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePendingImage(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  x
                </button>
              </div>
            ))}
            {pendingImages.length < 5 && (
              <button
                type="button"
                onClick={() => pendingInputRef.current?.click()}
                className="w-16 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center hover:border-brand-400 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[9px] text-gray-400">Foto</span>
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{pendingImages.length}/5 fotos adicionales</p>
          <input
            ref={pendingInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handlePendingFiles(e.target.files)}
          />
        </div>
      </section>

      {/* ── Sección 4: Teléfono WhatsApp ── */}
      <section className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-dark bg-cream-warm">
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
      <section className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-dark bg-cream-warm">
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
