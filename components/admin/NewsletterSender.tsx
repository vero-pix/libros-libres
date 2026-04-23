"use client";

import { useState } from "react";

const NEWSLETTER_TEMPLATES = [
  {
    name: "Lanzamiento — El Uber de los libros",
    subject: "tuslibros.cl ya está en vivo — el Uber de los libros",
    html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #faf8f4;">
  <h1 style="font-size: 28px; color: #1a1a2e; margin-bottom: 4px;">tuslibros.cl</h1>
  <p style="font-size: 13px; color: #d4a017; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">El Uber de los libros</p>

  <p style="font-size: 16px; color: #333; line-height: 1.7;">
    Hay millones de libros acumulando polvo en casas de Chile. Cada estantería es una librería que nadie puede ver.
  </p>
  <p style="font-size: 16px; color: #333; line-height: 1.7;">
    <strong>tuslibros.cl</strong> la hace visible. Hoy lanzamos oficialmente el marketplace donde puedes comprar, vender y arrendar libros cerca de ti.
  </p>

  <div style="background: #fff; border: 1px solid #ede7db; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <p style="font-size: 14px; color: #666; margin: 0 0 12px 0; font-style: italic;">"Tengo una colección de García Márquez que ya leí tres veces. Me encanta la idea de que alguien cerca de mi casa pueda disfrutarlos."</p>
    <p style="font-size: 13px; color: #999; margin: 0;">— Lectora en Santiago</p>
  </div>

  <h2 style="font-size: 18px; color: #1a1a2e; margin: 28px 0 12px;">¿Cómo funciona?</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px 12px; font-size: 14px; color: #333; border-bottom: 1px solid #f0ebe3;"><strong>1.</strong> Escanea el ISBN de tu libro</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; font-size: 14px; color: #333; border-bottom: 1px solid #f0ebe3;"><strong>2.</strong> Se publica con portada, sinopsis y tu ubicación</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; font-size: 14px; color: #333; border-bottom: 1px solid #f0ebe3;"><strong>3.</strong> Lectores cercanos lo encuentran y lo compran</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; font-size: 14px; color: #333;"><strong>4.</strong> Pago seguro con MercadoPago, envío o encuentro en persona</td>
    </tr>
  </table>

  <div style="background: #fff; border: 1px solid #ede7db; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <p style="font-size: 14px; color: #666; margin: 0 0 12px 0; font-style: italic;">"Busco novelas latinoamericanas de segunda mano. Odio pagar precio de librería por un libro que alguien ya leyó y tiene guardado."</p>
    <p style="font-size: 13px; color: #999; margin: 0;">— Lector en Providencia</p>
  </div>

  <h2 style="font-size: 18px; color: #1a1a2e; margin: 28px 0 12px;">Lo que nos hace diferentes</h2>
  <ul style="font-size: 14px; color: #333; line-height: 1.8; padding-left: 20px;">
    <li><strong>Cercanía primero</strong> — el libro más cerca de ti aparece primero</li>
    <li><strong>Arrienda, no solo compra</strong> — lee, devuelve, ahorra</li>
    <li><strong>Pago seguro</strong> — MercadoPago protege cada transacción</li>
    <li><strong>Publicar es gratis</strong> — siempre</li>
  </ul>

  <div style="text-align: center; margin: 32px 0;">
    <a href="https://tuslibros.cl" style="display: inline-block; background: #d4a017; color: #fff; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px;">Explorar tuslibros.cl</a>
  </div>

  <p style="font-size: 13px; color: #999; text-align: center; margin-top: 32px; border-top: 1px solid #ede7db; padding-top: 16px;">
    Recibiste este email porque te suscribiste al newsletter de tuslibros.cl.<br>
    <a href="https://tuslibros.cl" style="color: #d4a017;">tuslibros.cl</a> — Donde los libros encuentran nuevos lectores
  </p>
</div>`,
  },
];

export default function NewsletterSender({ subscriberCount }: { subscriberCount: number }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  async function handleSend() {
    if (!confirm("¿Enviar newsletter a " + subscriberCount + " suscriptores?")) return;
    setSending(true);
    setResult(null);

    const template = NEWSLETTER_TEMPLATES[selectedTemplate];
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: template.subject, html: template.html }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error ?? "Error al enviar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setSending(false);
    }
  }

  const template = NEWSLETTER_TEMPLATES[selectedTemplate];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-ink text-lg mb-4">Enviar Newsletter</h3>

      <div className="mb-4">
        <label className="text-xs text-gray-500 font-medium block mb-1">Template</label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(Number(e.target.value))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          {NEWSLETTER_TEMPLATES.map((t, i) => (
            <option key={i} value={i}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500 font-medium block mb-1">Asunto</label>
        <p className="text-sm text-ink bg-gray-50 rounded-lg px-3 py-2">{template.subject}</p>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500 font-medium block mb-1">Preview</label>
        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
          <div dangerouslySetInnerHTML={{ __html: template.html }} />
        </div>
      </div>

      {result && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          Enviados: {result.sent} | Fallidos: {result.failed}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
      >
        {sending ? "Enviando..." : "Enviar a " + subscriberCount + " suscriptores"}
      </button>
    </div>
  );
}
