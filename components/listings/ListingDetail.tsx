import Image from "next/image";
import type { ListingWithBook } from "@/types";

function WhatsAppButton({ phone, title }: { phone: string | null; title: string }) {
  if (!phone) {
    return (
      <p className="text-center text-sm text-gray-400 py-1">
        El vendedor no ha registrado un número de contacto.
      </p>
    );
  }

  // Solo dígitos para la URL de wa.me
  const cleanPhone = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola, vi tu libro "${title}" en tuslibros.cl y me interesa. ¿Está disponible?`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      Contactar por WhatsApp
    </a>
  );
}

const MODALITY_LABELS = {
  sale: "Venta",
  loan: "Préstamo",
  both: "Venta y préstamo",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Como nuevo",
  good: "Buen estado",
  fair: "Estado regular",
  poor: "Con detalles",
};

interface Props {
  listing: ListingWithBook;
}

export default function ListingDetail({ listing }: Props) {
  const { book } = listing;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-6 p-6">
        {/* Cover */}
        <div className="flex-shrink-0 flex justify-center">
          {(listing.cover_image_url ?? book.cover_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(listing.cover_image_url ?? book.cover_url)!}
              alt={book.title}
              width={120}
              height={170}
              className="rounded-lg shadow object-cover"
            />
          ) : (
            <div className="w-32 h-44 bg-gray-100 rounded-lg flex items-center justify-center text-5xl">
              📚
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
          <p className="text-gray-600 mt-1">{book.author}</p>
          {book.genre && (
            <p className="text-sm text-gray-400 mt-0.5">{book.genre}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </span>
            <span className="text-sm px-3 py-1 rounded-full bg-brand-100 text-brand-700">
              {MODALITY_LABELS[listing.modality]}
            </span>
          </div>

          {listing.price != null && listing.modality !== "loan" && (
            <p className="text-2xl font-bold text-gray-900 mt-4">
              ${listing.price.toLocaleString("es-CL")}
            </p>
          )}

          {listing.notes && (
            <p className="text-sm text-gray-600 mt-4 bg-gray-50 rounded-xl p-3">
              {listing.notes}
            </p>
          )}

          {listing.address && (
            <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
              <span>📍</span> {listing.address}
            </p>
          )}
        </div>
      </div>

      {/* Book description */}
      {book.description && (
        <div className="border-t border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Sinopsis</h2>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
            {book.description}
          </p>
        </div>
      )}

      {/* Contact CTA */}
      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
        <WhatsAppButton
          phone={listing.seller?.phone ?? null}
          title={book.title}
        />
      </div>
    </div>
  );
}
