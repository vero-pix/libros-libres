"use client";

import Link from "next/link";

interface Props {
  title: string;
  author?: string | null;
  isbn?: string | null;
  currentPrice?: number | null;
  variant?: "seller" | "buyer";
  listingId?: string;
}

export default function PriceCompare({ title, author, isbn, currentPrice, variant = "seller", listingId }: Props) {
  const searchTerm = isbn || `${title} ${author || ""}`.trim();
  const encodedTitle = encodeURIComponent(searchTerm);
  const mlSearch = encodeURIComponent(`${title} ${author || ""}`.trim());

  const links = [
    {
      name: "Buscalibre",
      url: `https://www.buscalibre.cl/libros/search?q=${encodedTitle}`,
      color: "text-orange-600 border-orange-300 hover:bg-orange-50",
    },
    {
      name: "MercadoLibre",
      url: `https://listado.mercadolibre.cl/${mlSearch.replace(/%20/g, "-")}`,
      color: "text-yellow-700 border-yellow-300 hover:bg-yellow-50",
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/marketplace/search/?query=${mlSearch}`,
      color: "text-blue-600 border-blue-300 hover:bg-blue-50",
    },
  ];

  return (
    <div className="bg-cream-warm rounded-xl border border-cream-dark/30 p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        <span className="text-xs font-semibold text-ink uppercase tracking-wider">Verificación de Valor</span>
      </div>
      
      {variant === "buyer" ? (
        <p className="text-[11px] text-ink-muted mb-3 leading-relaxed">
          <span className="font-bold text-ink">Antes de comparar:</span> Pregunta aquí si tienes dudas sobre el estado, cantidad disponible o negociación del precio. A veces es más rápido hablar directamente.
        </p>
      ) : (
        <p className="text-[11px] text-ink-muted mb-3 leading-relaxed">
          <span className="font-bold text-ink">Sugerencia:</span> Revisa los precios de la competencia para asegurar que tu libro se venda rápido.
        </p>
      )}

      {variant === "buyer" && listingId && (
        <Link
          href={`/messages?listing_id=${listingId}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 mb-3 w-full bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Preguntar al Vendedor
        </Link>
      )}

      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              // Track the click silently without blocking navigation
              fetch("/api/analytics/external-click", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ store: link.name, bookTitle: title, url: link.url }),
              }).catch(() => {});
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-lg transition-colors ${link.color}`}
          >
            {link.name}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
