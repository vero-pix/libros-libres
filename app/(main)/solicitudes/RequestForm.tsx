"use client";

import { useState } from "react";

export default function RequestForm() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [notes, setNotes] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setStatus("loading");
    setErrorMsg(null);

    // Auto-detectar si el contacto es email o whatsapp
    const isEmail = /@/.test(contact);
    const body = {
      title: title.trim(),
      author: author.trim() || undefined,
      notes: notes.trim() || undefined,
      requester_email: isEmail ? contact.trim() : undefined,
      requester_whatsapp: !isEmail ? contact.trim() : undefined,
      requester_location: location.trim() || undefined,
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Error al enviar");
        setStatus("error");
        return;
      }
      setStatus("ok");
      setTitle("");
      setAuthor("");
      setNotes("");
      setContact("");
      setLocation("");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Error al enviar");
      setStatus("error");
    }
  };

  if (status === "ok") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="font-display text-lg text-green-900 mb-2">¡Solicitud recibida!</p>
        <p className="text-sm text-green-800 mb-4">
          Si un vendedor publica este libro, te contactamos. Mientras tanto tu
          pedido queda visible en la lista para que los vendedores lo vean.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-xs uppercase tracking-wider font-semibold text-green-900 underline"
        >
          Pedir otro libro
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Título *
          </span>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="El fin de la historia y el último hombre"
            className="mt-1.5 w-full px-3 py-2.5 border border-cream-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Autor (opcional)
          </span>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Francis Fukuyama"
            className="mt-1.5 w-full px-3 py-2.5 border border-cream-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Notas (opcional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cualquier detalle — edición, año, si aceptas usado, etc."
            rows={2}
            className="mt-1.5 w-full px-3 py-2.5 border border-cream-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </label>
        <label className="block sm:w-56">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            📍 Tu ciudad
          </span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Santiago, Osorno..."
            className="mt-1.5 w-full px-3 py-2.5 border border-cream-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-[11px] text-ink-muted mt-1 block">
            Para que vendedores cerca te vean primero.
          </span>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Tu email o WhatsApp (opcional)
        </span>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="+56912345678 o tu@correo.cl"
          className="mt-1.5 w-full px-3 py-2.5 border border-cream-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <span className="text-[11px] text-ink-muted mt-1 block">
          Solo para avisarte cuando alguien lo publique. No se muestra público.
        </span>
      </label>

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !title.trim()}
        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-amber-700 text-white text-sm font-semibold uppercase tracking-wider rounded-md hover:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === "loading" ? "Enviando..." : "Pedir este libro"}
      </button>
    </form>
  );
}
