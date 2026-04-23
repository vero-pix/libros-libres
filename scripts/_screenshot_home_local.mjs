import { chromium, devices } from "@playwright/test";

const browser = await chromium.launch();

// Desktop
const ctx1 = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const p1 = await ctx1.newPage();
await p1.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 45000 });
await p1.waitForTimeout(2500);
await p1.screenshot({ path: "/tmp/home-above-fold-NEW.png", fullPage: false });
await p1.screenshot({ path: "/tmp/home-full-NEW.png", fullPage: true });

// Mobile
const ctx2 = await browser.newContext({ ...devices["iPhone 13"] });
const p2 = await ctx2.newPage();
await p2.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 45000 });
await p2.waitForTimeout(2500);
await p2.screenshot({ path: "/tmp/home-mobile-fold-NEW.png", fullPage: false });

await browser.close();
console.log("Screenshots NEW guardados en /tmp/");
