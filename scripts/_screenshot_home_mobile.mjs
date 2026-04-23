import { chromium, devices } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({
  ...devices["iPhone 13"],
});
const page = await context.newPage();

await page.goto("https://tuslibros.cl/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);

await page.screenshot({
  path: "/tmp/home-mobile-fold.png",
  fullPage: false,
});

console.log("Mobile screenshot: /tmp/home-mobile-fold.png");
await browser.close();
