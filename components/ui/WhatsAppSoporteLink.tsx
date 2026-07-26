"use client";

import { usePathname } from "next/navigation";
import { trackEvent } from "@/utils/analytics";

/**
 * El WhatsApp del header es SOPORTE, no un contacto comercial con un vendedor.
 * Mezclarlos hacía imposible leer los datos: un clic acá es una consulta a Vero,
 * no alguien eligiendo la vía directa para comprar un libro.
 *
 * El Navbar es server component, así que la medición vive en este wrapper.
 * No cambia nada visible: renderiza el mismo <a> con las mismas clases.
 */
export default function WhatsAppSoporteLink({
  href,
  className,
  title,
  ariaLabel,
  children,
}: {
  href: string;
  className?: string;
  title?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const medir = () => {
    try {
      trackEvent("click_whatsapp_soporte", { pagina_origen: pathname || "/" });
    } catch {
      /* si la analítica falla, el clic sigue igual */
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={medir}
      className={className}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
