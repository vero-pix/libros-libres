/**
 * Traduce al español los errores de contraseña que devuelve Supabase Auth.
 *
 * Nació el 21-09-2026 con Rodrigo Cumsille: eligió una contraseña que está en
 * las filtraciones públicas que revisa Supabase, el PUT /user devolvió 422
 * "Password is known to be weak and easy to guess" y la pantalla le mostraba
 * "No pudimos actualizar tu contraseña. Intenta de nuevo." Lo intentó tres
 * veces sin manera de saber qué corregir y nos escribió creyendo que el sitio
 * estaba roto. El error venía del servidor con el motivo adentro; solo no lo
 * mostrábamos.
 */
export function mensajeErrorClave(mensajeOriginal: string): string {
  const m = mensajeOriginal.toLowerCase();

  if (m.includes("known to be weak") || m.includes("easy to guess") || m.includes("pwned")) {
    return "Esa contraseña aparece en filtraciones públicas de otros sitios, así que no la podemos aceptar. Elige otra distinta — mezclar dos o tres palabras que no vayan juntas funciona bien.";
  }

  if (m.includes("should be different") || m.includes("same as the old")) {
    return "La contraseña nueva tiene que ser distinta de la anterior.";
  }

  const largoMinimo = m.match(/at least (\d+) characters/);
  if (largoMinimo) {
    return `La contraseña debe tener al menos ${largoMinimo[1]} caracteres.`;
  }

  if (m.includes("password") && m.includes("characters")) {
    return "La contraseña no cumple los requisitos mínimos. Prueba con una más larga.";
  }

  if (m.includes("user already registered")) {
    return "Ya existe una cuenta con ese correo.";
  }

  return mensajeOriginal;
}
