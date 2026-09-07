import { waSoporte } from "@/lib/soporte";

/**
 * Bloque de contacto del centro de ayuda. El dato sale de la constante de
 * WhatsApp de soporte: nunca escrito a mano.
 *
 * Solo WhatsApp por ahora (07-09-2026): el correo de soporte (VERO_INBOX)
 * apunta a un buzón personal mientras Google Workspace esté caído, y no
 * corresponde publicarlo. Cuando vuelva, agregar el botón de correo con
 * `mailto:${VERO_INBOX}`.
 */
export default function AyudaContacto({ texto }: { texto: string }) {
  return (
    <section className="mt-12 bg-white rounded-2xl border border-cream-dark shadow-sm px-6 py-8 text-center">
      <p className="text-xl font-bold text-ink mb-2">¿No encontraste la respuesta?</p>
      <p className="text-ink-muted mb-5">Escríbenos y te contestamos nosotros, no un bot.</p>
      <a
        href={waSoporte(texto)}
        target="_blank"
        rel="noopener"
        className="inline-block bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors"
      >
        Escribir por WhatsApp
      </a>
    </section>
  );
}
