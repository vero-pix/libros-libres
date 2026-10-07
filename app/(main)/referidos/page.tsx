import { permanentRedirect } from "next/navigation";

/**
 * El programa de referidos salió el 07-10-2026 (decisión de Vero): prometía
 * "descuentos en despacho" y no había nada que los entregara. La ruta queda
 * como redirección permanente a la portada para no romper enlaces viejos.
 */
export default function ReferidosPage() {
  permanentRedirect("/");
}
