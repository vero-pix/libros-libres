"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { OrderWithDetails } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

interface OrderGroup {
  key: string;
  bundleId: string | null;
  orders: OrderWithDetails[];
  total: number;
  firstOrder: OrderWithDetails;
}

function groupByBundle(orders: OrderWithDetails[]): OrderGroup[] {
  const byBundle = new Map<string, OrderWithDetails[]>();
  const singles: OrderWithDetails[] = [];
  for (const o of orders) {
    const bid = (o as any).bundle_id as string | null;
    if (bid) {
      if (!byBundle.has(bid)) byBundle.set(bid, []);
      byBundle.get(bid)!.push(o);
    } else {
      singles.push(o);
    }
  }
  const groups: OrderGroup[] = [];
  byBundle.forEach((ordersInBundle, bid) => {
    const sorted = ordersInBundle.slice().sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );
    groups.push({
      key: bid,
      bundleId: bid,
      orders: sorted,
      total: sorted.reduce((sum, o) => sum + Number(o.total ?? 0), 0),
      firstOrder: sorted[0],
    });
  });
  for (const o of singles) {
    groups.push({
      key: o.id,
      bundleId: null,
      orders: [o],
      total: Number(o.total ?? 0),
      firstOrder: o,
    });
  }
  // Ordenar por fecha de la primera order, descendente
  groups.sort((a, b) =>
    b.firstOrder.created_at.localeCompare(a.firstOrder.created_at)
  );
  return groups;
}

function BundleCard({ group }: { group: OrderGroup }) {
  const firstBook = group.orders[0].listing?.book;
  const date = new Date(group.firstOrder.created_at).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const status = group.firstOrder.status;
  const count = group.orders.length;
  const otherBooks = group.orders.slice(1);

  return (
    <Link
      href={`/orders/${group.firstOrder.id}`}
      className="block border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        {firstBook?.cover_url && (
          <img
            src={firstBook.cover_url}
            alt={firstBook.title}
            className="w-16 h-20 object-cover rounded shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-navy truncate">
              {count === 1
                ? firstBook?.title ?? "Libro"
                : `${firstBook?.title ?? "Libro"} y ${count - 1} más`}
            </h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          {count === 1 ? (
            <p className="text-sm text-gray-500">{firstBook?.author}</p>
          ) : (
            <p className="text-xs text-gray-500 truncate">
              {otherBooks
                .map((o) => o.listing?.book?.title ?? "")
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <p className="text-sm font-semibold text-brand-500 mt-1">
            ${group.total.toLocaleString("es-CL")}
            {count > 1 && (
              <span className="text-xs text-ink-muted font-normal ml-1">
                · {count} libros
              </span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>{date}</span>
            {group.firstOrder.courier && (
              <span>Courier: {group.firstOrder.courier}</span>
            )}
            {group.firstOrder.tracking_code && (
              <span>Tracking: {group.firstOrder.tracking_code}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p>{message}</p>
    </div>
  );
}

export default function OrderTabs({
  purchases,
  sales,
}: {
  purchases: OrderWithDetails[];
  sales: OrderWithDetails[];
}) {
  const [tab, setTab] = useState<"purchases" | "sales">("purchases");

  const purchaseGroups = useMemo(() => groupByBundle(purchases), [purchases]);
  const saleGroups = useMemo(() => groupByBundle(sales), [sales]);

  const tabs = [
    { key: "purchases" as const, label: "Mis Compras", count: purchaseGroups.length },
    { key: "sales" as const, label: "Mis Ventas", count: saleGroups.length },
  ];

  const groups = tab === "purchases" ? purchaseGroups : saleGroups;

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-b-2 border-brand-500 text-brand-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {groups.length === 0 ? (
          <EmptyState
            message={
              tab === "purchases" ? "Aun no tienes compras" : "Aun no tienes ventas"
            }
          />
        ) : (
          groups.map((g) => <BundleCard key={g.key} group={g} />)
        )}
      </div>
    </div>
  );
}
