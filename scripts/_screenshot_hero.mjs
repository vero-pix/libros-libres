import { chromium, devices } from "@playwright/test";

const browser = await chromium.launch();

const ctx1 = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const p1 = await ctx1.newPage();
await p1.goto("http://localhost:3002/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p1.waitForTimeout(3000);
await p1.screenshot({ path: "/tmp/hero-new-desktop.png", fullPage: false });

const ctx2 = await browser.newContext({ ...devices["iPhone 13"] });
const p2 = await ctx2.newPage();
await p2.goto("http://localhost:3002/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p2.waitForTimeout(3000);
await p2.screenshot({ path: "/tmp/hero-new-mobile.png", fullPage: false });

await browser.close();
console.log("OK");
