import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SELLER_TUSLIBROS = "2201d163-4423-4971-91f0-f6cebd00d1bd";

// Traer listings activos de TusLibros, ordenados por más probables de tener diferencia
const { data: listings } = await s
  .from("listings")
  .select(`id, price, status, book:books(title, author, isbn)`)
  .eq("seller_id", SELLER_TUSLIBROS)
  .eq("status", "active")
  .order("price", { ascending: false })
  .limit(30);

console.log(`Listings activos de TusLibros: ${listings?.length ?? 0}\n`);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
});

const results = [];

for (const l of listings ?? []) {
  const title = l.book?.title;
  const author = l.book?.author;
  if (!title) continue;

  const query = `${title} ${author ?? ""}`.trim();
  const encodedQuery = encodeURIComponent(query);

  let buscalibrePrice = null;
  try {
    const page = await ctx.newPage();
    await page.goto(`https://www.buscalibre.cl/libros/search?q=${encodedQuery}`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    // Buscar los primeros precios (CLP)
    const prices = await page.$$eval("*", (els) => {
      const re = /\$\s?[\d\.]{3,}/g;
      const found = [];
      for (const el of els) {
        const text = el.textContent ?? "";
        const matches = text.match(re);
        if (matches) {
          for (const m of matches.slice(0, 3)) {
            const num = Number(m.replace(/[^\d]/g, ""));
            if (num >= 2000 && num <= 200000) found.push(num);
          }
        }
        if (found.length > 20) break;
      }
      return found;
    });

    if (prices.length) {
      prices.sort((a, b) => a - b);
      buscalibrePrice = prices[0];
    }
    await page.close();
  } catch (e) {
    // ignore
  }

  const ours = l.price;
  const diff = buscalibrePrice ? ((buscalibrePrice - ours) / buscalibrePrice) * 100 : null;

  results.push({
    id: l.id.slice(0, 8),
    title: title.slice(0, 50),
    author: (author ?? "").slice(0, 30),
    ours,
    buscalibre: buscalibrePrice,
    diffPct: diff,
  });

  console.log(
    `  ${title.slice(0, 45).padEnd(45)} | tuslibros $${String(ours).padStart(6)} | buscalibre ${buscalibrePrice ? "$" + buscalibrePrice : "—"} | diff ${diff != null ? (diff > 0 ? "+" : "") + diff.toFixed(0) + "%" : "—"}`
  );
}

await browser.close();

console.log(`\n═══ TOP 10 MAYOR DIFERENCIA A FAVOR ═══`);
const ranked = results
  .filter((r) => r.buscalibre && r.diffPct != null && r.diffPct > 0)
  .sort((a, b) => b.diffPct - a.diffPct)
  .slice(0, 10);

for (const r of ranked) {
  console.log(
    `  +${r.diffPct.toFixed(0)}%  ${r.title.padEnd(50)}  tuslibros $${r.ours}  vs  buscalibre $${r.buscalibre}`
  );
}
