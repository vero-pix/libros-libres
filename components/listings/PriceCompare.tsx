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
  const encodedTitle = encodeURIComponent(`${title} ${author || ""}`.trim());
  const isbnClean = isbn?.replace(/[-\s]/g, "").toUpperCase();

  const links = [
    {
      name: "Buscalibre",
      url: isbnClean 
        ? `https://www.buscalibre.cl/libros/search?q=${isbnClean}`
        : `https://www.buscalibre.cl/libros/search?q=${encodedTitle}`,
      color: "text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200",
      description: "Referente en Chile",
    },
    {
      name: "MercadoLibre",
      url: `https://listado.mercadolibre.cl/${encodedTitle.replace(/%20/g, "-")}`,
      color: "text-yellow-800 bg-yellow-50 hover:bg-yellow-100 border-yellow-200",
      description: "Mercado masivo",
    },
    {
      name: "IberLibro",
      url: isbnClean
        ? `https://www.iberlibro.com/servlet/SearchResults?isbn=${isbnClean}`
        : `https://www.iberlibro.com/servlet/SearchResults?kn=${encodedTitle}`,
      color: "text-red-800 bg-red-50 hover:bg-red-100 border-red-200",
      description: "Joyas y ediciones raras",
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/marketplace/search?query=${encodedTitle}`,
      color: "text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-200",
      description: "Grupos locales",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-[11px] font-bold text-ink uppercase tracking-wider">Auditoría de Transparencia</span>
        </div>
        <div className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase">Neutral</div>
      </div>
      
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-4 leading-relaxed italic">
          &quot;Creemos en la transparencia total. No te pedimos que nos creas: te damos los links para que compares este libro con el mercado real.&quot;
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                fetch("/api/analytics/external-click", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ store: link.name, bookTitle: title, url: link.url }),
                }).catch(() => {});
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all hover:translate-x-1 ${link.color}`}
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-tight leading-none">{link.name}</span>
                <span className="text-[9px] opacity-70 font-medium mt-0.5">{link.description}</span>
              </div>
              <svg className="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>

        {variant === "buyer" && listingId && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href={`/mensajes?listing_id=${listingId}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-ink text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-brand-600 transition-all shadow-md active:scale-[0.98]"
            >
              ¿Quieres negociar el precio? Habla con el vendedor
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
