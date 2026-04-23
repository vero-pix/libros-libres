import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

// /search con un query
await page.goto("http://localhost:3001/search?q=libro", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/search-grid.png", fullPage: false });

// Click en botón Mapa
const mapBtn = page.getByRole("button", { name: /^mapa/i }).first();
if (await mapBtn.isVisible().catch(() => false)) {
  await mapBtn.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/tmp/search-map.png", fullPage: false });
  console.log("OK — grid y mapa tomados");
} else {
  console.log("⚠️ No encontré botón Mapa en /search");
}

await browser.close();
