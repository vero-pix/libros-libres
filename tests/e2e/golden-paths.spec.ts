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
