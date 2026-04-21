"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function SponsorRequestForm() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      offer: String(formData.get("offer") || ""),
      description: String(formData.get("description") || ""),
    };

    try {
      const res = await fetch("/api/sponsor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al enviar");
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al enviar");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
        <p className="text-3xl mb-3">🤝</p>
        <h3 className="font-display text-xl font-bold text-ink mb-2">
          Recibido, gracias
        </h3>
        <p className="text-sm text-ink-muted max-w-md mx-auto">
          Te voy a leer y, si hace sentido para la página, te escribo yo directo.
          No es automático — elijo una por una.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center px-7 py-3.5 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow"
        >
          Quiero ser amigo de la casa →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-cream-dark rounded-xl p-6 sm:p-8 text-left space-y-5 shadow-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sp-name" className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
            Nombre *
          </label>
          <input
            id="sp-name"
            name="name"
            type="text"
            required
            className="w-full px-3 py-2.5 border border-cream-dark rounded-md focus:outline-none focus:border-brand-500 text-sm"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="sp-email" className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
            Email *
          </label>
          <input
            id="sp-email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2.5 border border-cream-dark rounded-md focus:outline-none focus:border-brand-500 text-sm"
            placeholder="tu@email.cl"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sp-whatsapp" className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
          WhatsApp <span className="text-ink-muted font-normal normal-case">(opcional)</span>
        </label>
        <input
          id="sp-whatsapp"
          name="whatsapp"
          type="tel"
          className="w-full px-3 py-2.5 border border-cream-dark rounded-md focus:outline-none focus:border-brand-500 text-sm"
          placeholder="+56 9 ..."
        />
      </div>

      <div>
        <label htmlFor="sp-offer" className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
          ¿Qué ofreces? *
        </label>
        <input
          id="sp-offer"
          name="offer"
          type="text"
          required
          maxLength={80}
          className="w-full px-3 py-2.5 border border-cream-dark rounded-md focus:outline-none focus:border-brand-500 text-sm"
          placeholder="Ej: Clases de guitarra · Restauración de libros · Taller de encuadernación"
        />
      </div>

      <div>
        <label htmlFor="sp-description" className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
          Cuéntame un poco más *
        </label>
        <textarea
          id="sp-description"
          name="description"
          required
          rows={4}
          className="w-full px-3 py-2.5 border border-cream-dark rounded-md focus:outline-none focus:border-brand-500 text-sm resize-none"
          placeholder="Experiencia, años, a quién le sirve, por qué crees que encajas con la página..."
        />
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs text-ink-muted">
          Vero lee uno por uno. Si hace sentido, te escribe.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center px-6 py-3 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600 transition-colors shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Enviando..." : "Enviar postulación"}
        </button>
      </div>
    </form>
  );
}
