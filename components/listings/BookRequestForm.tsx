"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface BookRequestFormProps {
  initialTitle?: string;
}

export default function BookRequestForm({ initialTitle = "" }: BookRequestFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [matches, setMatches] = useState<
    { id: string; title: string; author: string | null; price: number | null; url: string }[]
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!title || !email) {
      setErrorMsg("Por favor completa el título y tu email");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          requester_email: email,
          requester_whatsapp: whatsapp,
          notes,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el pedido");
      }

      setMatches(Array.isArray(data.matches) ? data.matches : []);
      setIsDone(true);
    } catch (err: any) {
      console.error("Error creating book request:", err.message);
      setErrorMsg("Hubo un error al guardar tu pedido. Reintenta en unos momentos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="bg-brand-50 p-8 rounded-2xl border border-brand-100 text-center animate-in fade-in zoom-in duration-500">
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-xl font-bold text-ink">¡Pedido guardado!</h3>
        <p className="text-ink-muted mt-2">
          Hemos anotado que buscas <strong>&ldquo;{title}&rdquo;</strong>.
          Recibirás un correo apenas alguien lo publique.
        </p>

        {/* Si ya está a la venta, mostrarlo acá mismo en vez de mandarlo a esperar. */}
        {matches.length > 0 && (
          <div className="mt-6 text-left">
            <p className="text-xs uppercase tracking-wider font-semibold text-brand-700 mb-2">
              Aunque quizás no tengas que esperar:
            </p>
            <ul className="space-y-2">
              {matches.map((m) => (
                <li key={m.id}>
                  <a
                    href={m.url}
                    className="flex items-baseline justify-between gap-3 bg-white border border-brand-100 rounded-xl px-4 py-3 hover:border-brand-300 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink truncate">{m.title}</span>
                      {m.author && (
                        <span className="block text-xs italic text-ink-muted truncate">{m.author}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-brand-700">
                      {m.price ? `$${m.price.toLocaleString("es-CL")}` : "Ver"} →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          className="mt-6 border border-brand-200 hover:bg-brand-100 text-brand-700 px-6 py-2 rounded-xl transition-colors"
          onClick={() => {
            setIsDone(false);
            setMatches([]);
            setTitle("");
            setEmail("");
            setWhatsapp("");
            setNotes("");
          }}
        >
          Pedir otro libro
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-ink mb-6 flex items-center gap-2">
        <span className="text-brand-500">🔍</span> Encarga este libro
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="req-title" className="text-sm font-medium text-ink-muted block">¿Qué libro buscas? (Título / Autor)</label>
          <input
            id="req-title"
            placeholder="Ej: Rayuela de Julio Cortázar"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 rounded-xl outline-none transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="req-email" className="text-sm font-medium text-ink-muted block">Tu Email (para avisarte)</label>
            <input
              id="req-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 rounded-xl outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="req-wa" className="text-sm font-medium text-ink-muted block">WhatsApp (opcional)</label>
            <input
              id="req-wa"
              placeholder="+56 9 ..."
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 rounded-xl outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="req-notes" className="text-sm font-medium text-ink-muted block">Alguna nota (opcional)</label>
          <textarea
            id="req-notes"
            placeholder="Ej: Busco una edición antigua o tapa dura..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 rounded-xl outline-none transition-all min-h-[80px] resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Solicitar Libro"}
        </button>
        
        <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest">
          Servicio gratuito — tuslibros.cl
        </p>
      </form>
    </div>
  );
}
