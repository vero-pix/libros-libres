// Check which URLs in the live sitemap return 3xx (redirects) — Google
// flagged them as "Página con redirección" y no las indexa.
// NO ejecuta JS, sólo HEAD requests: no impacta GA4.

const res = await fetch("https://tuslibros.cl/sitemap.xml");
const xml = await res.text();
const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1]);
console.log(`Total URLs en sitemap: ${urls.length}\n`);

const buckets = { ok: [], redirect: [], gone: [], notfound: [], other: [] };

// Concurrency limit
const concurrency = 10;
let i = 0;
async function worker() {
  while (i < urls.length) {
    const idx = i++;
    const url = urls[idx];
    try {
      const r = await fetch(url, { method: "HEAD", redirect: "manual" });
      if (r.status >= 300 && r.status < 400) {
        const location = r.headers.get("location");
        buckets.redirect.push({ url, status: r.status, to: location });
      } else if (r.status === 410) {
        buckets.gone.push({ url, status: r.status });
      } else if (r.status === 404) {
        buckets.notfound.push({ url, status: r.status });
      } else if (r.status >= 200 && r.status < 300) {
        buckets.ok.push({ url, status: r.status });
      } else {
        buckets.other.push({ url, status: r.status });
      }
    } catch (e) {
      buckets.other.push({ url, status: "error", err: String(e).slice(0, 80) });
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, () => worker()));

console.log(`✅ 2xx OK:       ${buckets.ok.length}`);
console.log(`↪  3xx Redirect: ${buckets.redirect.length}`);
console.log(`⛔ 404:          ${buckets.notfound.length}`);
console.log(`🗑  410 Gone:    ${buckets.gone.length}`);
console.log(`❓ Otros:        ${buckets.other.length}`);

if (buckets.redirect.length) {
  console.log(`\n── URLs con REDIRECT (causa del warning de GSC) ──`);
  for (const r of buckets.redirect.slice(0, 30)) {
    console.log(`  ${r.status}  ${r.url}`);
    console.log(`         →  ${r.to}`);
  }
  if (buckets.redirect.length > 30) console.log(`  ...+${buckets.redirect.length - 30} más`);
}

if (buckets.notfound.length) {
  console.log(`\n── URLs 404 en sitemap (también a limpiar) ──`);
  for (const r of buckets.notfound.slice(0, 10)) console.log(`  ${r.url}`);
}
