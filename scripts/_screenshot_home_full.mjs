import { chromium, devices } from "@playwright/test";

const browser = await chromium.launch();

// Desktop full page
const ctx1 = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const p1 = await ctx1.newPage();
await p1.goto("https://tuslibros.cl/", { waitUntil: "networkidle", timeout: 45000 });
await p1.waitForTimeout(3500);
// Scroll hasta el fondo para que lazy-loaded images carguen
await p1.evaluate(async () => {
  await new Promise((res) => {
    let total = 0;
    const step = 500;
    const timer = setInterval(() => {
      window.scrollBy(0, step);
      total += step;
      if (total >= document.body.scrollHeight + 1000) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        setTimeout(res, 500);
      }
    }, 150);
  });
});
await p1.waitForTimeout(1500);
await p1.screenshot({ path: "/tmp/home-full-desktop.png", fullPage: true });
console.log("Desktop full: /tmp/home-full-desktop.png");

// Mobile full page
const ctx2 = await browser.newContext({ ...devices["iPhone 13"] });
const p2 = await ctx2.newPage();
await p2.goto("https://tuslibros.cl/", { waitUntil: "networkidle", timeout: 45000 });
await p2.waitForTimeout(3500);
await p2.evaluate(async () => {
  await new Promise((res) => {
    let total = 0;
    const step = 400;
    const timer = setInterval(() => {
      window.scrollBy(0, step);
      total += step;
      if (total >= document.body.scrollHeight + 800) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        setTimeout(res, 500);
      }
    }, 150);
  });
});
await p2.waitForTimeout(1500);
await p2.screenshot({ path: "/tmp/home-full-mobile.png", fullPage: true });
console.log("Mobile full: /tmp/home-full-mobile.png");

await browser.close();
