"use client";

import { useState } from "react";
import type { AdminOrder, AdminListing, AdminUser, ContactMessage, Subscriber } from "@/components/admin/types";
import { Stat, EmptyState } from "@/components/admin/SharedUI";
import OrdersTab from "@/components/admin/OrdersTab";
import ListingsTab from "@/components/admin/ListingsTab";
import UsersTab from "@/components/admin/UsersTab";
import ToolsTab from "@/components/admin/ToolsTab";
import NewsletterSender from "@/components/admin/NewsletterSender";
import AnalyticsTab from "@/components/admin/AnalyticsTab";

interface Props {
  orders: AdminOrder[];
  listings: AdminListing[];
  users: AdminUser[];
  messages?: ContactMessage[];
  subscribers?: Subscriber[];
}

type Tab = "orders" | "listings" | "users" | "messages" | "subscribers" | "analytics" | "tools";

export default function AdminDashboard({ orders: initOrders, listings: initListings, users: initUsers, messages = [], subscribers = [] }: Props) {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState(initOrders);
  const [listings, setListings] = useState(initListings);
  const [users, setUsers] = useState(initUsers);
  const [msgs] = useState(messages);
  const [subs] = useState(subscribers);

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
    { key: "analytics", label: "Analytics", count: 0 },
    { key: "tools", label: "Herramientas", count: 0 },
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
        <div className="space-y-6">
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

          {subs.length > 0 && <NewsletterSender subscriberCount={subs.length} />}
        </div>
      )}
      {tab === "analytics" && (
        <AnalyticsTab />
      )}
      {tab === "tools" && (
        <ToolsTab users={users} />
      )}
    </div>
  );
}
