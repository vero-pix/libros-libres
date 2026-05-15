import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = "https://tuslibros.cl";
const EMAIL = "vero@tuslibros.cl";
const PASS = "Ale234de";
const OUT = "/tmp/audit-screenshots";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
mkdirSync(OUT, { recursive: true });

const findings = [];
let step = 0;

function log(msg, type = "info") {
  const prefix = type === "error" ? "❌" : type === "warn" ? "⚠️" : "✅";
  findings.push({ type, msg });
  console.log(`${prefix} ${msg}`);
}

async function ss(page, name) {
  const path = `${OUT}/${String(++step).padStart(2, "0")}_${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

// ── 1. HOME ──────────────────────────────────────────────────────────────────
console.log("\n=== HOME ===");
await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
const homeTitle = await page.title();
log(`Title: "${homeTitle}"`);

const h1 = await page.locator("h1").first().textContent().catch(() => null);
log(`H1: "${h1?.trim() || "—"}"`, h1 ? "info" : "warn");

const bookCards = await page.locator('a[href*="/libro/"], a[href*="/listings/"]').count();
log(`Tarjetas de libros visibles: ${bookCards}`, bookCards > 3 ? "info" : "warn");

const imgs = await page.locator('img[src*="supabase"]').count();
log(`Imágenes Supabase cargadas: ${imgs}`, imgs > 0 ? "info" : "warn");

await ss(page, "home_desktop");

// ── 2. HOME MOBILE ───────────────────────────────────────────────────────────
console.log("\n=== HOME MOBILE ===");
{
  const mp = await ctx.newPage();
  await mp.setViewportSize({ width: 390, height: 844 });
  await mp.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  const mpath = `${OUT}/${String(++step).padStart(2,"0")}_home_mobile.png`;
  await mp.screenshot({ path: mpath });
  console.log(`  📸 ${mpath}`);
  const mobileMenu = await mp.locator('[class*="hamburger"], button[aria-label*="menu"], button[aria-label*="Menu"], button[aria-label*="Menú"]').first().isVisible().catch(() => false);
  log(`Menú hamburguesa mobile: ${mobileMenu}`, mobileMenu ? "info" : "warn");
  await mp.close();
}

// ── 3. BÚSQUEDA ──────────────────────────────────────────────────────────────
console.log("\n=== BÚSQUEDA ===");
await page.goto(BASE, { waitUntil: "networkidle" });
const searchBox = page.locator('input[type="search"], input[placeholder*="uscar"], input[placeholder*="libro"]').first();
const searchVisible = await searchBox.isVisible().catch(() => false);
log(`Campo de búsqueda visible: ${searchVisible}`, searchVisible ? "info" : "warn");
if (searchVisible) {
  await searchBox.fill("Neruda");
  await page.keyboard.press("Enter");
  await page.waitForLoadState("networkidle");
  const searchResults = await page.locator('a[href*="/libro/"], a[href*="/listings/"]').count();
  log(`Resultados búsqueda "Neruda": ${searchResults}`, searchResults > 0 ? "info" : "warn");
  await ss(page, "busqueda_neruda");
}

// ── 4. FICHA DE LIBRO ────────────────────────────────────────────────────────
console.log("\n=== FICHA DE LIBRO ===");
await page.goto(BASE + "/buscar?q=cien+años", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const firstBook = await page.locator('a[href*="/libro/"], a[href*="/listings/"]').nth(0).getAttribute("href").catch(() => null)
  || await page.locator('a').filter({ hasText: /libro|Libro/ }).first().getAttribute("href").catch(() => null);
if (firstBook) {
  const bookUrl = firstBook.startsWith("http") ? firstBook : BASE + firstBook;
  await page.goto(bookUrl, { waitUntil: "networkidle" });
  log(`URL ficha: ${page.url()}`);

  const price = await page.locator('[class*="price"], [class*="Price"]').first().textContent().catch(() => null);
  log(`Precio: "${price?.trim() || "—"}"`, price ? "info" : "warn");

  const buyBtn = await page.locator('button:has-text("Comprar"), button:has-text("carrito"), a:has-text("Comprar"), a:has-text("carrito"), button:has-text("Agregar")').first().isVisible().catch(() => false);
  log(`CTA compra visible: ${buyBtn}`, buyBtn ? "info" : "warn");

  const hasSidebar = await page.locator('aside').first().isVisible().catch(() => false);
  log(`Sidebar en ficha: ${hasSidebar}`, hasSidebar ? "warn" : "info");

  const hasAuditoria = await page.locator('text=/[Aa]uditor/').first().isVisible().catch(() => false);
  log(`Sección "Auditoría de Transparencia": ${hasAuditoria}`, hasAuditoria ? "info" : "warn");

  await ss(page, "ficha_libro");
} else {
  log("No se encontró link a ficha de libro en búsqueda", "warn");
}

// ── 5. LOGIN ─────────────────────────────────────────────────────────────────
console.log("\n=== LOGIN ===");
await page.goto(BASE + "/login", { waitUntil: "networkidle" });
await ss(page, "login_form");

await page.locator('input[type="email"]').first().fill(EMAIL);
await page.locator('input[type="password"]').first().fill(PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(2000);

const loggedIn = !page.url().includes("/login");
log(`Login exitoso → ${page.url()}`, loggedIn ? "info" : "error");
await ss(page, "post_login");

// ── 6. HOME LOGUEADO ─────────────────────────────────────────────────────────
console.log("\n=== HOME LOGUEADO ===");
await page.goto(BASE, { waitUntil: "networkidle" });
const avatarVisible = await page.locator('[class*="avatar"], [class*="Avatar"]').first().isVisible().catch(() => false);
log(`Avatar/perfil en navbar: ${avatarVisible}`, avatarVisible ? "info" : "warn");
await ss(page, "home_logueado");

// ── 7. PUBLICAR ──────────────────────────────────────────────────────────────
console.log("\n=== PUBLICAR ===");
await page.goto(BASE + "/publish", { waitUntil: "networkidle" });
log(`URL publish: ${page.url()}`);
const publishOk = !page.url().includes("/login");
log(`Formulario publish accesible: ${publishOk}`, publishOk ? "info" : "error");
if (publishOk) {
  const scanBtn = await page.locator('button:has-text("Escanear"), button:has-text("ISBN"), button:has-text("Buscar ISBN"), button:has-text("cámara"), button:has-text("Cámara")').first().isVisible().catch(() => false);
  log(`Botón escanear/ISBN visible: ${scanBtn}`, scanBtn ? "info" : "warn");
}
await ss(page, "publish_form");

// ── 8. MIS LIBROS ────────────────────────────────────────────────────────────
console.log("\n=== MIS LIBROS ===");
await page.goto(BASE + "/mis-libros", { waitUntil: "networkidle" });
log(`URL mis-libros: ${page.url()}`);
const myListings = await page.locator('article, [class*="listing"], [class*="Listing"]').count();
log(`Listings de Vero: ${myListings}`);
await ss(page, "mis_libros");

// ── 9. MIS VENTAS ────────────────────────────────────────────────────────────
console.log("\n=== MIS VENTAS ===");
await page.goto(BASE + "/mis-ventas", { waitUntil: "networkidle" });
log(`URL mis-ventas: ${page.url()}`);
const sales = await page.locator('[class*="order"], [class*="Order"], article').count();
log(`Órdenes/ventas visibles: ${sales}`);
await ss(page, "mis_ventas");

// ── 10. MIS PEDIDOS ──────────────────────────────────────────────────────────
console.log("\n=== MIS PEDIDOS ===");
await page.goto(BASE + "/mis-pedidos", { waitUntil: "networkidle" });
log(`URL mis-pedidos: ${page.url()}`);
await ss(page, "mis_pedidos");

// ── 11. PERFIL ───────────────────────────────────────────────────────────────
console.log("\n=== PERFIL ===");
await page.goto(BASE + "/perfil", { waitUntil: "networkidle" });
log(`URL perfil: ${page.url()}`);
const perfilFields = {
  nombre: await page.locator('input[name*="name"], input[name*="full"]').first().isVisible().catch(() => false),
  telefono: await page.locator('input[name*="phone"]').first().isVisible().catch(() => false),
};
log(`Campos perfil — nombre:${perfilFields.nombre} teléfono:${perfilFields.telefono}`);
await ss(page, "perfil");

// ── 12. CARRITO ──────────────────────────────────────────────────────────────
console.log("\n=== CARRITO ===");
await page.goto(BASE + "/carrito", { waitUntil: "networkidle" });
log(`URL carrito: ${page.url()}`);
await ss(page, "carrito");

// ── 13. ADMIN ────────────────────────────────────────────────────────────────
console.log("\n=== ADMIN ===");
await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
const adminOk = page.url().includes("/admin");
log(`Admin accesible: ${adminOk}`, adminOk ? "info" : "warn");
await ss(page, "admin");

// ── 14. MOBILE FICHA ─────────────────────────────────────────────────────────
console.log("\n=== MOBILE FICHA ===");
if (firstBook) {
  const mp2 = await ctx.newPage();
  await mp2.setViewportSize({ width: 390, height: 844 });
  const bookUrl2 = firstBook.startsWith("http") ? firstBook : BASE + firstBook;
  await mp2.goto(bookUrl2, { waitUntil: "networkidle", timeout: 30000 });
  const mp2path = `${OUT}/${String(++step).padStart(2,"0")}_ficha_mobile.png`;
  await mp2.screenshot({ path: mp2path });
  console.log(`  📸 ${mp2path}`);
  await mp2.close();
}

// ── RESUMEN FINAL ────────────────────────────────────────────────────────────
console.log("\n=== ERRORES DE CONSOLA JS ===");
if (consoleErrors.length === 0) {
  log("Sin errores de consola");
} else {
  consoleErrors.slice(0, 10).forEach(e => log(`Console: ${e}`, "error"));
}

console.log("\n╔══════════════════════════════════════════╗");
console.log("║         DIAGNÓSTICO TUSLIBROS.CL         ║");
console.log("╚══════════════════════════════════════════╝");
const errors = findings.filter(f => f.type === "error");
const warns  = findings.filter(f => f.type === "warn");
const oks    = findings.filter(f => f.type === "info");
console.log(`✅ OK:        ${oks.length}`);
console.log(`⚠️  Warnings: ${warns.length}`);
console.log(`❌ Errores:   ${errors.length}`);
if (errors.length) { console.log("\nERRORES:"); errors.forEach(e => console.log(`  ❌ ${e.msg}`)); }
if (warns.length)  { console.log("\nWARNINGS:"); warns.forEach(w => console.log(`  ⚠️  ${w.msg}`)); }
console.log(`\n📸 Screenshots: ${OUT}/`);

await browser.close();
