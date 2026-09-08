/**
 * Chequeo de configuración que corre ANTES del build (prebuild).
 *
 * Existe por un caso concreto: VERO_INBOX_EMAIL estuvo creada pero vacía en
 * producción del 4 al 8 de septiembre de 2026, y como una cadena vacía cae al
 * fallback sin hacer ruido, cinco días de respuestas se fueron a un buzón
 * suspendido. Una variable vacía es siempre un error de configuración: acá el
 * build se cae en vez de desplegar el problema.
 *
 * Ausente NO es error: cuando Google Workspace vuelva, Vero borra la variable
 * y el sitio debe seguir compilando.
 */
const problemas = [];

const inbox = process.env.VERO_INBOX_EMAIL;
if (inbox !== undefined) {
  const v = inbox.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    problemas.push(
      `VERO_INBOX_EMAIL está definida pero no es un correo usable (valor entre ` +
        `comillas: "${v}"). Los reply-to caerían en vero@tuslibros.cl, suspendida.\n` +
        `   Arreglar: vercel env add VERO_INBOX_EMAIL production`
    );
  }
}

if (problemas.length) {
  console.error("\n✖ Configuración inválida, no se compila:\n");
  problemas.forEach((p) => console.error("   " + p + "\n"));
  process.exit(1);
}
