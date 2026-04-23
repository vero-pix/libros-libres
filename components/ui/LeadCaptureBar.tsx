"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tuslibros_lead_capture_v1";
const DELAY_MS = 25_000;

export default function LeadCaptureBar() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return;

    const timer = window.setTimeout(() => setVisible(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("err");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("ok");
      try {
        window.localStorage.setItem(STORAGE_KEY, "subscribed");
      } catch {}
      window.setTimeout(() => setVisible(false), 2500);
    } catch {
      setStatus("err");
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Recibe novedades"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-cream-warm border border-brand-400/60 shadow-lg rounded-2xl p-4 sm:p-5 animate-fade-up"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute top-2 right-3 text-ink-muted hover:text-ink text-lg leading-none"
      >
        ×
      </button>

      {status === "ok" ? (
        <div className="py-2">
          <p className="text-sm font-semibold text-ink">¡Listo! 📬</p>
          <p className="text-xs text-ink-muted mt-1">
            Te vamos a escribir cuando haya novedades del catálogo.
          </p>
        </div>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-600 mb-1">
            Antes de irte
          </p>
          <p className="font-serif text-base text-ink leading-snug mb-3">
            Déjame tu email y te aviso cuando lleguen libros que podrían gustarte.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "err") setStatus("idle");
              }}
              placeholder="tu@correo.com"
              required
              className="flex-1 px-3 py-2 border border-cream-dark/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold px-4 rounded-lg transition-colors"
            >
              {status === "loading" ? "..." : "Avisarme"}
            </button>
          </form>
          {status === "err" && (
            <p className="text-xs text-red-600 mt-2">Email inválido, prueba de nuevo.</p>
          )}
          <p className="text-[10px] text-ink-muted/80 mt-2">
            Sin spam. Te avisamos solo cuando hay algo que valga la pena.
          </p>
        </>
      )}
    </div>
  );
}
