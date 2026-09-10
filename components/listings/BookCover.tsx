"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * La portada del libro, en un solo lugar.
 *
 * La tarjeta de la grilla dibujaba una cubierta con identidad cuando el libro
 * no tiene foto — diez degradados estables por titulo, con el sello y el
 * apellido del autor. Las otras ocho grillas del sitio no la tenian: mostraban
 * el titulo en texto plano sobre crema, o nada. El mismo libro sin foto se veia
 * bien en un lugar y pobre en los otros ocho.
 *
 * Esto NO unifica los layouts: la grilla y los carruseles de la portada son
 * piezas distintas a proposito (una lleva insignia, carrito y vista rapida; los
 * otros son miniaturas). Unifica lo que si compartian y habia divergido: la
 * proporcion, el respaldo sin foto y el texto alternativo. (10-09-2026)
 */

/* Paletas de cubierta para el objeto-libro SIN foto. */
export const COVER_GRADIENTS: Record<string, string> = {
  ink: "linear-gradient(160deg,#23489f,#16307a)",
  coral: "linear-gradient(160deg,#df5239,#a8331f)",
  gold: "linear-gradient(160deg,#e0990c,#9e6a00)",
  green: "linear-gradient(160deg,#33684f,#1b3d2e)",
  ox: "linear-gradient(160deg,#8a3131,#5e1d1d)",
  night: "linear-gradient(160deg,#1c2333,#0c1018)",
  cream: "linear-gradient(160deg,#f3ead7,#ddcfb2)",
  teal: "linear-gradient(160deg,#1f5f63,#0f3a3d)",
  sand: "linear-gradient(160deg,#cda86a,#9c7a3e)",
  plum: "linear-gradient(160deg,#5b3a72,#3a2350)",
};
const COVER_KEYS = Object.keys(COVER_GRADIENTS);
export const LIGHT_COVERS = new Set(["cream", "sand", "gold"]);

/** Variante estable por titulo → el mismo libro tiene siempre el mismo color. */
export function coverVariant(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COVER_KEYS[h % COVER_KEYS.length];
}

/**
 * `book` es la proporcion real de un libro y la que usa la ficha; `portrait` es
 * el 3/4 que quedo en los carruseles. Conviven mientras dure la unificacion:
 * la decision de dejar una sola es de la fase de direccion visual, y cuando se
 * tome se cambia aca y no en nueve archivos.
 */
type Ratio = "book" | "portrait";

const RATIOS: Record<Ratio, string> = {
  book: "aspect-[148/225]",
  portrait: "aspect-[3/4]",
};

interface Props {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  /** Proporcion del recuadro. Omitir para `book` salvo que el layout ya use otra. */
  ratio?: Ratio;
  /** `sizes` de next/image: hay que darlo, si no la imagen se baja al ancho de pantalla. */
  sizes: string;
  /** Clases del recuadro: borde, radio, sombra. El layout las pone, no el componente. */
  className?: string;
  /** Clases de la imagen: encuadre y relleno. Por defecto llena el recuadro. */
  imageClassName?: string;
  /** Miniatura borrosa mientras carga. */
  blurDataURL?: string;
  priority?: boolean;
}

export default function BookCover({
  title,
  author,
  coverUrl,
  ratio = "book",
  sizes,
  className = "",
  imageClassName = "object-cover",
  blurDataURL,
  priority = false,
}: Props) {
  const [imgError, setImgError] = useState(false);
  const variant = coverVariant(title || "libro");
  const light = LIGHT_COVERS.has(variant);

  return (
    <div className={`relative overflow-hidden ${RATIOS[ratio]} ${className}`}>
      {coverUrl && !imgError ? (
        <Image
          src={coverUrl}
          /* Con autor y "libro usado": es el texto que Google Imagenes usa para
             entender la portada, y la gente busca ediciones por imagen. */
          alt={author ? `${title} — ${author}, libro usado` : `${title}, libro usado`}
          fill
          className={imageClassName}
          sizes={sizes}
          priority={priority}
          {...(blurDataURL ? { placeholder: "blur" as const, blurDataURL } : {})}
          onError={() => setImgError(true)}
          onLoad={(e) => {
            /* Hay portadas que responden 200 con una imagen de 1px. Sin esto
               la tarjeta muestra un rectangulo vacio en vez de la cubierta. */
            const img = e.currentTarget as HTMLImageElement;
            if (img.naturalWidth < 10 || img.naturalHeight < 10) setImgError(true);
          }}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col justify-between p-3"
          style={{ background: COVER_GRADIENTS[variant] }}
        >
          <span
            className={`font-mono text-[8px] uppercase tracking-[0.16em] font-semibold ${
              light ? "text-black/55" : "text-white/70"
            }`}
          >
            tuslibros
          </span>
          <div>
            <span
              className={`block w-7 h-px mb-2 ${light ? "bg-black/40" : "bg-white/55"}`}
            />
            <h4
              className={`font-display text-[13px] leading-[1.08] font-medium ${
                light ? "text-ink italic" : "text-white"
              }`}
            >
              {title}
            </h4>
            {author && (
              <div
                className={`font-mono text-[8px] uppercase tracking-wider mt-1.5 ${
                  light ? "text-ink/60" : "text-white/75"
                }`}
              >
                {author.split(" ").slice(-1)[0]}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
