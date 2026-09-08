import Link from "next/link";
import TrustedStoreCard, { type TiendaConfianza } from "./TrustedStoreCard";

/**
 * Sección "Librerías de confianza" del home.
 *
 * Reemplaza al bloque que elegía por el flag `users.featured`, que no tenía
 * ORDER BY, dejaba 5 de 15 marcados siempre fuera y excluía justo a los que
 * venden. Ahora sale de `seller_stats.is_trusted`, que se refresca cada hora.
 *
 * Dos slots aparte de la rotación (decisión C4): la selección de la casa, fija
 * y rotulada, y la tienda de la semana. Ninguno de los dos ocupa un cupo de las
 * 8 rotativas.
 */
export default function TrustedStoresSection({
  casa,
  semana,
  tiendas,
}: {
  casa: TiendaConfianza | null;
  semana: TiendaConfianza | null;
  tiendas: TiendaConfianza[];
}) {
  if (!casa && !semana && tiendas.length === 0) return null;

  return (
    <section>
      <div className="mb-1 flex items-center gap-2">
        <h2 className="font-display text-base font-semibold text-ink">Librerías de confianza</h2>
      </div>
      <p className="mb-4 text-xs text-ink-muted">
        Venden por la plataforma, despachan y cobran con pago protegido.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {semana && <TrustedStoreCard tienda={semana} variante="semana" />}
        {casa && <TrustedStoreCard tienda={casa} variante="casa" />}
        {tiendas.map((t) => (
          <TrustedStoreCard key={t.seller_id} tienda={t} />
        ))}
      </div>

      <div className="mt-4 text-right">
        <Link href="/tiendas" className="text-xs font-semibold text-brand-600 hover:underline">
          Ver todas las tiendas →
        </Link>
      </div>
    </section>
  );
}
