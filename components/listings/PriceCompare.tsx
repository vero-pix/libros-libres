"use client";

interface Props {
  title: string;
  author?: string | null;
  isbn?: string | null;
  currentPrice?: number | null;
  variant?: "seller" | "buyer";
}

export default function PriceCompare({ title, author, isbn, currentPrice, variant = "seller" }: Props) {
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
      name: "IberLibro",
      url: `https://www.iberlibro.com/servlet/SearchResults?kn=${encodedTitle}&sortby=17`,
      color: "text-red-600 border-red-300 hover:bg-red-50",
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
        <span className="text-xs font-semibold text-ink uppercase tracking-wider">Comparar precios</span>
      </div>
      {currentPrice && (
        <p className="text-xs text-ink-muted mb-3">
          {variant === "buyer" ? "Precio acá: " : "Tu precio: "}
          <span className="font-bold text-ink">${currentPrice.toLocaleString("es-CL")}</span>
          {" · "}
          {variant === "buyer"
            ? "revisa cuánto cobran en otros sitios"
            : "Revisa cuánto cobran en otros sitios antes de vender"}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-colors ${link.color}`}
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
