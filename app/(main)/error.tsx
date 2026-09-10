"use client";

import ErrorScreen from "@/components/ui/ErrorScreen";

/**
 * El borde de error de `(main)`. Existe para que la pantalla de error conserve la
 * barra de navegación: el `error.tsx` de la raíz se renderiza fuera del layout que
 * la monta, y dejaba a la persona sin ninguna salida arriba.
 */
export default function MainError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen {...props} />;
}
