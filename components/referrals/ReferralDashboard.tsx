"use client";

import { useState, useEffect } from "react";

interface ReferralStats {
  code: string;
  link: string;
  total: number;
  completed: number;
  rewarded: number;
}

export default function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/referrals");
        if (res.ok) setStats(await res.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function copyToClipboard(text: string, type: "code" | "link") {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return <div className="text-center py-16 text-ink-muted">Cargando...</div>;
  }

  if (!stats) {
    return <div className="text-center py-16 text-red-500">Error al cargar datos</div>;
  }

  return (
    <div className="space-y-6">
      {/* Code card */}
      <div className="bg-white rounded-xl border border-cream-dark/30 p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tu código de referido</p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-bold font-mono text-brand-600 bg-brand-50 px-4 py-2 rounded-lg">
            {stats.code}
          </span>
          <button
            onClick={() => copyToClipboard(stats.code, "code")}
            className="text-sm text-brand-600 hover:text-brand-700 font-semibold px-3 py-2 rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors"
          >
            {copied === "code" ? "Copiado" : "Copiar código"}
          </button>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
          <input
            readOnly
            value={stats.link}
            className="flex-1 bg-transparent text-sm text-gray-600 outline-none font-mono"
          />
          <button
            onClick={() => copyToClipboard(stats.link, "link")}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded border border-brand-200 hover:bg-brand-50 transition-colors flex-shrink-0"
          >
            {copied === "link" ? "Copiado" : "Copiar link"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-cream-dark/30 p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-ink-muted mt-1">Invitaciones enviadas</p>
        </div>
        <div className="bg-white rounded-xl border border-cream-dark/30 p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-ink-muted mt-1">Se registraron</p>
        </div>
        <div className="bg-white rounded-xl border border-cream-dark/30 p-5 text-center">
          <p className="text-3xl font-bold text-brand-600">{stats.rewarded}</p>
          <p className="text-xs text-ink-muted mt-1">Descuentos ganados</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-brand-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Cómo funciona</h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Comparte tu código o link con amigos que tengan libros para vender" },
            { step: "2", text: "Tu amigo se registra y publica su primer libro" },
            { step: "3", text: "Tú recibes un descuento en el despacho de tu próxima compra" },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3">
              <span className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {s.step}
              </span>
              <p className="text-sm text-gray-700">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Share buttons */}
      <div className="bg-white rounded-xl border border-cream-dark/30 p-6">
        <p className="text-sm font-semibold text-gray-900 mb-3">Compartir por</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Vende tus libros usados en tuslibros.cl 📚 Usa mi código ${stats.code} al registrarte: ${stats.link}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent("Vende tus libros usados en tuslibros.cl")}&body=${encodeURIComponent(`Hola! Te invito a vender tus libros usados en tuslibros.cl. Publica gratis y recibe pagos con MercadoPago.\n\nUsa mi código: ${stats.code}\nRegistro: ${stats.link}`)}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Email
          </a>
          <button
            onClick={() => copyToClipboard(
              `Vende tus libros usados en tuslibros.cl 📚 Usa mi código ${stats.code}: ${stats.link}`,
              "link"
            )}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Copiar mensaje
          </button>
        </div>
      </div>
    </div>
  );
}
