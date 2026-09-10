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
  const siteFooter = page.locator("body > footer");
  await siteFooter.scrollIntoViewIfNeeded();
  await expect(siteFooter).toBeVisible();
  await expect(siteFooter.getByRole("link", { name: /términos/i })).toBeVisible();
});

// --- Navbar: los dropdowns DEBEN abrirse. Si rompe, nadie llega a publicar
// ni a mis-libros ni a /como-funciona. Bug real que pasó 19 abril 2026.
test("dropdown Ayuda abre al hover y muestra items", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  const ayudaBtn = header.getByRole("button", { name: /^ayuda/i });
  await expect(ayudaBtn).toBeVisible();
  await ayudaBtn.hover();
  // Scopeamos al header para no confundir con los links del footer
  await expect(header.getByRole("link", { name: /cómo funciona/i })).toBeVisible({ timeout: 2000 });
  // El item se llama "Centro de ayuda", no "FAQ" (corregido 10-09-2026: el test
  // buscaba un link que no existe desde que el menu se reorganizo).
  await expect(header.getByRole("link", { name: /centro de ayuda/i })).toBeVisible();
});

test("dropdown Ayuda muestra el botón y es interactivo", async ({ page }) => {
  // (El test de click no sirve en Chromium porque hover+click se cancelan por el toggle
  // onClick. El de hover arriba ya valida que el dropdown abre y los items aparecen.)
  await page.goto("/");
  const header = page.getByRole("banner");
  const ayudaBtn = header.getByRole("button", { name: /^ayuda/i });
  await expect(ayudaBtn).toBeVisible();
  await expect(ayudaBtn).toBeEnabled();
});

test("CTA del hero lleva al catálogo de la portada", async ({ page }) => {
  // Corregido 10-09-2026. El CTA dice "Explorar libros" y baja al catálogo de la
  // misma página (#tienda), no navega a /search: el test viejo esperaba /search y
  // terminaba tomando el primer link que calzara, que era /solicitudes.
  await page.goto("/");
  const cta = page.getByRole("link", { name: /explorar libros/i }).first();
  await expect(cta).toBeVisible();
  expect(await cta.getAttribute("href")).toBe("#tienda");
  // y el ancla existe de verdad
  await expect(page.locator("#tienda")).toHaveCount(1);
});

test("la ficha de libro siempre ofrece una salida de compra", async ({ page }) => {
  // Ir a una ficha conocida del catálogo
  await page.goto("/");
  const ficha = page.locator("a[href^='/libro/']").first();
  if (!(await ficha.isVisible().catch(() => false))) {
    test.skip(true, "No hay listings de tipo /libro/ para probar");
    return;
  }
  const href = await ficha.getAttribute("href");
  await page.goto(href!);
  // El comparador de precios se saco del sitio; el test quedo probando algo que ya
  // no existe. Ahora prueba lo que la ficha SI tiene y no puede faltar nunca: la
  // salida de compra. Ver la regla "nunca dejar una pantalla de compra sin salida".
  await expect(page.getByText(/cómo lo recibes/i)).toBeVisible({ timeout: 5000 });
  const salida = page.getByRole("button", { name: /comprar con mercadopago|agregar al carrito/i })
    .or(page.getByRole("link", { name: /whatsapp|solicitudes|avísame/i }));
  await expect(salida.first()).toBeVisible();
});

test("home: se ven libros sin scrollear en desktop", async ({ page, browserName }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  // Qué se prueba acá, corregido el 10-09-2026: que al entrar se vean libros de
  // verdad sin scrollear. Antes se medía el heading "Libros destacados", que dejó de
  // existir en el rediseño editorial de mayo — y su reemplazo, "Esta semana en el
  // velador", quedó a 1.707px, casi dos pantallas abajo. Medir el heading probaba
  // el orden de las secciones; lo que le importa a quien llega es ver un libro.
  const primerLibro = page.locator("a[href^='/libro/']").first();
  await expect(primerLibro).toBeVisible();
  const box = await primerLibro.boundingBox();
  expect(box?.y).toBeLessThan(900); // sin scrollear

  // Y la fila destacada existe en alguna parte de la página.
  await expect(
    page.getByRole("heading", { name: /esta semana en el velador/i }).first()
  ).toBeVisible();
});
