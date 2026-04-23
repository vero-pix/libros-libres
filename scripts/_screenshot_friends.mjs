import { chromium, devices } from "@playwright/test";

const browser = await chromium.launch();

const ctx1 = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const p1 = await ctx1.newPage();
await p1.goto("http://localhost:3002/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p1.waitForTimeout(3500);

const loc = p1.locator('section:has-text("Amigos de la casa")');
await loc.scrollIntoViewIfNeeded();
await p1.waitForTimeout(300);
await loc.screenshot({ path: "/tmp/sponsor-desktop-section.png" });

await browser.close();
console.log("OK");
