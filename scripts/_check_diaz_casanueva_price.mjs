import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
});

const sites = [
  {
    name: "Buscalibre",
    url: "https://www.buscalibre.cl/libros/search?q=humberto+diaz+casanueva",
  },
  {
    name: "MercadoLibre",
    url: "https://listado.mercadolibre.cl/humberto-diaz-casanueva-antologia",
  },
  {
    name: "IberLibro",
    url: "https://www.iberlibro.com/servlet/SearchResults?kn=humberto+diaz+casanueva+antologia",
  },
];

for (const s of sites) {
  console.log(`\n── ${s.name} ──`);
  const page = await ctx.newPage();
  try {
    await page.goto(s.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);

    // Scrape textos visibles y extraer precios en CLP
    const text = await page.evaluate(() => document.body.innerText);
    // Buscar precios CLP ($ seguido de miles) y EUR
    const clpMatches = Array.from(text.matchAll(/\$\s?([\d\.]{3,})/g), (m) => m[1]);
    const eurMatches = Array.from(text.matchAll(/€\s?([\d,\.]+)/g), (m) => m[1]);

    const clp = clpMatches
      .map((m) => Number(m.replace(/[^\d]/g, "")))
      .filter((n) => n >= 3000 && n <= 200000);
    const eur = eurMatches
      .map((m) => Number(m.replace(/[,]/g, "").replace(/\./g, "")))
      .filter((n) => n >= 500 && n <= 50000); // céntimos o EUR

    // Títulos para contexto
    const titleMatches = text.match(/ANTOLOGIA POETICA|Antología poética|HUMBERTO DIAZ CASANUEVA|Humberto Díaz/gi);
    const hasMatch = titleMatches && titleMatches.length > 0;

    if (!hasMatch) {
      console.log("  (no parece tener resultados de Díaz-Casanueva)");
    } else {
      console.log(`  matches del autor: ${titleMatches.length}`);
      if (clp.length) {
        clp.sort((a, b) => a - b);
        console.log(`  rango CLP: $${clp[0].toLocaleString("es-CL")} – $${clp[clp.length - 1].toLocaleString("es-CL")}`);
        console.log(`  mediana CLP: $${clp[Math.floor(clp.length / 2)].toLocaleString("es-CL")}`);
      }
      if (eur.length) {
        eur.sort((a, b) => a - b);
        console.log(`  rango EUR: €${eur[0]} – €${eur[eur.length - 1]}  (aprox CLP: $${(eur[0] * 1000).toLocaleString("es-CL")} – $${(eur[eur.length - 1] * 1000).toLocaleString("es-CL")})`);
      }
    }
  } catch (e) {
    console.log("  error:", String(e).slice(0, 100));
  }
  await page.close();
}

await browser.close();
