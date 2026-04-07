"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AnalyticsData {
  totalViews: number;
  uniqueSessions: number;
  loggedInViews: number;
  browsers: Record<string, number>;
  os: Record<string, number>;
  devices: Record<string, number>;
  topPages: { path: string; count: number }[];
  topListings: { id: string; title: string; author: string; views: number }[];
  daily: { date: string; count: number }[];
  days: number;
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  if (loading) {
    return <div className="py-10 text-center text-gray-400 text-sm">Cargando analytics...</div>;
  }

  if (!data) {
    return <div className="py-10 text-center text-gray-400 text-sm">Error cargando datos</div>;
  }

  const maxDaily = Math.max(...data.daily.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              days === d
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {d} días
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Visitas totales" value={data.totalViews} />
        <StatCard label="Sesiones únicas" value={data.uniqueSessions} />
        <StatCard label="Usuarios logueados" value={data.loggedInViews} />
      </div>

      {/* Daily chart (simple bar) */}
      {data.daily.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Visitas por día</h3>
          <div className="flex items-end gap-1 h-32">
            {data.daily.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{d.count}</span>
                <div
                  className="w-full bg-brand-400 rounded-t"
                  style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                />
                <span className="text-[9px] text-gray-400 truncate w-full text-center">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Browsers + OS + Devices */}
      <div className="grid md:grid-cols-3 gap-4">
        <BreakdownCard title="Navegadores" data={data.browsers} total={data.totalViews} />
        <BreakdownCard title="Sistema operativo" data={data.os} total={data.totalViews} />
        <BreakdownCard title="Dispositivo" data={data.devices} total={data.totalViews} />
      </div>

      {/* Top pages */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Páginas más visitadas</h3>
        <div className="space-y-2">
          {data.topPages.map((p) => (
            <div key={p.path} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate max-w-[70%] font-mono text-xs">{p.path}</span>
              <span className="text-gray-400 text-xs font-medium">{p.count}</span>
            </div>
          ))}
          {data.topPages.length === 0 && (
            <p className="text-xs text-gray-400 italic">Sin datos aún</p>
          )}
        </div>
      </div>

      {/* Top listings */}
      {data.topListings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Libros más vistos</h3>
          <div className="space-y-2">
            {data.topListings.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <Link href={`/listings/${l.id}`} className="text-gray-700 hover:text-brand-600 truncate max-w-[70%]">
                  {l.title} <span className="text-gray-400">— {l.author}</span>
                </Link>
                <span className="text-gray-400 text-xs font-medium">{l.views} visitas</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString("es-CL")}</p>
    </div>
  );
}

function BreakdownCard({ title, data, total }: { title: string; data: Record<string, number>; total: number }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {sorted.map(([key, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-700">{key}</span>
                <span className="text-gray-400">{pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-xs text-gray-400 italic">Sin datos</p>
        )}
      </div>
    </div>
  );
}
