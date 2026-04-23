import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
});

await page.goto("http://localhost:3002/mapa", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: "/tmp/mapa-page.png", fullPage: false });

// Toggle del mapa en home
const p2 = await ctx.newPage();
p2.on("pageerror", (err) => console.log("P2 PAGEERROR:", err.message));
p2.on("console", (msg) => {
  if (msg.type() === "error") console.log("P2 CONSOLE ERROR:", msg.text());
});
await p2.goto("http://localhost:3002/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p2.waitForTimeout(3000);
await p2.locator('button:has-text("Mapa")').first().click();
await p2.waitForTimeout(5000);
await p2.screenshot({ path: "/tmp/home-map-toggle.png", fullPage: false });

await browser.close();
console.log("OK");
