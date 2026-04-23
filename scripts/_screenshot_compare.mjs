import { chromium, devices } from "@playwright/test";

const browser = await chromium.launch();

// Desktop — above the fold + full
const ctx1 = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const p1 = await ctx1.newPage();
await p1.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 45000 });
await p1.waitForTimeout(3000);
await p1.screenshot({ path: "/tmp/home-NEW-fold.png", fullPage: false });

// full page with scroll
await p1.evaluate(async () => {
  await new Promise((res) => {
    let total = 0;
    const timer = setInterval(() => {
      window.scrollBy(0, 500);
      total += 500;
      if (total >= document.body.scrollHeight + 800) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        setTimeout(res, 500);
      }
    }, 150);
  });
});
await p1.waitForTimeout(1000);
await p1.screenshot({ path: "/tmp/home-NEW-full.png", fullPage: true });

// Mobile
const ctx2 = await browser.newContext({ ...devices["iPhone 13"] });
const p2 = await ctx2.newPage();
await p2.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 45000 });
await p2.waitForTimeout(3000);
await p2.screenshot({ path: "/tmp/home-NEW-mobile-fold.png", fullPage: false });

await p2.evaluate(async () => {
  await new Promise((res) => {
    let total = 0;
    const timer = setInterval(() => {
      window.scrollBy(0, 400);
      total += 400;
      if (total >= document.body.scrollHeight + 600) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        setTimeout(res, 500);
      }
    }, 150);
  });
});
await p2.waitForTimeout(800);
await p2.screenshot({ path: "/tmp/home-NEW-mobile-full.png", fullPage: true });

await browser.close();
console.log("OK");
