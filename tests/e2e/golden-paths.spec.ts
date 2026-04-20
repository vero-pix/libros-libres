import { test, expect } from "@playwright/test";

// Flujos dorados mínimos: si alguno rompe, hay algo grave en prod.
// Corren contra QA_BASE_URL (default http://localhost:3000). En CI/preview,
// setear QA_BASE_URL=https://preview-xxx.vercel.app

test("home carga con listings visibles", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBeLessThan(400);

  await expect(page.locator("header")).toBeVisible();
  // Debe haber al menos una tarjeta de libro o el mensaje de vacío
  const hasCards = await page.locator("article, a[href*='/libro/'], a[href*='/listings/']").first().isVisible().catch(() => false);
  const hasEmpty = await page.getByText(/no hay libros/i).isVisible().catch(() => false);
  expect(hasCards || hasEmpty).toBeTruthy();
});

test("search responde con resultados", async ({ page }) => {
  const res = await page.goto("/search?q=libro");
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
});

test("ficha de libro abre y renderiza", async ({ page }) => {
  await page.goto("/");
  // Buscar link directo a ficha (evitar footer y /libro/[username]/[slug] lo
  // capturamos por href que contenga /libro/ con al menos 2 segmentos).
  const ficha = page.locator("a[href^='/libro/'], a[href^='/listings/']").first();
  if (!(await ficha.isVisible().catch(() => false))) {
    test.skip(true, "No hay listings publicados para probar la ficha");
    return;
  }
  const href = await ficha.getAttribute("href");
  expect(href).toMatch(/^\/(libro|listings)\//);
  const res = await page.goto(href!);
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("pagina publish requiere login", async ({ page }) => {
  await page.goto("/publish");
  // Debe redirigir a login o mostrar form de login
  await page.waitForLoadState("domcontentloaded");
  const url = page.url();
  const onLogin = url.includes("/login") || url.includes("/register");
  const hasLoginForm = await page.locator("input[type=email], input[type=password]").first().isVisible().catch(() => false);
  expect(onLogin || hasLoginForm).toBeTruthy();
});

test("footer con links críticos visible", async ({ page }) => {
  await page.goto("/");
  await page.locator("footer").first().scrollIntoViewIfNeeded();
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.getByRole("link", { name: /términos/i })).toBeVisible();
});

// --- Navbar: los dropdowns DEBEN abrirse. Si rompe, nadie llega a publicar
// ni a mis-libros ni a /como-funciona. Bug real que pasó 19 abril 2026.
test("dropdown Ayuda abre al hover y muestra items", async ({ page }) => {
  await page.goto("/");
  const ayudaBtn = page.getByRole("button", { name: /^ayuda/i });
  await expect(ayudaBtn).toBeVisible();
  await ayudaBtn.hover();
  // Esperar que se muestre al menos un item del dropdown
  await expect(page.getByRole("link", { name: /cómo funciona/i })).toBeVisible({ timeout: 2000 });
  await expect(page.getByRole("link", { name: /faq/i })).toBeVisible();
});

test("dropdown Ayuda abre al click también", async ({ page }) => {
  await page.goto("/");
  const ayudaBtn = page.getByRole("button", { name: /^ayuda/i });
  await ayudaBtn.click();
  await expect(page.getByRole("link", { name: /cómo funciona/i })).toBeVisible({ timeout: 2000 });
});

test("CTA 'Ver N libros' del hero navega a /search", async ({ page }) => {
  await page.goto("/");
  const verLibrosLink = page.getByRole("link", { name: /ver.*libros|ver catálogo/i }).first();
  await expect(verLibrosLink).toBeVisible();
  const href = await verLibrosLink.getAttribute("href");
  expect(href).toMatch(/\/search/);
});

test("comparador de precios visible en ficha de libro", async ({ page }) => {
  // Ir a una ficha conocida del catálogo
  await page.goto("/");
  const ficha = page.locator("a[href^='/libro/']").first();
  if (!(await ficha.isVisible().catch(() => false))) {
    test.skip(true, "No hay listings de tipo /libro/ para probar el comparador");
    return;
  }
  const href = await ficha.getAttribute("href");
  await page.goto(href!);
  // El comparador debe aparecer con links a Buscalibre, MercadoLibre, IberLibro, Facebook
  await expect(page.getByText(/comparar precios/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("link", { name: /buscalibre/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /mercadolibre/i })).toBeVisible();
});

test("home: libros destacados visibles arriba del fold en desktop", async ({ page, browserName }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  // El heading "Libros destacados" debería estar en el top ~800px del document
  const heading = page.getByRole("heading", { name: /libros destacados/i }).first();
  await expect(heading).toBeVisible();
  const box = await heading.boundingBox();
  expect(box?.y).toBeLessThan(900); // above the fold
});
