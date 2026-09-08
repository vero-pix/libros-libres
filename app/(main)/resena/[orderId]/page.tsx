import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReviewForm from "@/components/reviews/ReviewForm";
import { libroUrl } from "@/lib/urls";

export const metadata = {
  title: "Dejar una reseña",
  robots: { index: false, follow: false },
};

/**
 * /resena/[orderId] — destino del correo "¿Cómo llegó {título}?".
 *
 * La meta son dos clics desde el correo: abrir y puntuar. Por eso la orden se
 * resuelve acá, en el servidor, en una sola consulta, y el formulario se pinta
 * ya listo. Antes el correo llevaba a la ficha con el ancla #resena-vendedor y
 * el componente hacía tres viajes (sesión, reseñas, ¿compró?) antes de mostrar
 * nada; si no había sesión, no ofrecía salida.
 *
 * Quién puede: solo el comprador de esa orden, y solo si está `delivered`. Es
 * lo mismo que exige la policy de `reviews`, comprobado antes para poder
 * explicar el motivo en vez de mostrar un error de permisos.
 */

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-2xl border border-cream-dark/40 bg-white p-6 shadow-sm sm:p-8">{children}</div>
    </div>
  );
}

export default async function ResenaPage({ params }: { params: { orderId: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión no se muestra nada del pedido: se manda a entrar y se vuelve acá.
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/resena/${params.orderId}`)}`);
  }

  const { data: orden } = await supabase
    .from("orders")
    .select(
      "id, status, buyer_id, listing_id, seller_id, listing:listings(id, slug, cover_image_url, seller:users(full_name, username), book:books(title, author, cover_url))"
    )
    .eq("id", params.orderId)
    .maybeSingle();

  // Una orden ajena y una inexistente dan el mismo mensaje: no se confirma que
  // el pedido exista a alguien que no es su comprador.
  if (!orden || orden.buyer_id !== user.id) {
    return (
      <Marco>
        <h1 className="font-display text-xl font-bold text-ink">No encontramos ese pedido</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Puede que el enlace esté incompleto o que ese pedido sea de otra cuenta. Revisa que hayas entrado
          con la cuenta donde hiciste la compra.
        </p>
        <Link href="/mis-pedidos" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Ver mis pedidos →
        </Link>
      </Marco>
    );
  }

  const listing: any = Array.isArray(orden.listing) ? orden.listing[0] : orden.listing;
  const seller: any = Array.isArray(listing?.seller) ? listing.seller[0] : listing?.seller;
  const book: any = Array.isArray(listing?.book) ? listing.book[0] : listing?.book;
  const vendedorNombre = seller?.full_name ?? "el vendedor";
  const portada = listing?.cover_image_url ?? book?.cover_url ?? null;

  if (orden.status !== "delivered") {
    return (
      <Marco>
        <h1 className="font-display text-xl font-bold text-ink">Todavía no puedes reseñar este pedido</h1>
        <p className="mt-2 text-sm text-ink-muted">
          La reseña se abre cuando confirmas que recibiste el libro. Puedes hacerlo desde Mis Pedidos con el
          botón <strong className="text-ink">Lo recibí</strong>, y después vuelves acá.
        </p>
        <Link href="/mis-pedidos" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Ir a Mis Pedidos →
        </Link>
      </Marco>
    );
  }

  // Si ya reseñó, se le muestra su reseña en vez del formulario vacío.
  const { data: yaHecha } = await supabase
    .from("reviews")
    .select("id, rating, comment")
    .eq("order_id", orden.id)
    .maybeSingle();

  return (
    <Marco>
      <div className="mb-6 flex items-center gap-4">
        {portada && (
          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md border border-cream-dark/40">
            <Image src={portada} alt="" fill className="object-cover" sizes="64px" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold leading-snug text-ink">{book?.title ?? "Tu libro"}</h1>
          {book?.author && <p className="text-sm text-ink-muted">{book.author}</p>}
          <p className="mt-1 text-xs text-ink-muted">Comprado a {vendedorNombre}</p>
        </div>
      </div>

      {yaHecha ? (
        <div className="rounded-xl border border-cream-dark/40 bg-cream-warm/40 p-5">
          <p className="font-semibold text-ink">Ya dejaste tu reseña</p>
          <p className="mt-1 text-amber-500">
            {"★".repeat(yaHecha.rating)}
            <span className="text-gray-300">{"★".repeat(5 - yaHecha.rating)}</span>
          </p>
          {yaHecha.comment && <p className="mt-2 text-sm text-ink-muted">{yaHecha.comment}</p>}
          <Link
            href={`/vendedor/${seller?.username ?? orden.seller_id}`}
            className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
          >
            Ver la tienda de {vendedorNombre} →
          </Link>
        </div>
      ) : (
        <ReviewForm listingId={orden.listing_id} vendedorNombre={vendedorNombre} />
      )}

      {listing && (
        <p className="mt-6 border-t border-cream-dark/40 pt-4 text-xs text-ink-muted">
          ¿Quieres además dejar unas líneas sobre el libro?{" "}
          <Link
            href={`${libroUrl({ id: listing.id, slug: listing.slug, seller: { username: seller?.username } })}#resenas-libro`}
            className="font-semibold text-brand-600 hover:underline"
          >
            Reseñar el libro
          </Link>
        </p>
      )}
    </Marco>
  );
}
