import { chromium } from '@playwright/test';
const BASE = 'https://tuslibros.cl';
const seen = new Set();
const broken = [];
const queue = ['/'];
const MAX = 60;

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

while (queue.length && seen.size < MAX) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  try {
    const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const status = res?.status() ?? 0;
    if (status >= 400) {
      broken.push({ path, status });
      console.log(`BROKEN ${status} ${path}`);
      continue;
    }
    const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
    for (const h of hrefs) {
      if (!h) continue;
      if (h.startsWith('#') || h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('javascript:')) continue;
      let p = h;
      if (h.startsWith('http')) {
        if (!h.startsWith(BASE)) continue;
        p = h.slice(BASE.length) || '/';
      }
      if (!p.startsWith('/')) continue;
      // skip external-heavy or dynamic-heavy paths
      if (p.startsWith('/api/')) continue;
      const clean = p.split('#')[0];
      if (!seen.has(clean) && !queue.includes(clean)) queue.push(clean);
    }
  } catch (e) {
    broken.push({ path, error: String(e).slice(0, 120) });
    console.log(`ERROR ${path} ${String(e).slice(0,80)}`);
  }
}

console.log(`\n=== RESUMEN ===`);
console.log(`visitadas=${seen.size} rotas=${broken.length}`);
if (broken.length) console.log(JSON.stringify(broken, null, 2));
await browser.close();
