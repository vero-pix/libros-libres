/**
 * Reglas del formulario de contacto, compartidas entre el cliente
 * (components/ui/ContactForm.tsx) y la API (app/api/contact/route.ts).
 *
 * 07-09-2026: entraba cualquier cosa ("hola", "asdasd", un correo pegado) y
 * cada una disparaba un correo a Vero. Mínimo 20 caracteres y al menos un
 * espacio: descarta la basura sin frenar a nadie que tenga algo que decir.
 */
export const CONTACTO_MIN_CARACTERES = 20;

/** Devuelve el motivo de descarte, o null si el mensaje pasa. */
export function motivoDescarteContacto(message: string): string | null {
  const m = message.trim();
  if (m.length < CONTACTO_MIN_CARACTERES) return `menos de ${CONTACTO_MIN_CARACTERES} caracteres`;
  if (!/\s/.test(m)) return "sin espacios";
  return null;
}

export const CONTACTO_MENSAJE_INVALIDO = `Cuéntanos un poco más: el mensaje necesita al menos ${CONTACTO_MIN_CARACTERES} caracteres.`;
