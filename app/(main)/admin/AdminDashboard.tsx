"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* ── Types ── */

interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  role: string;
  created_at: string;
}

interface AdminBook {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  isbn: string | null;
  cover_url: string | null;
}

interface AdminListing {
  id: string;
  book_id: string;
  seller_id: string;
  modality: string;
  price: number | null;
  condition: string;
  notes: string | null;
  address: string | null;
  cover_image_url: string | null;
  status: string;
  created_at: string;
  book: AdminBook;
  seller: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
}

interface AdminOrder {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  book_price: number;
  shipping_cost: number;
  service_fee: number;
  total: number;
  status: string;
  shipping_speed: string;
  courier: string | null;
  tracking_code: string | null;
  buyer_address: string | null;
  mercadopago_payment_id: string | null;
  created_at: string;
  listing: AdminListing;
  buyer: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
}

interface Props {
  orders: AdminOrder[];
  listings: AdminListing[];
  users: AdminUser[];
  messages?: ContactMessage[];
  subscribers?: Subscriber[];
}

/* ── Tabs ── */

type Tab = "orders" | "listings" | "users" | "messages" | "subscribers";

export default function AdminDashboard({ orders: initOrders, listings: initListings, users: initUsers, messages = [], subscribers = [] }: Props) {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState(initOrders);
  const [listings, setListings] = useState(initListings);
  const [users, setUsers] = useState(initUsers);
  const [msgs, setMsgs] = useState(messages);
  const [subs, setSubs] = useState(subscribers);

  const unreadMessages = msgs.filter((m) => !m.read).length;
  const totalRevenue = orders
    .filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "delivered")
    .reduce((sum, o) => sum + (o.service_fee ?? 0), 0);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "orders", label: "Pedidos", count: orders.length },
    { key: "listings", label: "Publicaciones", count: listings.length },
    { key: "users", label: "Usuarios", count: users.length },
    { key: "messages", label: "Mensajes", count: msgs.length },
    { key: "subscribers", label: "Newsletter", count: subs.length },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Stat label="Ingresos totales" value={`$${totalRevenue.toLocaleString("es-CL")}`} />
        <Stat label="Publicaciones activas" value={listings.filter((l) => l.status === "active").length} />
        <Stat label="Usuarios registrados" value={users.length} />
        <Stat label="Mensajes sin leer" value={unreadMessages} />
        <Stat label="Suscriptores newsletter" value={subs.length} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors ${
              tab === t.key ? "bg-ink text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <OrdersTab orders={orders} onUpdate={(updated) => setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))} onDelete={(ids) => setOrders((prev) => prev.filter((o) => !ids.includes(o.id)))} />
      )}
      {tab === "listings" && (
        <ListingsTab listings={listings} onUpdate={setListings} />
      )}
      {tab === "users" && (
        <UsersTab users={users} onUpdate={setUsers} />
      )}
      {tab === "messages" && (
        <div className="space-y-3">
          {msgs.length === 0 ? (
            <EmptyState text="Sin mensajes de contacto" />
          ) : (
            msgs.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(m.created_at).toLocaleDateString("es-CL")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{m.message}</p>
              </div>
            ))
          )}
        </div>
      )}
      {tab === "subscribers" && (
        <div>
          {subs.length === 0 ? (
            <EmptyState text="Sin suscriptores al newsletter" />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subs.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 text-gray-900">{s.email}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(s.subscribed_at).toLocaleDateString("es-CL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ORDERS TAB
   ════════════════════════════════════════════════ */

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Pagado", color: "bg-green-100 text-green-700" },
  shipped: { label: "Enviado", color: "bg-blue-100 text-blue-700" },
  delivered: { label: "Entregado", color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-600" },
};

function OrdersTab({ orders, onUpdate, onDelete }: { orders: AdminOrder[]; onUpdate: (o: AdminOrder) => void; onDelete: (ids: string[]) => void }) {
  const supabase = createClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((o) => o.id)));
    }
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
      {/* Filter */}
      <div className="flex gap-1 flex-wrap">
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>Todos</FilterBtn>
        {ORDER_STATUSES.map((s) => (
          <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)}>
            {ORDER_STATUS_LABELS[s].label} ({orders.filter((o) => o.status === s).length})
          </FilterBtn>
        ))}
      </div>

      {/* Bulk actions */}
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
          <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Chilexpress, Rappi..." className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
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

/* ════════════════════════════════════════════════
   LISTINGS TAB
   ════════════════════════════════════════════════ */

const LISTING_STATUSES = ["active", "paused", "completed", "rented"] as const;
const LISTING_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Activo", color: "bg-green-100 text-green-700" },
  paused: { label: "Pausado", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Vendido", color: "bg-gray-100 text-gray-500" },
  rented: { label: "Arrendado", color: "bg-blue-100 text-blue-700" },
};

function ListingsTab({ listings, onUpdate }: { listings: AdminListing[]; onUpdate: (l: AdminListing[]) => void }) {
  const supabase = createClient();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = filter === "all" ? listings : listings.filter((l) => l.status === filter);
  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (!error) {
      onUpdate(listings.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  }

  async function deleteListing(id: string) {
    if (!window.confirm("¿Eliminar esta publicación?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (!error) {
      onUpdate(listings.filter((l) => l.id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Eliminar ${ids.length} publicación(es)?`)) return;
    const { error } = await supabase.from("listings").delete().in("id", ids);
    if (!error) {
      onUpdate(listings.filter((l) => !ids.includes(l.id)));
      setSelected(new Set());
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>Todas ({listings.length})</FilterBtn>
        {LISTING_STATUSES.map((s) => (
          <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)}>
            {LISTING_STATUS_LABELS[s].label} ({listings.filter((l) => l.status === s).length})
          </FilterBtn>
        ))}
      </div>

      {/* Bulk actions */}
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

      {filtered.length === 0 && <EmptyState text="No hay publicaciones con este filtro." />}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filtered.map((listing) => (
          <div key={listing.id} className="flex items-center gap-3 p-3">
            {/* Checkbox */}
            <input type="checkbox" checked={selected.has(listing.id)} onChange={() => toggleOne(listing.id)} className="rounded border-gray-300" />

            {/* Cover */}
            <div className="flex-shrink-0 w-10 h-14 rounded overflow-hidden bg-gray-100">
              {(listing.cover_image_url ?? listing.book?.cover_url) ? (
                <img src={(listing.cover_image_url ?? listing.book.cover_url)!} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📚</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{listing.book?.title}</p>
              <p className="text-xs text-gray-500 truncate">
                {listing.seller?.full_name ?? listing.seller?.email ?? "—"} · {listing.price != null ? `$${listing.price.toLocaleString("es-CL")}` : "Préstamo"}
              </p>
            </div>

            {/* Status */}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LISTING_STATUS_LABELS[listing.status]?.color ?? "bg-gray-100 text-gray-500"}`}>
              {LISTING_STATUS_LABELS[listing.status]?.label ?? listing.status}
            </span>

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0">
              {listing.status === "active" && (
                <SmallBtn onClick={() => updateStatus(listing.id, "paused")} color="yellow">Pausar</SmallBtn>
              )}
              {listing.status === "paused" && (
                <SmallBtn onClick={() => updateStatus(listing.id, "active")} color="green">Activar</SmallBtn>
              )}
              <SmallBtn onClick={() => deleteListing(listing.id)} color="red">Eliminar</SmallBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   USERS TAB
   ════════════════════════════════════════════════ */

function UsersTab({ users, onUpdate }: { users: AdminUser[]; onUpdate: (u: AdminUser[]) => void }) {
  const supabase = createClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = users.length > 0 && users.every((u) => selected.has(u.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function updateUser(id: string, updates: Record<string, unknown>) {
    const { error } = await supabase.from("users").update(updates).eq("id", id);
    if (!error) {
      onUpdate(users.map((u) => (u.id === id ? { ...u, ...updates } as AdminUser : u)));
      setEditingId(null);
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (!error) {
      onUpdate(users.filter((u) => u.id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Eliminar ${ids.length} usuario(s)?`)) return;
    const { error } = await supabase.from("users").delete().in("id", ids);
    if (!error) {
      onUpdate(users.filter((u) => !ids.includes(u.id)));
      setSelected(new Set());
    }
  }

  return (
    <div className="space-y-3">
      {/* Bulk actions */}
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

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {users.map((user) => (
          <div key={user.id}>
            <div className="flex items-center gap-3 p-3">
              {/* Checkbox */}
              <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleOne(user.id)} className="rounded border-gray-300" />

              {/* Avatar placeholder */}
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(user.full_name ?? user.email ?? "?")[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.full_name ?? "Sin nombre"}</p>
                <p className="text-xs text-gray-500 truncate">{user.email} · {user.phone ?? "sin teléfono"}</p>
              </div>

              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                {user.role === "admin" ? "Admin" : "Usuario"}
              </span>

              <span className="text-[10px] text-gray-400 flex-shrink-0">
                {new Date(user.created_at).toLocaleDateString("es-CL")}
              </span>

              <button
                onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200"
              >
                Editar
              </button>
              <button
                onClick={() => deleteUser(user.id)}
                className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded border border-red-200"
              >
                Eliminar
              </button>
            </div>

            {editingId === user.id && (
              <UserEditForm user={user} onSave={updateUser} onCancel={() => setEditingId(null)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UserEditForm({ user, onSave, onCancel }: { user: AdminUser; onSave: (id: string, u: Record<string, unknown>) => void; onCancel: () => void }) {
  const [name, setName] = useState(user.full_name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [role, setRole] = useState(user.role ?? "user");

  return (
    <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ciudad</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200">Cancelar</button>
        <button
          onClick={() => onSave(user.id, { full_name: name || null, phone: phone || null, city: city || null, role })}
          className="text-xs text-white bg-ink hover:bg-gray-800 px-4 py-1.5 rounded-lg"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

/* ── Shared UI ── */

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
        active ? "bg-ink text-white" : "text-gray-500 hover:bg-gray-100 border border-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function SmallBtn({ onClick, color, children }: { onClick: () => void; color: "red" | "green" | "yellow"; children: React.ReactNode }) {
  const colors = {
    red: "text-red-500 border-red-200 hover:bg-red-50",
    green: "text-green-600 border-green-200 hover:bg-green-50",
    yellow: "text-yellow-600 border-yellow-200 hover:bg-yellow-50",
  };
  return (
    <button onClick={onClick} className={`text-[10px] px-2 py-1 rounded border ${colors[color]}`}>
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-gray-400 py-8">{text}</p>;
}
