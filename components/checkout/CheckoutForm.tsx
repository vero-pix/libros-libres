"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ListingWithBook } from "@/types";

interface ShippingQuote {
  service: string;
  serviceCode: number;
  deliveryTime: string;
  price: number;
  courier?: string;
}

// Fallback cuando no hay API de courier o falla la cotización
const FALLBACK_OPTIONS: ShippingQuote[] = [
  {
    service: "Estándar",
    serviceCode: 0,
    deliveryTime: "3-5 días hábiles",
    price: 2900,
  },
];

interface Props {
  listing: ListingWithBook;
  buyerAddress: string;
  buyerName: string;
  buyerPhone: string;
}

type DeliveryMethod = "courier" | "in_person" | "pickup_point";

const DELIVERY_OPTIONS = [
  { value: "in_person" as const, label: "Encuentro en persona", desc: "Gratis — coordina lugar y hora con el vendedor", icon: "🤝", enabled: true },
  // Punto de retiro: reactivar cuando haya convenios con lugares específicos
  // { value: "pickup_point" as const, label: "Punto de retiro", desc: "Retira en un punto convenido", icon: "📍", enabled: true },
  { value: "courier" as const, label: "Envío courier", desc: "Recibe en tu domicilio vía Shipit", icon: "📦", enabled: true },
];

export default function CheckoutForm({ listing, buyerAddress, buyerName, buyerPhone }: Props) {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("in_person");
  const [address, setAddress] = useState(buyerAddress);
  const [phone, setPhone] = useState(buyerPhone);
  const [guestName, setGuestName] = useState(buyerName);
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGuest = !buyerName;

  // Shipping quotes
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const { book } = listing;
  const bookPrice = listing.price ?? 0;

  const isCourier = deliveryMethod === "courier";
  const selectedQuote = isCourier ? quotes.find((q) => q.serviceCode === selectedService) : null;
  const shippingCost = selectedQuote?.price ?? 0;
  const total = bookPrice + shippingCost;

  const fetchQuotes = useCallback(
    async (addr: string) => {
      if (!addr.trim() || addr.trim().length < 5) return;

      setQuoting(true);
      setQuoteError(null);

      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listing_id: listing.id,
            buyer_address: addr,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setQuoteError(data.error ?? "Error al cotizar envío");
          setQuotes(FALLBACK_OPTIONS);
          setSelectedService(FALLBACK_OPTIONS[0].serviceCode);
          return;
        }

        const q = data.quotes as ShippingQuote[];
        setQuotes(q);
        if (q.length > 0) {
          const cheapest = q.reduce((a, b) => (a.price < b.price ? a : b));
          setSelectedService(cheapest.serviceCode);
        }
      } catch {
        setQuoteError("Error de conexión al cotizar");
        setQuotes(FALLBACK_OPTIONS);
        setSelectedService(FALLBACK_OPTIONS[0].serviceCode);
      } finally {
        setQuoting(false);
      }
    },
    [listing.id]
  );

  // Cotizar al cargar si ya tenemos dirección guardada
  useEffect(() => {
    if (buyerAddress && buyerAddress.trim().length >= 10) {
      fetchQuotes(buyerAddress);
    }
  }, [buyerAddress, fetchQuotes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isCourier && !selectedQuote) return;
    if (!phone.trim()) { setError("Necesitamos un teléfono de contacto para el vendedor."); return; }
    
    setLoading(true);
    setError(null);

    try {
      // Update profile if data changed or was missing
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.from("users").update({
        phone,
        default_address: address || buyerAddress,
      }).eq("id", (await supabase.auth.getUser()).data.user?.id);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          shipping_speed: "standard",
          shipping_cost_override: isCourier ? selectedQuote!.price : 0,
          shipping_service: isCourier ? selectedQuote!.service : deliveryMethod === "in_person" ? "Entrega en persona" : "Punto de retiro",
          shipping_courier: isCourier ? selectedQuote!.courier : undefined,
          buyer_address: isCourier ? address : deliveryMethod,
          guest_info: isGuest ? {
            name: guestName,
            email: guestEmail,
            phone: phone
          } : undefined
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al procesar el pedido");
        return;
      }

      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
      <div className="space-y-6">
        {/* Contact info */}
        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-cream-dark bg-cream-warm">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Tus datos de contacto</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {isGuest && (
              <>
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Tu nombre completo</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ej: María García"
                    required
                    className="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-cream/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Correo electrónico</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    className="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-cream/30"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Teléfono WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56912345678"
                required
                className="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-cream/30"
              />
            </div>
            <p className="text-[10px] text-ink-muted mt-1 italic">Usado solo para coordinar la entrega de tu libro.</p>
          </div>
        </div>

        {/* Delivery method */}
        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-cream-dark bg-cream-warm">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Forma de entrega</h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            {DELIVERY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  !opt.enabled
                    ? "opacity-50 grayscale"
                    : deliveryMethod === opt.value
                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-400"
                      : "border-cream-dark hover:border-brand-300 bg-white"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                  deliveryMethod === opt.value ? "bg-brand-100" : "bg-cream"
                }`}>
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">{opt.label}</p>
                  <p className="text-xs text-ink-muted">{opt.desc}</p>
                </div>
                <input
                  type="radio"
                  name="delivery"
                  value={opt.value}
                  checked={deliveryMethod === opt.value}
                  onChange={() => opt.enabled && setDeliveryMethod(opt.value)}
                  disabled={!opt.enabled}
                  className="w-4 h-4 text-brand-600 border-cream-dark focus:ring-brand-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Shipping address — only for courier */}
        {isCourier && (
          <div className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-cream-dark bg-cream-warm">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Dirección de envío</h2>
            </div>
            <div className="px-6 py-5">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, comuna — ej: Av. Apoquindo 3000, Las Condes"
                  required={isCourier}
                  className="flex-1 px-4 py-2.5 border border-cream-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-cream/30"
                />
                <button
                  type="button"
                  onClick={() => fetchQuotes(address)}
                  disabled={quoting || address.trim().length < 5}
                  className="px-6 py-2.5 bg-ink hover:bg-black disabled:bg-gray-300 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  {quoting ? "Calculando..." : "Calcular envío"}
                </button>
              </div>
              {quoting && (
                <div className="mt-3 flex items-center gap-2 text-[10px] text-ink-muted font-bold uppercase tracking-widest animate-pulse">
                  <span className="w-2 h-2 bg-brand-500 rounded-full" />
                  Cotizando con couriers...
                </div>
              )}
            </div>

            {/* Shipping options */}
            {quotes.length > 0 && (
              <div className="px-6 pb-6 space-y-3">
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-2">Opciones disponibles:</p>
                {quotes.map((q) => (
                  <label
                    key={q.serviceCode}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedService === q.serviceCode
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-400"
                        : "border-cream-dark hover:border-brand-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        value={q.serviceCode}
                        checked={selectedService === q.serviceCode}
                        onChange={() => setSelectedService(q.serviceCode)}
                        className="w-4 h-4 text-brand-600 border-cream-dark focus:ring-brand-500"
                      />
                      <div>
                        <p className="font-bold text-ink text-sm">
                          {q.service} {q.courier ? `(${q.courier})` : ""}
                        </p>
                        <p className="text-[10px] text-ink-muted font-medium uppercase tracking-wider">
                          Entrega: {q.deliveryTime}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-ink text-sm">
                      ${q.price.toLocaleString("es-CL")}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar: Summary & Pay */}
      <aside className="sticky top-8 space-y-6">
        <div className="bg-white rounded-2xl border border-cream-dark shadow-md overflow-hidden">
          <div className="p-6 border-b border-cream-dark">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">Resumen del pedido</h2>
            <div className="flex gap-4">
              <div className="w-16 h-20 relative bg-cream rounded-lg overflow-hidden border border-cream-dark/30 flex-shrink-0">
                {book.cover_url ? (
                  <Image
                    src={book.cover_url}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-cream">📚</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink text-sm leading-tight line-clamp-2 mb-1">{book.title}</h3>
                <p className="text-xs text-ink-muted italic mb-2">{book.author}</p>
                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                  Vendido por {listing.seller?.full_name?.split(" ")[0] || "Vendedor"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-cream-warm/30 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted font-medium">Libro</span>
              <span className="text-ink font-bold">${bookPrice.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted font-medium">
                {isCourier ? "Envío" : "Entrega"}
              </span>
              <span className="text-ink font-bold">
                {isCourier
                  ? selectedQuote
                    ? `$${shippingCost.toLocaleString("es-CL")}`
                    : "—"
                  : "Gratis"}
              </span>
            </div>
            <div className="pt-3 border-t border-cream-dark flex justify-between items-baseline">
              <span className="text-ink font-bold uppercase tracking-wider">Total</span>
              <div className="text-right">
                <p className="text-2xl font-black text-ink leading-none">
                  ${(isCourier && !selectedQuote) ? "—" : total.toLocaleString("es-CL")}
                </p>
                <p className="text-[10px] text-ink-muted font-medium mt-1 uppercase tracking-tighter">IVA incluido</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-medium rounded-xl animate-shake">
                ⚠️ {error}
              </div>
            )}

            {(listing.seller as any)?.mercadopago_user_id ? (
              <button
                onClick={handleSubmit}
                disabled={loading || (isCourier && (!address || !selectedQuote)) || !phone}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-sm transition-all shadow-lg shadow-brand-500/20 active:scale-95"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </div>
                ) : (
                  `Pagar con MercadoPago`
                )}
              </button>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-center">
                <p className="text-[11px] text-amber-800 font-medium">Este vendedor no tiene pago online configurado.</p>
              </div>
            )}

            {!isCourier && listing.seller?.phone && (
              <a
                href={`https://wa.me/${listing.seller.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hola! Me interesa "${book.title}" a $${bookPrice.toLocaleString("es-CL")} en tuslibros.cl. ¿Podemos coordinar la entrega?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Coordinar por WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
          <div className="flex gap-3">
            <span className="text-xl">🛡️</span>
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-1">Compra protegida</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">Si pagas por la plataforma, retenemos el dinero hasta que confirmes la recepción. Si hay algún problema, te devolvemos el 100%.</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
