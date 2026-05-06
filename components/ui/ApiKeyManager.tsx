"use client";

import { useEffect, useState } from "react";

interface ApiKey {
  id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyName, setKeyName] = useState("");

  async function fetchKeys() {
    const res = await fetch("/api/v1/keys");
    const data = await res.json();
    setKeys(data.keys ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchKeys(); }, []);

  async function generateKey() {
    setGenerating(true);
    const res = await fetch("/api/v1/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName.trim() || "Mi API Key" }),
    });
    const data = await res.json();
    if (data.key) {
      setNewKey(data.key);
      setKeyName("");
      fetchKeys();
    }
    setGenerating(false);
  }

  async function revokeKey(id: string) {
    await fetch(`/api/v1/keys?id=${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatDate(iso: string | null) {
    if (!iso) return "Nunca";
    return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="mt-6 border border-gray-200 rounded-2xl p-5 bg-white">
      <h2 className="text-sm font-semibold text-gray-800 mb-1">API de Catálogo</h2>
      <p className="text-xs text-gray-500 mb-4">
        Integra tu sistema con tuslibros.cl para crear, actualizar y dar de baja listings automáticamente.
      </p>

      {/* Nueva key recién generada — solo visible una vez */}
      {newKey && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-medium text-amber-800 mb-2">
            Copia tu API key ahora — no la verás de nuevo.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] bg-white border border-amber-200 rounded-lg px-2 py-1.5 break-all font-mono text-gray-700">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
            >
              {copied ? "Copiada" : "Copiar"}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs text-amber-700 hover:underline"
          >
            Ya la guardé, cerrar
          </button>
        </div>
      )}

      {/* Keys existentes */}
      {loading ? (
        <p className="text-xs text-gray-400">Cargando…</p>
      ) : keys.length > 0 ? (
        <div className="space-y-2 mb-4">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs font-medium text-gray-700">{k.name}</p>
                <p className="text-[10px] text-gray-400">
                  Creada {formatDate(k.created_at)} · Último uso: {formatDate(k.last_used_at)}
                </p>
              </div>
              <button
                onClick={() => revokeKey(k.id)}
                className="text-[10px] text-red-500 hover:text-red-700 font-medium"
              >
                Revocar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-4">Sin API keys generadas.</p>
      )}

      {/* Generar nueva */}
      <div className="flex gap-2">
        <input
          type="text"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          placeholder='Nombre (ej: "Sistema Álvaro")'
          className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <button
          onClick={generateKey}
          disabled={generating}
          className="text-xs bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium transition-colors"
        >
          {generating ? "Generando…" : "Generar API key"}
        </button>
      </div>

      <p className="mt-3 text-[10px] text-gray-400">
        Documentación: <code className="bg-gray-100 px-1 rounded">GET /api/v1/listings</code> · <code className="bg-gray-100 px-1 rounded">POST /api/v1/listings</code> · <code className="bg-gray-100 px-1 rounded">PATCH /api/v1/listings/:id</code>
      </p>
    </div>
  );
}
