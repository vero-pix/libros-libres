# Handoff SEO — para el Claude que revisa la conexión y los informes de SEMrush

**Fecha:** 28 mayo 2026
**De:** sesión de Claude Code (local) que trabajó site-side hoy.
**Objetivo:** que quedemos alineados. Acá está lo que cambió en el sitio y lo que es intencional, para que al leer SEMrush/GSC no marques falsos positivos ni dupliquemos trabajo.

---

## 1. Cambios SEO desplegados/pendientes HOY

- **Fix `/product-tag/*` (recién pusheado a `main`, pendiente de deploy en Vercel).**
  URLs legacy estilo WooCommerce (`/product-tag/economia`, `/product-tag/isabel-allende`, `/product-tag/recetas`, `/product-tag/amor/page/5`, etc.) seguían **indexadas en Google y devolvían 404** (100% bounce, detectado en `scripts/audit_entry_exit.mjs`). Ahora hacen **301 → `/search?q=:slug`** (en `next.config.mjs`), igual que `/product/:slug`.
  → **Si SEMrush/GSC lista errores 404 en `/product-tag/...`, ya están resueltos** (esperar a que recrawlee). Conviene **reenviar el sitemap en GSC** para acelerar.
  → Se usó `?q=` (no `?tag=`) a propósito: los slugs viejos no calzan con los tags curados.

- **Alt text en imágenes de fichas** (commit `321f4e0`): galería ahora con `alt` "Título — Autor, libro usado". Mejora SEO de Google Imágenes. Relevante si miras oportunidades de imagen.

- **Service worker** (commit `29c8300`): arreglo de PWA, sin impacto SEO directo, pero dejó de tirar errores en consola que ensuciaban diagnósticos.

---

## 2. Estrategia de URLs legacy YA existente (NO son bugs — no las marques)

El sitio migró de una versión WooCommerce/WordPress. El manejo de URLs legacy es **deliberado**:

- **301 a destino útil** (recuperar tráfico con intent) — en `next.config.mjs`:
  - `/producto/:slug`, `/product/:slug`, `/product-tag/:slug` → `/search?q=:slug`
  - `/categoria-producto/:slug`, `/product-category/:slug` → `/?genre=:slug`
- **410 Gone** (deindexar taxonomías muertas) — en `middleware.ts` (`legacyPrefixes`):
  `/tag`, `/category`, `/author`, `/autor`, `/shop`, `/tienda`, `/mi-cuenta`, `/wp-json`, `.php/.asp/.aspx`, permalinks `/?p=123`, etc.
  → **Si SEMrush reporta 410 en estas, es INTENCIONAL** (limpieza de índice WordPress).
- **`robots.txt` bloquea `/search` y `/publish`** → `/search?q=...` NO se indexa (por diseño, para no generar duplicados). Por eso el redirect de `/product-tag` a `/search` deindexa sin crear páginas nuevas indexables.

---

## 3. Estado de tráfico y registros HOY (números reales del tracking propio)

Del tracking propio (`page_views`), no de GA4:

- **Hoy:** 257 pageviews / 131 sesiones únicas. Día normal (no bajo).
- **Registros:** 0 hoy, **8 en 7 días**, 43 en 30 días, 64 total. Los registros llegan en racimos; 1-2 días en cero es ruido normal.
- **Bounce 30d:** 66.9%.
- **Entry pages con fuga:** `/search` como entrada rebota **92.5%**; `/product-tag/*` rebotaba 100% (ya arreglado).
- **Referrers (30d):** Google (líder), Reddit, Bing, **ChatGPT / Copilot** (tráfico de IA), **Symbaloo** (educación), y clics de **Google Shopping** (params `srsltid=` — Merchant Center activo).
- **Listings:** 459 activos, 21 completados (vendidos).

---

## 4. ⚠️ Cuidado con estas herramientas (dan datos falsos)

- **`scripts/audit-funnel.mjs`** sub-reporta:
  - El conteo de tráfico **tope a 1000 filas** → "7d" y "30d" salen ambos 1000/440 (artefacto, el tráfico real es mayor).
  - El query de **`orders` devuelve 0** → es un **bug**, NO la realidad. Hay ventas reales (el mismo reporte dice "21 listings completed"). **No reportar "0 ventas / 0 compradores".**
- Para chequear ventas/actividad reales, usar `scripts/check_recent_activity.mjs` (el webhook de email al seller del mismo dominio falla en silencio).
- **Scripts `.mjs` ya corren bien:** el bug de comillas en `.env.local` (secuela de migrar el repo a local) **ya se arregló** (archivo normalizado + backup `.env.local.bak`). No hace falta truco de shell.

---

## 5. Scripts útiles para auditoría (todos leen `.env.local`, read-only)

- `scripts/_check_today_traffic.mjs` — tráfico de hoy por hora + top paths + referrers.
- `scripts/audit_entry_exit.mjs` — entry/exit pages + bounce (lo que destapó el problema de `/product-tag`).
- `scripts/audit-funnel.mjs` — embudo (ojo con los caveats de arriba).
- `scripts/_check_recent_signups.mjs` — últimos registros + por ventana.

---

## 6. Follow-ups SEO abiertos (no hechos hoy)

- `/search` como página de entrada: 92.5% bounce. Revisar primera impresión de búsqueda directa.
- `/publish`: salidas altas → posible fricción en login/registro (conecta con la baja de registros del día).
- Arreglar `audit-funnel.mjs` (tope 1000 + query orders) para que los reportes no den sustos falsos.
- Roadmap SEO vigente: siguiente landing `/comprar-libros-usados`; monitorear keywords en GSC. Ver `ROADMAP.md` sección SEO.

---

## 7. Reglas de trabajo (importante)

- **No hacer `git push` ni deploy a producción sin autorización explícita de Vero.**
- **Nunca generar tráfico fake a producción** (screenshots/pruebas contra `localhost`, no contra `tuslibros.cl`) — ensucia GA4/SEMrush.
- Tabla de perfiles es `users` (no `profiles`); columna de nombre `full_name`.
