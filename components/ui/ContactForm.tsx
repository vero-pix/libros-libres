"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-white rounded-xl border border-cream-dark/30 p-8 text-center">
        <p className="text-brand-600 font-semibold">Mensaje enviado correctamente.</p>
        <p className="text-ink-muted text-sm mt-1">Te responderemos pronto.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-cream-dark/30 p-6">
      <h2 className="font-display text-lg font-bold text-ink mb-4">Envíanos un mensaje</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-cream-dark/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-cream-dark/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">Mensaje</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2.5 border border-cream-dark/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>
        {status === "error" && (
          <p className="text-sm text-red-600">Error al enviar. Intenta de nuevo.</p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {status === "loading" ? "Enviando..." : "Enviar mensaje"}
        </button>
      </form>
    </div>
  );
}
