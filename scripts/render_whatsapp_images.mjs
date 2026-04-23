import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const htmlPath = `file://${path.join(root, "docs/whatsapp_universitarios.html")}`;
const outDir = path.join(root, "docs");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(htmlPath, { waitUntil: "networkidle" });
await page.waitForTimeout(800); // fonts

for (const id of ["card-a", "card-b"]) {
  const el = await page.$(`#${id}`);
  if (!el) { console.error(`missing ${id}`); continue; }
  const file = path.join(outDir, `whatsapp_universitarios_${id.replace("card-", "")}.png`);
  await el.screenshot({ path: file });
  console.log(`✓ ${file}`);
}

await browser.close();
