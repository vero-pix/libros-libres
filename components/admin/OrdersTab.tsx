"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AdminOrder } from "./types";
import { FilterBtn, EmptyState } from "./SharedUI";

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Pagado", color: "bg-green-100 text-green-700" },
  shipped: { label: "Enviado", color: "bg-blue-100 text-blue-700" },
  delivered: { label: "Entregado", color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-600" },
};

export default function OrdersTab({ orders, onUpdate, onDelete }: { orders: AdminOrder[]; onUpdate: (o: AdminOrder) => void; onDelete: (ids: string[]) => void }) {
  const supabase = createClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((o) => o.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function deleteOrder(id: string) {
    if (!window.confirm("¿Eliminar este pedido?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) { onDelete([id]); setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; }); }
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Eliminar ${ids.length} pedido(s)?`)) return;
    const { error } = await supabase.from("orders").delete().in("id", ids);
    if (!error) { onDelete(ids); setSelected(new Set()); }
  }

  async function updateOrder(id: string, updates: Record<string, unknown>) {
    const { error } = await supabase.from("orders").update(updates).eq("id", id);
    if (!error) {
      const order = orders.find((o) => o.id === id)!;
      onUpdate({ ...order, ...updates } as AdminOrder);
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>Todos</FilterBtn>
        {ORDER_STATUSES.map((s) => (
          <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)}>
            {ORDER_STATUS_LABELS[s].label} ({orders.filter((o) => o.status === s).length})
          </FilterBtn>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
          Seleccionar todos
        </label>
        {selected.size > 0 && (
          <button onClick={deleteSelected} className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg">
            Eliminar seleccionados ({selected.size})
          </button>
        )}
      </div>

      {filtered.length === 0 && <EmptyState text="No hay pedidos con este filtro." />}

      {filtered.map((order) => (
        <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleOne(order.id)} className="mt-1 rounded border-gray-300" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {order.listing?.book?.title ?? "Libro eliminado"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Comprador: {order.buyer?.full_name ?? order.buyer?.email ?? "—"} · Vendedor: {order.listing?.seller?.full_name ?? "—"}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ORDER_STATUS_LABELS[order.status]?.color}`}>
                {ORDER_STATUS_LABELS[order.status]?.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
              <div>
                <span className="text-gray-400">Total</span>
                <p className="font-bold text-gray-900">${order.total?.toLocaleString("es-CL")}</p>
              </div>
              <div>
                <span className="text-gray-400">Envío</span>
                <p className="text-gray-700">{order.shipping_speed === "express" ? "Express" : "Estándar"} · ${order.shipping_cost?.toLocaleString("es-CL")}</p>
              </div>
              <div>
                <span className="text-gray-400">Courier</span>
                <p className="text-gray-700">{order.courier ?? "—"}</p>
              </div>
              <div>
                <span className="text-gray-400">Tracking</span>
                <p className="text-gray-700 font-mono text-[11px]">{order.tracking_code ?? "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
              <span>{new Date(order.created_at).toLocaleDateString("es-CL")}</span>
              {order.mercadopago_payment_id && (
                <span className="font-mono">MP: {order.mercadopago_payment_id}</span>
              )}
              {order.buyer_address && <span className="truncate">Envío: {order.buyer_address}</span>}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setEditingId(editingId === order.id ? null : order.id)}
                className="text-xs text-gray-500 hover:bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200"
              >
                {editingId === order.id ? "Cancelar" : "Editar"}
              </button>
              <button
                onClick={() => deleteOrder(order.id)}
                className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>

          {editingId === order.id && (
            <OrderEditForm order={order} onSave={updateOrder} onCancel={() => setEditingId(null)} />
          )}
        </div>
      ))}
    </div>
  );
}

function OrderEditForm({ order, onSave, onCancel }: { order: AdminOrder; onSave: (id: string, u: Record<string, unknown>) => void; onCancel: () => void }) {
  const [status, setStatus] = useState(order.status);
  const [courier, setCourier] = useState(order.courier ?? "");
  const [tracking, setTracking] = useState(order.tracking_code ?? "");

  return (
    <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Courier</label>
          <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Starken, Rappi..." className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tracking</label>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Código seguimiento" className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200">Cancelar</button>
        <button
          onClick={() => onSave(order.id, { status, courier: courier || null, tracking_code: tracking || null })}
          className="text-xs text-white bg-ink hover:bg-gray-800 px-4 py-1.5 rounded-lg"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
