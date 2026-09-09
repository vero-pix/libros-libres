/** Chequeo puntual: ¿Shipit está cotizando hoy, y desde qué comunas? */
import fs from "fs";
import path from "path";
for (const line of fs.readFileSync(path.resolve(".env.local"), "utf-8").split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}

async function main() {
  const { getShipitQuotes, estimateBookPackageSize } = await import("../lib/shipit");
  const sizes = estimateBookPackageSize(1);
  console.log("medidas de 1 libro:", JSON.stringify(sizes));

  const pares: [string, string][] = [
    ["Providencia", "Nunoa"],
    ["Providencia", "Concepcion"],
    ["Santiago", "Providencia"],
    ["San Miguel", "Providencia"],
    ["Valparaiso", "Providencia"],
    ["Copiapo", "Providencia"],
    ["San Antonio", "Providencia"],
  ];

  for (const [o, d] of pares) {
    const q: any = await getShipitQuotes(o, d, sizes.weight, sizes.height, sizes.width, sizes.length);
    const ok = (q.quotes?.length ?? 0) > 0;  // ShipitQuoteResult no tiene .ok
    const detalle = ok
      ? "OK · " + q.quotes.slice(0, 2).map((x: any) => `${x.courier} $${x.price}`).join(" · ")
      : "SIN SERVICIO · " + (q.reason ?? "");
    console.log(`${(o + " → " + d).padEnd(28)} ${detalle}`);
  }
}

main();
