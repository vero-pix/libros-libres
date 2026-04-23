import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (err) => errors.push(`PAGEERROR: ${err.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text()}`);
});
page.on("requestfailed", (req) => errors.push(`REQFAIL: ${req.url()} — ${req.failure()?.errorText}`));
page.on("response", (res) => {
  if (res.status() >= 400) errors.push(`HTTP ${res.status()}: ${res.url()}`);
});

console.log("=== /mapa en producción ===");
await page.goto("https://tuslibros.cl/mapa", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: "/tmp/prod-mapa.png", fullPage: false });

console.log("=== errores ===");
errors.forEach(e => console.log(e));

await browser.close();
