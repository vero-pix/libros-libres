import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));
page.on("console", (msg) => {
  console.log(`[${msg.type()}]`, msg.text());
});

await page.goto("http://localhost:3002/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(4000);

const btn = page.locator('button:has-text("Ver en mapa")');
await btn.first().scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

console.log("--- antes del click ---");
await btn.first().click();
console.log("--- despues del click ---");
await page.waitForTimeout(2500);

const mapCanvas = await page.locator('.mapboxgl-canvas').count();
const errorBoundary = await page.locator('text=El mapa no pudo cargar').count();
console.log("mapbox canvas:", mapCanvas, "| error boundary:", errorBoundary);

await page.screenshot({ path: "/tmp/map-toggle-test2.png", fullPage: false });
await browser.close();
