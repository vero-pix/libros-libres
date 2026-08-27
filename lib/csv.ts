/**
 * lib/csv.ts
 *
 * Parseo de los CSV de carga masiva. Existe porque el importador entendía
 * SOLO comas, y Excel en español (el que usan los vendedores) guarda con punto
 * y coma: el archivo entraba, cada fila se leía como un único campo, y las
 * 27 filas salían como "Falta título o autor" sin que nadie entendiera por qué.
 * Le pasó a Leonardo Auriol el 27-08-2026 con las dos versiones de su archivo.
 */

const DELIMITADORES = [",", ";", "\t"] as const;

/** Quita el BOM que Excel escribe al guardar en UTF-8. */
export function quitarBom(texto: string): string {
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
}

/**
 * El separador es el candidato que más veces aparece FUERA de comillas en el
 * encabezado. Se mira solo el encabezado porque no tiene datos libres que
 * ensucien la cuenta (un título con comas desbalancearía el conteo).
 */
export function detectarDelimitador(lineaEncabezado: string): string {
  let mejor = ",", max = 0;
  for (const d of DELIMITADORES) {
    let n = 0, enComillas = false;
    for (const ch of lineaEncabezado) {
      if (ch === '"') enComillas = !enComillas;
      else if (ch === d && !enComillas) n++;
    }
    if (n > max) { max = n; mejor = d; }
  }
  return mejor;
}

export function parseCsvLine(line: string, delimitador = ","): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimitador && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Igual que parseCsvLine, pero rescata la fila con las comillas mal puestas.
 * El exportador de Leonardo escribió `"Las tumbas,Clive Cussler,…,foto.jpg"`:
 * una comilla al principio y otra al final, envolviendo la línea COMPLETA. Son
 * pares, así que no basta con mirar la paridad — el síntoma es que sale un solo
 * campo donde el encabezado declara nueve.
 *
 * Se reintenta solo si faltan campos, que de por sí ya es una fila rota: una
 * bien formada (incluido `"a.jpg;b.jpg"`, que usa `;` dentro de comillas) da el
 * número correcto a la primera y nunca llega hasta acá.
 */
export function parseCsvLineTolerante(line: string, delimitador: string, columnas: number): string[] {
  const campos = parseCsvLine(line, delimitador);
  if (campos.length >= columnas || !line.includes('"')) return campos;

  const reintento = line.split(delimitador).map((c) => c.replace(/"/g, "").trim());
  return reintento.length > campos.length ? reintento : campos;
}
