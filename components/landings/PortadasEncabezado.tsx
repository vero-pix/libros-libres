import Link from "next/link";
import BookCover from "@/components/listings/BookCover";
import { libroUrl } from "@/lib/urls";
import type { ListingWithBook } from "@/types";

/**
 * Portadas en el encabezado de las landings (27-09-2026). Hasta esta fecha el
 * encabezado de las 31 landings era solo texto y los libros aparecían recién en
 * la segunda pantalla; la portada del sitio sí tenía su abanico. Vero lo notó en
 * /libros-usados-baratos: «sin imágenes».
 *
 * Son libros reales de la misma página, con foto. Sin cuatro con foto no se
 * muestra nada: un abanico a medias se ve peor que el texto solo.
 */
const GIROS = ["-rotate-6 translate-y-2", "rotate-3 -translate-y-1", "-rotate-2 translate-y-3", "rotate-6"];

export default function PortadasEncabezado({ listings }: { listings: ListingWithBook[] }) {
  const conFoto = listings.filter((l) => l.book && (l.cover_image_url || l.book.cover_url)).slice(0, 4);
  if (conFoto.length < 4) return null;

  return (
    <div className="flex justify-center lg:justify-end pl-4 animate-fade-in" aria-label="Algunos libros de esta página">
      {conFoto.map((l, i) => (
        <Link
          key={l.id}
          href={libroUrl(l)}
          className={`-ml-4 first:ml-0 w-[74px] sm:w-[104px] lg:w-[128px] shrink-0 transition-transform duration-300 hover:-translate-y-2 hover:rotate-0 hover:z-10 ${GIROS[i]}`}
        >
          <BookCover
            title={l.book.title}
            author={l.book.author}
            coverUrl={l.cover_image_url || l.book.cover_url}
            ratio="book"
            sizes="128px"
            className="rounded-md shadow-[0_14px_28px_-12px_rgba(23,20,16,.55)] ring-1 ring-black/5"
          />
        </Link>
      ))}
    </div>
  );
}
