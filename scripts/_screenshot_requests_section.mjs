import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(2000);

// Scroll a la sección de "Se busca"
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll("*")).find((n) =>
    /economía inversa/i.test(n.textContent ?? "")
  );
  if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
});
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/se-busca-section.png", fullPage: false });

// Y la página /solicitudes
await page.goto("http://localhost:3001/solicitudes", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: "/tmp/solicitudes-page.png", fullPage: false });

await browser.close();
console.log("OK");
