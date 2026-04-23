import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const VIDEO_DIR = "/tmp/tuslibros-videos";
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

const ctx = await browser.newContext({
  viewport: { width: 1080, height: 1080 },
  deviceScaleFactor: 2,
  recordVideo: {
    dir: VIDEO_DIR,
    size: { width: 1080, height: 1080 },
  },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
});
const page = await ctx.newPage();

// helper para movimientos suaves del mouse (visible en el cursor durante el video)
const mouseMove = async (x, y, steps = 25) => {
  await page.mouse.move(x, y, { steps });
};

// SCENE 1 — Home (2.5s)
await page.goto("https://tuslibros.cl/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await mouseMove(540, 540);

// SCENE 2 — Scroll para ver libros destacados (2s)
await page.evaluate(() => window.scrollTo({ top: 350, behavior: "smooth" }));
await page.waitForTimeout(2000);

// SCENE 3 — Abrir ficha de Camino al Futuro (3s)
await page.goto("https://tuslibros.cl/libro/vero/camino-al-futuro", {
  waitUntil: "networkidle",
  timeout: 30000,
});
await page.waitForTimeout(2500);

// SCENE 4 — Resaltar precio con un hover ($30.000) (1.5s)
await page.evaluate(() => window.scrollTo({ top: 100, behavior: "smooth" }));
await page.waitForTimeout(800);
await mouseMove(600, 400, 40);
await page.waitForTimeout(1500);

// SCENE 5 — Scroll al comparador (2s)
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll("*")).find((n) =>
    /comparar precios/i.test(n.textContent ?? "")
  );
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
});
await page.waitForTimeout(2000);

// SCENE 6 — Hover sobre botón Buscalibre (1.5s)
try {
  const buscalibreBtn = page.getByRole("link", { name: /buscalibre/i }).first();
  await buscalibreBtn.hover({ timeout: 5000 });
  await page.waitForTimeout(1500);
} catch (e) {
  await mouseMove(500, 540);
  await page.waitForTimeout(1500);
}

// SCENE 7 — Transición manual a Buscalibre con el mismo libro (4s)
await page.goto(
  "https://www.buscalibre.cl/libros/search?q=camino+al+futuro+bill+gates",
  { waitUntil: "domcontentloaded", timeout: 30000 }
);
await page.waitForTimeout(4000);

// SCENE 8 — Scroll leve para mostrar precios (2s)
await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
await page.waitForTimeout(2500);

// SCENE 9 — Cierre: vuelta a tuslibros (2s)
await page.goto("https://tuslibros.cl/libro/vero/camino-al-futuro", {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});
await page.waitForTimeout(2000);

await ctx.close();
await browser.close();

// Mover el video a un nombre legible
const files = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
console.log(`\nVideos generados en ${VIDEO_DIR}:`);
for (const f of files) {
  const newPath = path.join(VIDEO_DIR, "comparador-camino-al-futuro.webm");
  if (f !== "comparador-camino-al-futuro.webm") {
    fs.renameSync(path.join(VIDEO_DIR, f), newPath);
    console.log(`  ${newPath}`);
  }
}
