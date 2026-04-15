"use client";

import { useEffect, useState } from "react";

interface BusinessData {
  funnel: {
    visitors30d: number;
    registered: number;
    withOrder: number;
    withPaidOrder: number;
    regConv: number;
    orderConv: number;
    payConv: number;
  };
  revenue: {
    totalPaid: number;
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    failedOrders: number;
  };
  abandonedCarts: {
    total: number;
    uniqueBuyers: number;
    totalValue: number;
    items: {
      id: string;
      daysOld: number;
      buyer: string;
      email: string;
      title: string;
      price: number;
    }[];
  };
  pendingOrders: {
    id: string;
    daysOld: number;
    buyer: string;
    email: string;
    total: number;
  }[];
  topSellers: { name: string; username: string | null; listings: number; sold: number }[];
}

export default function BusinessTab() {
  const [data, setData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/business-metrics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-10 text-center text-gray-400 text-sm">Cargando...</div>;
  if (!data) return <div className="py-10 text-center text-red-400 text-sm">Error cargando métricas de negocio.</div>;

  return (
    <div className="space-y-6">
      {/* Embudo de conversión */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Embudo de conversión (últimos 30 días)</h3>
        <div className="space-y-3">
          <FunnelStep label="Visitantes (sesiones únicas)" value={data.funnel.visitors30d} max={data.funnel.visitors30d} color="bg-blue-400" />
          <FunnelStep label="Usuarios registrados (histórico)" value={data.funnel.registered} max={data.funnel.visitors30d} color="bg-indigo-400" pct={data.funnel.regConv} />
          <FunnelStep label="Con al menos una orden" value={data.funnel.withOrder} max={data.funnel.visitors30d} color="bg-violet-400" pct={data.funnel.orderConv} />
          <FunnelStep label="Con orden pagada" value={data.funnel.withPaidOrder} max={data.funnel.visitors30d} color="bg-emerald-500" pct={data.funnel.payConv} />
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Regla típica de e-commerce: 2-3% visita→registro, 10-20% registro→orden, 60-80% orden→pago. Tu cuello de botella: donde veas la caída más fuerte.
        </p>
      </section>

      {/* Revenue */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Ingresos confirmados" value={`$${data.revenue.totalPaid.toLocaleString("es-CL")}`} highlight />
        <StatCard label="Órdenes pagadas" value={data.revenue.paidOrders} />
        <StatCard label="Órdenes pendientes" value={data.revenue.pendingOrders} alert={data.revenue.pendingOrders > 3} />
        <StatCard label="Órdenes fallidas" value={data.revenue.failedOrders} />
      </section>

      {/* Carritos abandonados */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Carritos abandonados</h3>
          <span className="text-xs text-gray-500">
            {data.abandonedCarts.uniqueBuyers} compradores · ${data.abandonedCarts.totalValue.toLocaleString("es-CL")} potencial
          </span>
        </div>
        {data.abandonedCarts.items.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Sin carritos abandonados ahora mismo.</p>
        ) : (
          <div className="space-y-2">
            {data.abandonedCarts.items.slice(0, 15).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs border-b border-gray-100 pb-1.5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">{c.title}</p>
                  <p className="text-gray-500">{c.buyer} · {c.email}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-semibold text-gray-900">${c.price.toLocaleString("es-CL")}</p>
                  <p className={`text-[10px] ${c.daysOld >= 3 ? "text-amber-600" : "text-gray-400"}`}>hace {c.daysOld}d</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Órdenes pendientes */}
      {data.pendingOrders.length > 0 && (
        <section className="bg-white rounded-xl border border-amber-200 p-5 bg-amber-50/30">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">⚠ Órdenes pendientes de pago</h3>
          <div className="space-y-2">
            {data.pendingOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs border-b border-amber-100 pb-1.5">
                <span className="text-gray-700">{o.buyer} · {o.email}</span>
                <span className="text-gray-900 font-semibold">${o.total.toLocaleString("es-CL")} · hace {o.daysOld}d</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-3">
            Contactar a estos compradores por email/WhatsApp puede recuperar ventas.
          </p>
        </section>
      )}

      {/* Top vendedores */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Top vendedores</h3>
        <div className="space-y-1.5">
          {data.topSellers.map((s) => (
            <div key={s.username ?? s.name} className="flex items-center justify-between text-xs">
              <span className="text-gray-700">{s.name} {s.username && <span className="text-gray-400">@{s.username}</span>}</span>
              <span className="text-gray-500">{s.listings} activos · {s.sold} vendidos</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FunnelStep({ label, value, max, color, pct }: { label: string; value: number; max: number; color: string; pct?: number }) {
  const barPct = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-semibold">
          {value.toLocaleString("es-CL")}
          {pct !== undefined && <span className="text-gray-400 font-normal"> · {pct.toFixed(1)}%</span>}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${barPct}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, alert }: { label: string; value: number | string; highlight?: boolean; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "bg-emerald-50 border-emerald-200" : alert ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-emerald-700" : alert ? "text-amber-700" : "text-gray-900"}`}>{typeof value === "number" ? value.toLocaleString("es-CL") : value}</p>
    </div>
  );
}
