/**
 * Identificador de visitante, persistente entre sesiones.
 *
 * El `_tl_sid` que usa PageTracker vive en sessionStorage y muere al cerrar la
 * pestaña, así que sirve para medir una visita pero no para saber si alguien
 * volvió al día siguiente. Eso es justo lo que pregunta el experimento de
 * AdSense (11-09-2026): la apuesta es que quien sale por un anuncio ve que
 * afuera el libro está más caro y vuelve.
 *
 * Es un id anónimo: no se cruza con nombre ni correo, solo permite contar
 * "esta misma persona volvió". Si el navegador bloquea localStorage (modo
 * privado, cookies de terceros), devuelve null y simplemente no se mide.
 */

const CLAVE = "_tl_vid";

export function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let vid = localStorage.getItem(CLAVE);
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem(CLAVE, vid);
    }
    return vid;
  } catch {
    // Almacenamiento bloqueado: se pierde la medición, no la navegación.
    return null;
  }
}
