/**
 * Detecta nombres generados al azar por bots de registro.
 *
 * Los 7 bots detectados hasta el 28 jul 2026 entraron todos por correo, todos
 * confirmaron el email, y ninguno publicó jamás. La firma común es el nombre:
 * una sola palabra larga de caracteres al azar, del tipo "rTrOVifemKCJSUegA" o
 * "ryhwmjwobhnevzbkmht". Un humano escribe "María García" o, como mucho, "Karla".
 *
 * Se aplica solo a nombres de UNA palabra y con 12+ caracteres, para no
 * castigar nombres reales cortos ni compuestos.
 */
export function nombreSospechoso(nombre: string): boolean {
  const n = (nombre ?? "").trim();
  if (!n) return false;
  if (n.includes(" ")) return false; // "María García" — pasa siempre
  if (n.length < 12) return false;   // "Karla", "Michael" — pasan

  const soloLetras = n.replace(/[^a-záéíóúüñ]/gi, "");
  if (soloLetras.length < 12) return false;

  // 1. Mayúsculas salpicadas en medio de la palabra: "rTrOVifemKCJSUegA"
  const mayusInternas = (n.slice(1).match(/[A-ZÁÉÍÓÚÑ]/g) ?? []).length;
  if (mayusInternas >= 3) return true;

  // 2. Proporción de vocales fuera del rango del español (~35-50%).
  //    "ryhwmjwobhnevzbkmht" tiene 3 vocales en 19 letras: 16%.
  const vocales = (soloLetras.match(/[aeiouáéíóúü]/gi) ?? []).length;
  const ratio = vocales / soloLetras.length;
  if (ratio < 0.25) return true;

  return false;
}
