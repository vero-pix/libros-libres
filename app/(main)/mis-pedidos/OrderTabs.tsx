"use client";

import { useState } from "react";
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

function OrderCard({ order }: { order: OrderWithDetails }) {
  const book = order.listing?.book;
  const date = new Date(order.created_at).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="border border-gray-200 rounded-lg p-4 flex gap-4 bg-white">
      {book?.cover_url && (
        <img
          src={book.cover_url}
          alt={book.title}
          className="w-16 h-20 object-cover rounded shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-navy truncate">
            {book?.title ?? "Libro"}
          </h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <p className="text-sm text-gray-500">{book?.author}</p>
        <p className="text-sm font-semibold text-brand-500 mt-1">
          ${order.total.toLocaleString("es-CL")}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>{date}</span>
          {order.courier && <span>Courier: {order.courier}</span>}
          {order.tracking_code && (
            <span>Tracking: {order.tracking_code}</span>
          )}
        </div>
      </div>
    </div>
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

  const tabs = [
    { key: "purchases" as const, label: "Mis Compras", count: purchases.length },
    { key: "sales" as const, label: "Mis Ventas", count: sales.length },
  ];

  const orders = tab === "purchases" ? purchases : sales;

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
        {orders.length === 0 ? (
          <EmptyState
            message={
              tab === "purchases"
                ? "Aun no tienes compras"
                : "Aun no tienes ventas"
            }
          />
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}
