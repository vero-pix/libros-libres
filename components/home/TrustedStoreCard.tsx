import Link from "next/link";
import Image from "next/image";

/**
 * Tarjeta de "Librerías de confianza". Tres variantes, una sola pieza:
 *
 *   estandar → las 8 que rotan por trust_score
 *   casa     → "Selección de la casa · por Vero", fija, rotulada (decisión C4.1)
 *   semana   → "Tienda de la semana", doble ancho, sale de la rotación (C4.2)
 *
 * La línea de prueba es siempre la venta, nunca el tamaño del catálogo: "N
 * libros" era el dato principal de la tarjeta vieja y no dice nada sobre si el
 * vendedor despacha. El promedio de reseñas se suma solo con 3 o más (C5).
 */

export interface TiendaConfianza {
  seller_id: string;
  username: string | null;
  full_name: string;
  city: string | null;
  avatar_url: string | null;
  ventas: number;
  reviews_count: number;
  reviews_avg: number | null;
  portadas: { id: string; url: string | null; titulo: string }[];
  frase?: string | null;
}

/** Umbral bajo el cual no se muestra promedio de reseñas (decisión C5). */
const MIN_RESENAS_PARA_PROMEDIO = 3;

export function lineaDePrueba(t: TiendaConfianza): string {
  const ventas = `${t.ventas} ${t.ventas === 1 ? "venta" : "ventas"} por la plataforma`;
  if (t.reviews_count >= MIN_RESENAS_PARA_PROMEDIO && t.reviews_avg != null) {
    const prom = t.reviews_avg.toFixed(1).replace(".", ",");
    return `${ventas} · ${prom} (${t.reviews_count} ${t.reviews_count === 1 ? "reseña" : "reseñas"})`;
  }
  return ventas;
}

function Portadas({ portadas, alto }: { portadas: TiendaConfianza["portadas"]; alto: number }) {
  if (portadas.length === 0) return null;
  const ancho = Math.round(alto * 0.66);
  return (
    <div className="flex shrink-0" aria-hidden="true">
      {portadas.map((p, i) => (
        <div
          key={p.id}
          className="relative overflow-hidden rounded-md border border-cream-dark/40 bg-cream-warm shadow-sm"
          style={{ width: ancho, height: alto, marginLeft: i === 0 ? 0 : -8, zIndex: portadas.length - i }}
        >
          {p.url ? (
            <Image src={p.url} alt="" fill className="object-cover" sizes={`${ancho}px`} />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[9px] leading-tight text-ink-muted px-1 text-center">
              {p.titulo.slice(0, 18)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TrustedStoreCard({
  tienda,
  variante = "estandar",
}: {
  tienda: TiendaConfianza;
  variante?: "estandar" | "casa" | "semana";
}) {
  const href = `/vendedor/${tienda.username ?? tienda.seller_id}`;
  const destacada = variante !== "estandar";

  const marco =
    variante === "casa"
      ? "bg-cream-warm border-amber-300"
      : variante === "semana"
      ? "bg-white border-brand-300"
      : "bg-white border-cream-dark/30";

  return (
    <Link
      href={href}
      className={`group flex flex-col gap-3 rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${marco} ${
        destacada ? "sm:col-span-2" : ""
      }`}
    >
      {destacada && (
        <span
          className={`font-mono text-[10px] uppercase tracking-wider ${
            variante === "casa" ? "text-amber-700" : "text-brand-600"
          }`}
        >
          {variante === "casa" ? "Selección de la casa · por Vero" : "Tienda de la semana"}
        </span>
      )}

      <div className="flex items-center gap-3">
        <Portadas portadas={tienda.portadas} alto={destacada ? 72 : 60} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink transition-colors group-hover:text-brand-600">
            {tienda.full_name}
          </p>
          {tienda.city && <p className="truncate text-xs text-ink-muted">{tienda.city}</p>}
          <p className="mt-1 text-xs text-ink-muted">{lineaDePrueba(tienda)}</p>
        </div>
      </div>

      {destacada && tienda.frase ? (
        <p className="text-sm italic leading-snug text-ink-muted">&ldquo;{tienda.frase}&rdquo;</p>
      ) : null}
    </Link>
  );
}
