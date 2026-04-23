import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

await page.goto("https://tuslibros.cl/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);

// Above the fold — primera pantalla de 900px
await page.screenshot({
  path: "/tmp/home-above-fold.png",
  fullPage: false,
});

// Pantalla completa con scroll
await page.screenshot({
  path: "/tmp/home-full.png",
  fullPage: true,
});

console.log("Screenshots guardados:");
console.log("  /tmp/home-above-fold.png (1440×900, sin scroll)");
console.log("  /tmp/home-full.png (página completa)");

await browser.close();
