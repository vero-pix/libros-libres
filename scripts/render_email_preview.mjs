import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const htmlPath = `file://${path.join(root, "docs/email_testimonio_zdravko.html")}`;
const out = path.join(root, "docs/email_testimonio_zdravko_preview.png");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 700, height: 2000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(htmlPath, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`✓ ${out}`);
