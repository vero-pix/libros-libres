import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Order, OrderStatus } from "@/types";
import BuyerCartsSection from "@/components/sales/BuyerCartsSection";

export const metadata = {
  title: "Mis Ventas — tuslibros.cl",
  description: "Dashboard de ventas y comisiones",
};

const STATUS_LABELS: Record<OrderStatus, { label: string; class: string }> = {
  pending: { label: "Pendiente", class: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  paid: { label: "Pagado", class: "bg-green-50 text-green-700 border-green-200" },
  shipped: { label: "Enviado", class: "bg-blue-50 text-blue-700 border-blue-200" },
  delivered: { label: "Entregado", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelado", class: "bg-red-50 text-red-700 border-red-200" },
};

const PLAN_LABELS: Record<string, string> = {
  free: "Libre (8%)",
  librero: "Librero (5%)",
  libreria: "Librería (3%)",
};

export default async function MisVentasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/mis-ventas");

  // Profile with plan
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, plan, mercadopago_user_id")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "free";
  const mpConnected = !!profile?.mercadopago_user_id;

  // Orders where I'm the seller
  const { data: rawOrders } = await supabase
    .from("orders")
    .select(`
      id, buyer_id, book_price, shipping_cost, service_fee, total, status,
      courier, tracking_code, shipping_label_url, shipping_status, buyer_address, created_at,
      listing:listings(id, book:books(title, author, cover_url)),
      buyer:users!orders_buyer_id_fkey(full_name, email)
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const orders = rawOrders ?? [];

  // Rentals where I'm the owner
  const { data: rawRentals } = await supabase
    .from("rentals")
    .select(`
      id, rental_price, deposit, commission, total, status,
      period_days, start_date, end_date, created_at,
      listing:listings(id, book:books(title, author, cover_url)),
      renter:users!rentals_renter_id_fkey(full_name, email)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const rentals = rawRentals ?? [];

  // Commissions
  const { data: rawCommissions } = await supabase
    .from("commissions")
    .select("transaction_type, gross_amount, commission_rate, commission_amount, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const commissions = rawCommissions ?? [];

  // Carritos de compradores con libros míos (listings activos del vendedor
  // actual que están en el cart_items de otros usuarios)
  const { data: mySellerListings } = await supabase
    .from("listings")
    .select("id")
    .eq("seller_id", user.id)
    .eq("status", "active");

  const myListingIds = (mySellerListings ?? []).map((l) => l.id);

  let buyerCarts: Array<{
    buyerId: string;
    buyerName: string;
    buyerEmail: string | null;
    buyerPhone: string | null;
    items: Array<{
      listing_id: string;
      title: string;
      author: string;
      price: number;
      cover_url: string | null;
      added_at: string;
    }>;
    total: number;
    firstAddedAt: string;
    daysInCart: number;
  }> = [];

  if (myListingIds.length > 0) {
    const { data: cartRows } = await supabase
      .from("cart_items")
      .select(
        `
        user_id, listing_id, added_at,
        listing:listings(id, price,
          book:books(title, author, cover_url)),
        buyer:users(id, full_name, email, phone)
      `
      )
      .in("listing_id", myListingIds)
      .neq("user_id", user.id)
      .order("added_at", { ascending: true });

    const byBuyer = new Map<
      string,
      {
        buyerId: string;
        buyerName: string;
        buyerEmail: string | null;
        buyerPhone: string | null;
        items: Array<{
          listing_id: string;
          title: string;
          author: string;
          price: number;
          cover_url: string | null;
          added_at: string;
        }>;
        total: number;
        firstAddedAt: string;
      }
    >();

    for (const row of cartRows ?? []) {
      const buyer = (row as any).buyer;
      const listing = (row as any).listing;
      if (!buyer || !listing) continue;
      if (!byBuyer.has(buyer.id)) {
        byBuyer.set(buyer.id, {
          buyerId: buyer.id,
          buyerName: buyer.full_name ?? "Comprador",
          buyerEmail: buyer.email ?? null,
          buyerPhone: buyer.phone ?? null,
          items: [],
          total: 0,
          firstAddedAt: row.added_at,
        });
      }
      const entry = byBuyer.get(buyer.id)!;
      entry.items.push({
        listing_id: listing.id,
        title: listing.book?.title ?? "Libro",
        author: listing.book?.author ?? "",
        price: Number(listing.price ?? 0),
        cover_url: listing.book?.cover_url ?? null,
        added_at: row.added_at,
      });
      entry.total += Number(listing.price ?? 0);
      if (row.added_at < entry.firstAddedAt) entry.firstAddedAt = row.added_at;
    }

    buyerCarts = Array.from(byBuyer.values()).map((c) => ({
      ...c,
      daysInCart: Math.floor(
        (Date.now() - new Date(c.firstAddedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));

    // Ordenar: los más antiguos primero (más urgentes)
    buyerCarts.sort((a, b) => b.daysInCart - a.daysInCart);
  }

  // Stats
  const paidOrders = orders.filter((o: any) => o.status !== "pending" && o.status !== "cancelled");
  const totalVentas = paidOrders.reduce((sum: number, o: any) => sum + Number(o.book_price), 0);
  const totalComisiones = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const gananciaVentas = totalVentas - commissions.filter(c => c.transaction_type === "sale").reduce((sum, c) => sum + Number(c.commission_amount), 0);

  const paidRentals = rentals.filter((r: any) => r.status !== "pending");
  const totalArriendos = paidRentals.reduce((sum: number, r: any) => sum + Number(r.rental_price), 0);
  const gananciaArriendos = totalArriendos - commissions.filter(c => c.transaction_type === "rental").reduce((sum, c) => sum + Number(c.commission_amount), 0);

  const gananciaTotal = gananciaVentas + gananciaArriendos;

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Mis Ventas
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Dashboard de ventas, arriendos y comisiones
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-ink-muted">Plan</span>
            <p className="text-sm font-semibold text-brand-600">{PLAN_LABELS[plan]}</p>
            <p className="text-[11px] text-ink-muted mt-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full inline-block">
              Comisión solo con MercadoPago · WhatsApp es gratis
            </p>
          </div>
        </div>

        {/* MP Connection warning */}
        {!mpConnected && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>MercadoPago no conectado.</strong> Conecta tu cuenta desde{" "}
            <a href="/perfil" className="underline font-medium">tu perfil</a>{" "}
            para recibir pagos directos con split payment.
          </div>
        )}

        <BuyerCartsSection carts={buyerCarts} />

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Ventas completadas" value={paidOrders.length.toString()} />
          <StatCard label="Arriendos activos" value={paidRentals.length.toString()} />
          <StatCard
            label="Ganancia neta"
            value={`$${gananciaTotal.toLocaleString("es-CL")}`}
            accent
          />
          <StatCard
            label="Comisiones pagadas"
            value={`$${totalComisiones.toLocaleString("es-CL")}`}
            muted
          />
        </div>

        {/* Detailed breakdown */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="bg-white rounded-xl border border-cream-dark/30 p-5">
            <h3 className="text-sm font-semibold text-ink mb-3">Ventas</h3>
            <div className="space-y-2 text-sm">
              <Row label="Ingresos brutos" value={`$${totalVentas.toLocaleString("es-CL")}`} />
              <Row label="Comisiones" value={`-$${commissions.filter(c => c.transaction_type === "sale").reduce((s, c) => s + Number(c.commission_amount), 0).toLocaleString("es-CL")}`} muted />
              <div className="border-t border-cream-dark/20 pt-2">
                <Row label="Ganancia neta ventas" value={`$${gananciaVentas.toLocaleString("es-CL")}`} bold />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-cream-dark/30 p-5">
            <h3 className="text-sm font-semibold text-ink mb-3">Arriendos</h3>
            <div className="space-y-2 text-sm">
              <Row label="Ingresos brutos" value={`$${totalArriendos.toLocaleString("es-CL")}`} />
              <Row label="Comisiones" value={`-$${commissions.filter(c => c.transaction_type === "rental").reduce((s, c) => s + Number(c.commission_amount), 0).toLocaleString("es-CL")}`} muted />
              <div className="border-t border-cream-dark/20 pt-2">
                <Row label="Ganancia neta arriendos" value={`$${gananciaArriendos.toLocaleString("es-CL")}`} bold />
              </div>
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-bold text-ink mb-4">
            Órdenes de venta ({orders.length})
          </h2>
          {orders.length > 0 ? (
            <div className="bg-white rounded-xl border border-cream-dark/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-dark/20 text-left text-xs text-ink-muted uppercase tracking-wider">
                      <th className="px-4 py-3">Libro</th>
                      <th className="px-4 py-3">Comprador</th>
                      <th className="px-4 py-3">Precio</th>
                      <th className="px-4 py-3">Envío</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-dark/10">
                    {orders.map((order: any) => {
                      const isInPerson = order.courier === "Entrega en persona" || order.courier === "Punto de retiro" || !order.courier;
                      const isPaid = order.status === "paid" || order.status === "shipped" || order.status === "delivered";
                      const ageHours = (Date.now() - new Date(order.created_at).getTime()) / 36e5;
                      const labelStuck = isPaid && !isInPerson && !order.shipping_label_url && ageHours > 1;
                      const supportMailto = labelStuck
                        ? `mailto:soporte@shipit.cl?subject=${encodeURIComponent(
                            `Ayuda con envío — orden ${order.id.slice(0, 8)}`
                          )}&body=${encodeURIComponent(
                            `Hola equipo de Shipit,\n\nMi envío no logra emitir la etiqueta. Necesito que me ayuden a regenerarla.\n\nDetalles:\n- Referencia: TL-${order.id.slice(0, 12)}\n- Courier: ${order.courier ?? "Starken"}\n- Comprador: ${order.buyer?.full_name ?? ""}\n- Dirección: ${order.buyer_address ?? ""}\n- Fecha pedido: ${new Date(order.created_at).toLocaleString("es-CL")}\n\nGracias.`
                          )}`
                        : null;
                      return (
                      <tr key={order.id} className="hover:bg-cream-warm/30 align-top">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {order.listing?.book?.cover_url && (
                              <img
                                src={order.listing.book.cover_url}
                                alt=""
                                className="w-8 h-11 object-cover rounded-sm"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-ink truncate">
                                {order.listing?.book?.title ?? "—"}
                              </p>
                              <p className="text-xs text-ink-muted truncate">
                                {order.listing?.book?.author ?? ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">
                          <div className="min-w-0">
                            <p className="truncate">{order.buyer?.full_name ?? "—"}</p>
                            {!isInPerson && order.buyer_address && (
                              <p className="text-xs text-ink-muted/70 truncate mt-0.5" title={order.buyer_address}>
                                {order.buyer_address}
                              </p>
                            )}
                            <Link
                              href={`/mensajes?to=${order.buyer_id}`}
                              className="inline-flex items-center gap-1 mt-1 text-[11px] text-brand-600 hover:underline font-medium"
                            >
                              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                              </svg>
                              Escribir
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          ${Number(order.book_price).toLocaleString("es-CL")}
                        </td>
                        <td className="px-4 py-3">
                          {isInPerson ? (
                            <span className="text-xs text-ink-muted">🤝 En persona</span>
                          ) : isPaid ? (
                            <div className="space-y-1.5 min-w-[180px]">
                              <div className="text-xs font-medium text-ink">
                                📦 {order.courier ?? "Courier"}
                              </div>
                              {order.tracking_code && (
                                <div className="text-[11px] font-mono text-ink-muted">
                                  {order.tracking_code}
                                </div>
                              )}
                              {order.shipping_label_url ? (
                                <a
                                  href={order.shipping_label_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-block text-[11px] bg-ink text-cream px-2 py-1 rounded-md hover:bg-ink/90"
                                >
                                  📄 Descargar etiqueta
                                </a>
                              ) : labelStuck ? (
                                <div className="space-y-1">
                                  <span className="text-[11px] text-red-700 block">Etiqueta demorada · pide ayuda</span>
                                  <a
                                    href={supportMailto!}
                                    className="inline-block text-[11px] bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700"
                                  >
                                    ✉️ Escribir a Shipit
                                  </a>
                                </div>
                              ) : (
                                <span className="text-[11px] text-amber-700">Etiqueta en preparación…</span>
                              )}
                              <div className="pt-0.5">
                                <a href="/como-despachar" className="text-[11px] text-brand-600 hover:underline">
                                  ¿Cómo despacho?
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-ink-muted">
                              📦 {order.courier ?? "Courier"} — pendiente de pago
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_LABELS[order.status as OrderStatus]?.class ?? ""}`}>
                            {STATUS_LABELS[order.status as OrderStatus]?.label ?? order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-muted text-xs">
                          {new Date(order.created_at).toLocaleDateString("es-CL")}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState text="Aún no tienes ventas" />
          )}
        </section>

        {/* Rentals */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-bold text-ink mb-4">
            Arriendos ({rentals.length})
          </h2>
          {rentals.length > 0 ? (
            <div className="bg-white rounded-xl border border-cream-dark/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-dark/20 text-left text-xs text-ink-muted uppercase tracking-wider">
                      <th className="px-4 py-3">Libro</th>
                      <th className="px-4 py-3">Arrendatario</th>
                      <th className="px-4 py-3">Precio</th>
                      <th className="px-4 py-3">Período</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-dark/10">
                    {rentals.map((rental: any) => (
                      <tr key={rental.id} className="hover:bg-cream-warm/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {rental.listing?.book?.cover_url && (
                              <img
                                src={rental.listing.book.cover_url}
                                alt=""
                                className="w-8 h-11 object-cover rounded-sm"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-ink truncate">
                                {rental.listing?.book?.title ?? "—"}
                              </p>
                              <p className="text-xs text-ink-muted truncate">
                                {rental.listing?.book?.author ?? ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">
                          {rental.renter?.full_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          ${Number(rental.rental_price).toLocaleString("es-CL")}
                        </td>
                        <td className="px-4 py-3 text-ink-muted">
                          {rental.period_days} días
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-brand-50 text-brand-600 border-brand-200">
                            {rental.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-muted text-xs">
                          {new Date(rental.created_at).toLocaleDateString("es-CL")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState text="Aún no tienes arriendos" />
          )}
        </section>

        {/* Commissions log */}
        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-4">
            Historial de comisiones ({commissions.length})
          </h2>
          {commissions.length > 0 ? (
            <div className="bg-white rounded-xl border border-cream-dark/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-dark/20 text-left text-xs text-ink-muted uppercase tracking-wider">
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Monto bruto</th>
                      <th className="px-4 py-3">Tasa</th>
                      <th className="px-4 py-3">Comisión</th>
                      <th className="px-4 py-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-dark/10">
                    {commissions.map((c, i) => (
                      <tr key={i} className="hover:bg-cream-warm/30">
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            c.transaction_type === "sale"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          }`}>
                            {c.transaction_type === "sale" ? "Venta" : "Arriendo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          ${Number(c.gross_amount).toLocaleString("es-CL")}
                        </td>
                        <td className="px-4 py-3 text-ink-muted">
                          {(Number(c.commission_rate) * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-3 font-medium text-red-600">
                          -${Number(c.commission_amount).toLocaleString("es-CL")}
                        </td>
                        <td className="px-4 py-3 text-ink-muted text-xs">
                          {new Date(c.created_at).toLocaleDateString("es-CL")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState text="Sin comisiones registradas" />
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-cream-dark/30 p-4">
      <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-brand-600" : muted ? "text-ink-muted" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold text-ink" : "text-ink-muted"}>{label}</span>
      <span className={`${bold ? "font-bold text-ink" : ""} ${muted ? "text-ink-muted" : ""}`}>{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl border border-cream-dark/30 p-10 text-center text-ink-muted text-sm">
      {text}
    </div>
  );
}
