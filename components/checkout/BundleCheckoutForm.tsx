"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ListingWithBook } from "@/types";
import { mostrarWhatsAppVendedor } from "@/lib/whatsapp-policy";
import { calcularEnvioPromo } from "@/lib/shipping-promo";

interface ShippingQuote {
  service: string;
  serviceCode: number;
  deliveryTime: string;
  price: number;
  courier?: string;
}

const FALLBACK_OPTIONS: ShippingQuote[] = [
  {
    service: "Estándar",
    serviceCode: 0,
    deliveryTime: "3-5 días hábiles",
    price: 2900,
  },
];

interface Props {
  listings: ListingWithBook[];
  buyerAddress: string;
  buyerName: string;
}

type DeliveryMethod = "courier" | "in_person" | "pickup_point";

const DELIVERY_OPTIONS = [
  {
    value: "in_person" as const,
    label: "Encuentro en persona",
    desc: "Gratis — coordina lugar y hora con el vendedor",
    icon: "🤝",
    enabled: true,
  },
  {
    value: "courier" as const,
    label: "Envío courier",
    desc: "Recibe en tu domicilio vía Shipit (un solo paquete con todos los libros)",
    icon: "📦",
    enabled: true,
  },
];

export default function BundleCheckoutForm({
  listings,
  buyerAddress,
  buyerName,
}: Props) {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("in_person");
  const [address, setAddress] = useState(buyerAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  // Mismo problema que en CheckoutForm: el botón se apagaba sin decir qué falta.
  const motivoBloqueo = (): string | null => {
    if (!isCourier) return null;
    if (!address) return "Escribe la dirección donde quieres recibir los libros.";
    if (!addressHasNumber) return "Falta el número de la calle en tu dirección.";
    if (shippingUnavailable) return "No hay courier que llegue a tu dirección. Cambia a encuentro en persona.";
    if (!selectedQuote) return "Aprieta \u201cCalcular envío\u201d y elige una opción de despacho.";
    return null;
  };

  /** Shipit confirmó que no hay despacho posible entre estas comunas. */
  const [shippingUnavailable, setShippingUnavailable] = useState(false);

  const seller = listings[0].seller;
  const totalBookPrice = listings.reduce(
    (sum, l) => sum + (l.price ?? 0),
    0
  );

  const isCourier = deliveryMethod === "courier";
  // El courier necesita calle Y número. Rodrigo Cumsille compró con su
  // `default_address` guardado, que era solo "San Fernando, Región de
  // O'Higgins": la orden llegó a Shipit con `number: 0` y no había cómo
  // entregar aunque la etiqueta se hubiera emitido. (5 ago 2026)
  const addressHasNumber = /\d{1,6}(\s|,|$)/.test(address);
  const addressIncomplete = isCourier && address.trim().length >= 5 && !addressHasNumber;
  const selectedQuote = isCourier
    ? quotes.find((q) => q.serviceCode === selectedService)
    : null;
  /** Lo que cobra el courier de verdad. Es lo que se manda al servidor. */
  const fleteCotizado = selectedQuote?.price ?? 0;
  // Envío gratis sobre el umbral. El servidor lo recalcula al crear la orden:
  // acá es solo para mostrar. Ver lib/shipping-promo.ts (25 ago 2026).
  const promo = calcularEnvioPromo({
    sellerId: seller?.id,
    totalBookPrice,
    fleteCotizado,
    esCourier: isCourier,
  });
  const shippingCost = promo.cobrarAlComprador;
  const total = totalBookPrice + shippingCost;

  const firstListingId = listings[0].id;

  const fetchQuotes = useCallback(
    async (addr: string) => {
      if (!addr.trim() || addr.trim().length < 5) return;

      setQuoting(true);
      setQuoteError(null);
      setShippingUnavailable(false);

      try {
        // Un reintento antes de rendirse. El fallback de $2.900 es una tarifa
        // de referencia que casi siempre queda por debajo del costo real (el
        // piso observado en Shipit ronda los $4.400), así que cada vez que
        // entra por un fallo pasajero de red le cuesta plata a la casa. Que
        // sea la excepción de verdad, no el camino fácil.
        const pedirCotizacion = () =>
          fetch("/api/shipping/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listing_id: firstListingId,
              buyer_address: addr,
            }),
          });

        let res = await pedirCotizacion();
        if (!res.ok && res.status >= 500) {
          await new Promise((r) => setTimeout(r, 1200));
          res = await pedirCotizacion();
        }

        const data = await res.json();

        const q = (data.quotes ?? []) as ShippingQuote[];

        // Shipit dijo explícitamente que no hay servicio entre estas dos
        // comunas (típico: ningún courier retira en el origen). No hay tarifa
        // que estimar — ofrecer el fallback vende un despacho que nadie puede
        // hacer. Pasó con la primera venta de Libros del Bardo: Melipeuco no
        // tiene retiro, se cobró $2.900 y la etiqueta nunca se pudo emitir.
        // (5 ago 2026)
        if (res.ok && data.unavailable) {
          setQuoteError(
            "No hay courier que despache este pedido a tu dirección. Puedes coordinar un encuentro en persona con el vendedor."
          );
          setShippingUnavailable(true);
          setQuotes([]);
          setSelectedService(null);
          return;
        }

        // Sin opciones se cae a las tarifas de referencia, VENGA COMO VENGA la
        // respuesta. El endpoint devuelve 200 con `quotes: []` a propósito
        // ("so fallback works"), pero el fallback vivía detrás de `!res.ok` y
        // por lo tanto nunca corría: el comprador quedaba con el botón muerto
        // en "Ingresa dirección" habiendo escrito su dirección, y sin ver el
        // motivo. Una compradora lo reportó por correo. (4 ago 2026)
        if (!res.ok || q.length === 0) {
          {
            const crudo = data.error ?? "Error al cotizar envío";
            setQuoteError(
              /no reconoce la comuna de destino/i.test(crudo)
                ? "No reconocimos la comuna de tu dirección. Escríbela completa y sepárala con coma — por ejemplo: Av. Apoquindo 3000, Las Condes."
                : crudo
            );
          }
          setQuotes(FALLBACK_OPTIONS);
          setSelectedService(FALLBACK_OPTIONS[0].serviceCode);
          return;
        }

        setQuotes(q);
        const cheapest = q.reduce((a, b) => (a.price < b.price ? a : b));
        setSelectedService(cheapest.serviceCode);
      } catch {
        setQuoteError("Error de conexión al cotizar");
        setShippingUnavailable(false);
        setQuotes(FALLBACK_OPTIONS);
        setSelectedService(FALLBACK_OPTIONS[0].serviceCode);
      } finally {
        setQuoting(false);
      }
    },
    [firstListingId]
  );

  useEffect(() => {
    if (buyerAddress && buyerAddress.trim().length >= 10) {
      fetchQuotes(buyerAddress);
    }
  }, [buyerAddress, fetchQuotes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isCourier && (!selectedQuote || shippingUnavailable || !addressHasNumber)) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_ids: listings.map((l) => l.id),
          shipping_speed: "standard",
          shipping_cost_override: isCourier ? selectedQuote!.price : 0,
          shipping_service: isCourier
            ? selectedQuote!.service
            : deliveryMethod === "in_person"
              ? "Entrega en persona"
              : "Punto de retiro",
          shipping_courier: isCourier ? selectedQuote!.courier : undefined,
          buyer_address: isCourier ? address : deliveryMethod,
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

  const sellerHasMP = !!(seller as any)?.mercadopago_user_id;
  const sellerPhone = (seller as any)?.phone as string | undefined;

  function waMessage() {
    const lines = listings
      .map((l, i) => `${i + 1}. ${l.book.title} — $${(l.price ?? 0).toLocaleString("es-CL")}`)
      .join("\n");
    return encodeURIComponent(
      `Hola! Me interesan estos ${listings.length} libros de tuslibros.cl:\n\n${lines}\n\nTotal: $${totalBookPrice.toLocaleString("es-CL")}. ¿Coordinamos?`
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resumen de libros */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          {listings.length} {listings.length === 1 ? "libro" : "libros"} de {seller?.full_name ?? "Vendedor"}
        </h2>
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="flex gap-3 items-center">
              <div className="w-12 h-16 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                {(l.cover_image_url ?? l.book.cover_url) ? (
                  <Image
                    src={(l.cover_image_url ?? l.book.cover_url) as string}
                    alt={l.book.title}
                    width={48}
                    height={64}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-xl">📚</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {l.book.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{l.book.author}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                ${(l.price ?? 0).toLocaleString("es-CL")}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between text-sm">
          <span className="text-gray-600">Subtotal libros</span>
          <span className="font-semibold text-gray-900">
            ${totalBookPrice.toLocaleString("es-CL")}
          </span>
        </div>
      </div>

      {/* Forma de entrega */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Forma de entrega</h2>
        <div className="space-y-2">
          {DELIVERY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                deliveryMethod === opt.value
                  ? "border-brand-500 bg-brand-50 cursor-pointer"
                  : "border-gray-200 hover:border-gray-300 cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value={opt.value}
                checked={deliveryMethod === opt.value}
                onChange={() => setDeliveryMethod(opt.value)}
                className="accent-brand-500"
              />
              <span className="text-lg">{opt.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Dirección courier */}
      {isCourier && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Dirección de envío</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, comuna — ej: Av. Apoquindo 3000, Las Condes"
              required
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="button"
              onClick={() => fetchQuotes(address)}
              disabled={quoting || address.trim().length < 5 || !addressHasNumber}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
            >
              {quoting ? "Cotizando..." : "Cotizar"}
            </button>
          </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Incluye la <strong>comuna</strong>: es lo que usan los couriers para cotizar el despacho.
              </p>

          {addressIncomplete && (
            <p className="mt-2 text-xs text-amber-700">
              Falta el número de la calle. Sin él el courier no puede entregar.
            </p>
          )}
        </div>
      )}

      {isCourier && shippingUnavailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <h2 className="font-semibold text-amber-900 mb-1 text-sm">
            No hay despacho disponible para este pedido
          </h2>
          <p className="text-xs text-amber-800">
            Ningún courier cubre la ruta entre la comuna del vendedor y tu
            dirección. Puedes cambiar a <strong>encuentro en persona</strong> y
            coordinar con el vendedor, o probar con otra dirección.
          </p>
        </div>
      )}

      {isCourier && quotes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Opciones de envío</h2>
          {quoteError && (
            <p className="text-xs text-amber-600 mb-3">
              {quoteError} — mostrando precio estimado.
            </p>
          )}
          <div className="space-y-3">
            {quotes.map((q) => (
              <label
                key={q.serviceCode}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedService === q.serviceCode
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    value={q.serviceCode}
                    checked={selectedService === q.serviceCode}
                    onChange={() => setSelectedService(q.serviceCode)}
                    className="accent-brand-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{q.service}</p>
                    <p className="text-xs text-gray-500">
                      {q.deliveryTime}
                      {q.courier ? ` — ${q.courier}` : ""}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900 text-sm">
                  ${q.price.toLocaleString("es-CL")}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Desglose de pago */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Detalle del pago</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {listings.length} {listings.length === 1 ? "libro" : "libros"}
            </span>
            <span className="text-gray-900">
              ${totalBookPrice.toLocaleString("es-CL")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              {isCourier
                ? `Envío${selectedQuote ? ` (${selectedQuote.service})` : ""}`
                : "Entrega"}
            </span>
            <span className="text-gray-900">
              {!isCourier ? (
                "Gratis"
              ) : !selectedQuote ? (
                "Ingresa dirección"
              ) : promo.aplica ? (
                <>
                  <span className="text-gray-400 line-through mr-1.5">
                    ${fleteCotizado.toLocaleString("es-CL")}
                  </span>
                  <span className="text-green-700 font-semibold">
                    {shippingCost > 0 ? `$${shippingCost.toLocaleString("es-CL")}` : "Gratis"}
                  </span>
                </>
              ) : (
                `$${shippingCost.toLocaleString("es-CL")}`
              )}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">
              {isCourier
                ? selectedQuote
                  ? `$${total.toLocaleString("es-CL")}`
                  : "—"
                : `$${total.toLocaleString("es-CL")}`}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error}
        </div>
      )}

      {sellerHasMP && !loading && motivoBloqueo() && (
        <p className="text-xs text-amber-700 text-center">{motivoBloqueo()}</p>
      )}

      {sellerHasMP && (
        <>
          <button
            type="submit"
            disabled={
              loading ||
              (isCourier &&
                (!address || !selectedQuote || shippingUnavailable || !addressHasNumber))
            }
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            {loading
              ? "Procesando..."
              : isCourier
                ? selectedQuote
                  ? `Pagar $${total.toLocaleString("es-CL")} con MercadoPago`
                  : "Ingresa dirección para cotizar envío"
                : `Pagar $${total.toLocaleString("es-CL")} con MercadoPago`}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Serás redirigido a MercadoPago para completar el pago de forma segura, en una sola transacción por los {listings.length} libros.
          </p>
        </>
      )}

      {sellerPhone && mostrarWhatsAppVendedor(sellerHasMP) && (
        <>
          {sellerHasMP && (
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex-1 border-t border-gray-200" />o
              <span className="flex-1 border-t border-gray-200" />
            </div>
          )}
          <a
            href={`https://wa.me/${sellerPhone.replace(/\D/g, "")}?text=${waMessage()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Coordinar por WhatsApp — sin comisión
          </a>
          <p className="text-xs text-gray-400 text-center">
            Coordinas directamente con el vendedor. Sin costo adicional.
          </p>
        </>
      )}

      {!sellerHasMP && !sellerPhone && (
        <p className="text-sm text-gray-500 text-center bg-gray-50 rounded-lg p-4">
          Este vendedor aún no tiene métodos de pago configurados.
        </p>
      )}
    </form>
  );
}
