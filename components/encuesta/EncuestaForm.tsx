"use client";

import { useState } from "react";
import Link from "next/link";
import { PREGUNTAS, INTRO, type Grupo, type Pregunta } from "@/lib/encuesta";

interface Props {
  grupo: Grupo;
  emailInicial?: string | null;
}

export default function EncuestaForm({ grupo, emailInicial }: Props) {
  const preguntas = PREGUNTAS[grupo];
  const intro = INTRO[grupo];

  const [respuestas, setRespuestas] = useState<Record<string, string[] | string>>({});
  const [email, setEmail] = useState(emailInicial ?? "");
  // Honeypot: los humanos lo dejan vacío. Mismo patrón que NewsletterForm y
  // RegisterForm; el server finge éxito si viene lleno.
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggle = (pid: string, opcion: string) => {
    setRespuestas((prev) => {
      const actual = (prev[pid] as string[]) ?? [];
      return {
        ...prev,
        [pid]: actual.includes(opcion)
          ? actual.filter((o) => o !== opcion)
          : [...actual, opcion],
      };
    });
  };

  const marcado = (pid: string, opcion: string) => {
    const v = respuestas[pid];
    return Array.isArray(v) ? v.includes(opcion) : v === opcion;
  };

  // Al menos una respuesta: si no, es una fila vacía que ensucia el conteo.
  const algoRespondido = Object.values(respuestas).some((v) =>
    Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "",
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!algoRespondido) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/encuesta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupo, respuestas, email: email.trim() || undefined, company }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "No se pudo enviar. Intenta de nuevo.");
        setStatus("error");
        return;
      }
      setStatus("ok");
    } catch {
      setErrorMsg("No se pudo enviar. Revisa tu conexión.");
      setStatus("error");
    }
  };

  if (status === "ok") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-2xl mb-2">🙏</p>
        <h2 className="font-semibold text-green-900 mb-2">Gracias, de verdad</h2>
        <p className="text-sm text-green-800 mb-4 leading-relaxed">
          Lo leo yo. Si dejaste tu correo, te escribo cuando construya algo de lo que
          pediste — y te destaco un libro en la portada por una semana.
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Volver a tuslibros.cl
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink leading-tight">
          {intro.titulo}
        </h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">{intro.bajada}</p>
        <p className="text-ink-muted mt-2 text-sm">— Vero</p>
      </header>

      {preguntas.map((p: Pregunta) => (
        <fieldset key={p.id} className="border-0 p-0 m-0">
          <legend className="text-sm font-semibold text-ink mb-1">{p.texto}</legend>
          {p.ayuda && <p className="text-xs text-ink-muted mb-2.5">{p.ayuda}</p>}

          {p.tipo === "texto" ? (
            <textarea
              rows={4}
              value={(respuestas[p.id] as string) ?? ""}
              onChange={(e) => setRespuestas((r) => ({ ...r, [p.id]: e.target.value }))}
              placeholder="Escribe lo que se te ocurra…"
              className="mt-1 w-full px-3 py-2.5 border border-cream-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          ) : (
            <div className="space-y-2">
              {p.opciones?.map((op) => (
                <label
                  key={op}
                  className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border cursor-pointer transition-colors ${
                    marcado(p.id, op)
                      ? "border-brand-500 bg-brand-50"
                      : "border-cream-dark bg-white hover:bg-cream-warm"
                  }`}
                >
                  <input
                    type={p.tipo === "multiple" ? "checkbox" : "radio"}
                    name={p.id}
                    checked={marcado(p.id, op)}
                    onChange={() =>
                      p.tipo === "multiple"
                        ? toggle(p.id, op)
                        : setRespuestas((r) => ({ ...r, [p.id]: op }))
                    }
                    className="mt-0.5 accent-brand-500 shrink-0"
                  />
                  <span className="text-sm text-ink leading-snug">{op}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      ))}

      <div>
        <label className="block text-sm font-semibold text-ink mb-1">
          Tu correo <span className="font-normal text-ink-muted">(opcional)</span>
        </label>
        <p className="text-xs text-ink-muted mb-2">
          Solo para responderte y destacarte un libro. No lo uso para nada más.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full px-3 py-2.5 border border-cream-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Honeypot anti-bot: oculto para humanos, los bots lo rellenan */}
      <input
        type="text"
        name="company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
      />

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !algoRespondido}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base shadow-sm"
      >
        {status === "loading" ? "Enviando…" : "Enviar mis respuestas"}
      </button>
      {!algoRespondido && (
        <p className="text-xs text-ink-muted text-center -mt-4">
          Marca al menos una respuesta.
        </p>
      )}
    </form>
  );
}
