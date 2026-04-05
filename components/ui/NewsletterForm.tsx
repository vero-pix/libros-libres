"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-brand-600 font-medium">
        Te suscribiste correctamente. Revisa tu correo.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full md:w-auto gap-0">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
        className="flex-1 md:w-72 px-5 py-3 bg-white border border-cream-dark rounded-l-lg text-ink text-sm placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-r-lg text-sm uppercase tracking-wider transition-colors whitespace-nowrap"
      >
        {status === "loading" ? "..." : "Suscribir"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-500 mt-1">Error al suscribir. Intenta de nuevo.</p>
      )}
    </form>
  );
}
