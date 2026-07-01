# tuslibros.cl — Roadmap

Última actualización: 25 junio 2026

---

## Reglas permanentes (bugs que no pueden volver)

| Bug | Fix de raíz | Fecha |
|---|---|---|
| Vendedor nuevo sin username → URL UUID | Trigger DB `auto_username_on_insert` + endpoint `/api/users/generate-username` | 13 mayo 2026 |

Cuando aparezca un bug de este tipo: **no solo backfillear — siempre tapar el origen**.

---

## Checklist pre-deploy (obligatorio)

Antes de mergear a `main` cualquier cambio a **componentes críticos** (Navbar, HomeShell, HeroBar, ListingDetail, checkout, publish, auth):

```bash
# 1. Build pasa
npm run build

# 2. Smoke tests pasan (levantar dev server antes en :3000 o :3001 con QA_BASE_URL)
PORT=3001 npm run dev &
QA_BASE_URL=http://localhost:3001 npm run smoke
```

Los smoke tests viven en `tests/e2e/golden-paths.spec.ts` y validan:
- Home carga con listings visibles above the fold
- **Dropdown "Ayuda" abre al hover y al click** ← incidente 19 abril
- **Dropdown "Mi cuenta" accesible** (si logueado)
- CTA "Ver N libros" del hero → navega a `/search`
- Ficha de libro abre sin 404
- **Comparador de precios visible en ficha** con links a Buscalibre/MercadoLibre
- `/publish` redirige a login si no autenticado
- Footer con links críticos (Términos, etc.)

Si alguno falla, **no mergear**. Investigar root cause primero.

**Incidente que originó esta regla:** 19 abril 2026, agregué `overflow-x-auto` al navbar para compactar mobile. El build pasó, el screenshot se veía bien, deployé. Los dropdowns absolute quedaron recortados por el overflow → nadie podía entrar a Mi cuenta / Ayuda / publicar. Hotfix inmediato.

---

## Pendientes activos

### 🔴 Urgente / Con fecha límite

- [x] **Dominio librolibre.cl — INSCRITO por Vero (1 jul 2026)** ✅ — se liberó del titular anterior (Cinta Carmesí) y Vero lo inscribió a su nombre en NIC Chile ese día, apenas quedó disponible. Recordatorio diario (rutina `trig_01Pp1kHk1h8APSxqC4VBs1fx`) **borrado**. Pendiente opcional: decidir si redirige 301 → tuslibros.cl o se deja guardado como dominio defensivo/marca.
- [ ] **Restaurar dirección Shipit** — cambiar de vuelta a San Pio X 2555, Providencia, vero@economics.cl después del envío de cim.
- [x] **Rate limit /api en deny** — 60 req/min por IP, acción deny (403). Activado 21 mayo 2026.

---

### CIMLibros — primera venta (15 mayo 2026)

- [x] Primera venta procesada — $15.000, Starken, retiro La Florida → Providencia (Zdravko)
- [x] Etiqueta generada, email enviado a cimlibros@gmail.com con instrucciones
- [x] **Fix origen en etiqueta Shipit** — commit 8308c5d. Ahora pasa `origin` del listing/vendedor al crear la orden. Ya no toma la dirección de Vero por defecto.
- [ ] **Probar flujo punta a punta con venta real de vendedor externo** — verificar que la etiqueta generada muestre la dirección correcta del vendedor.
- [ ] **Definir tipo de recogida con Shipit (lunes 19 mayo)** — revisar con la API si el campo `kind` del origin controla si un héroe va a retirar al domicilio del vendedor o si el vendedor debe ir a una sucursal. Sesión conjunta.
- [ ] **Agregar dirección de cim en Shipit como origen permanente** — Santa Julia 732, La Florida, +56 9 8903 1517, cimlibros@gmail.com

---

### Álvaro — Librería Comuna Literaria (en curso)

Primer librero pro externo. Trato 1%/10 ventas → 5%. Scripts PrestaShop listos en `/scripts`.

- [ ] **Álvaro registra cuenta y conecta MP** — acordado 13 mayo. Prueba con 10 títulos manuales, luego conectar PrestaShop.
- [ ] **Multiplicador de precio** — Álvaro pidió factor automático en formulario (ej. ×1.05 para absorber comisión). Pendiente implementar.
- [ ] **Comisión especial Álvaro** — 1% primeras 10 ventas, luego 5%. Implementar en BD cuando confirme inicio.

---

### Vendedores nuevos activos

- **Mónica Espinoza** — registrada 12 mayo. Email con Excel 47 libros enviado. Pendiente que suba el catálogo.
- **Patricio Bustos Barros** — 1 libro activo (Sombra 81, $17.990). URL: `/vendedor/patricio.bustos.b`.
- **Nicole Sepúlveda** (Talca) — 22 libros cargados 3 jun, destacada, MP conectado. 7 con portada de lomo pendientes de foto frontal.
- **Lorena Cortés** (Concepción) — orgánica, registrada 4 jun. 39 novelas (Sparks, Steel, Maxwell + clásicos). Destacada, categorizada `ficcion`, MP conectado, email de bienvenida enviado (8 jun). Sin actividad de seguimiento aún.
- **Nicolás — "Libros del Bardo"** (Melipeuco) — orgánico, registrado 5 jun. Historia de Chile/mundo. Destacado, MP conectado, email de bienvenida enviado (8 jun).
- **Ruth Díaz** (@ruth.diaz, Puerto Varas) — orgánica por WhatsApp, registrada 19 jun, **MP conectado**. Colección grande de **romance/YA**. ✅ **70 libros publicados** (20 jun): 3 que subió ella + 67 cargados con `scripts/_upload_ruth.mjs` desde `docs/carga_ruth_jun2026.csv`, portadas vía Open Library. **Notificada por email.** Pendiente menor: 13 libros sin portada (Open Library no las tenía) → pedirle foto; confirmar/ajustar precios estimados; la repisa oscura (~13 libros que no entraron al CSV) si manda foto con luz.

---

### SEO — Landings estratégicas

Cadencia sugerida: una landing por día hábil. Cada una apunta a una keyword con intención clara, usa FAQPage + HowTo + BreadcrumbList schema, y se agrega al sitemap. Modelo base: `/vender-libros-usados` (deployada 15 mayo).

| Ruta | Keyword objetivo | Vol | KD | Intent | Estado |
|---|---|---|---|---|---|
| `/libros-usados-chile` | libros usados chile | — | — | comprador genérico | ✅ Deployada |
| `/vender` | vender libros usados en chile | — | — | vendedor | ✅ Deployada |
| `/vender-libros-usados` | vender libros usados | 140 | 23 | vendedor informacional | ✅ 15 mayo |
| `/libros-usados-santiago` | libros usados santiago | — | — | comprador local RM | ✅ 19 mayo |
| `/libros-usados-providencia` | libros usados providencia | — | — | comprador local Providencia | ✅ 19 mayo |
| `/comprar-libros-usados` | comprar libros usados | — | — | comprador informacional | ✅ 29 may |
| `/libros-usados-baratos` | comprar libros usados baratos | — | — | comprador precio | ✅ 25 jun (con verbo "comprar") |
| `/libros-usados/talca` · `/puerto-montt` · `/coquimbo` | libros usados [ciudad] | — | — | comprador local | ✅ 25 jun (stock verificado) |
| `/libros-de-historia-de-chile` | libros de historia de chile | — | — | comprador nicho | ✅ 25 jun (75 libros, 12 búsq/30d) |
| `/megan-maxwell-libros` | megan maxwell usados | — | — | comprador autora | ✅ 25 jun (29 libros) |
| `/novela-negra-policial` | novela negra usada | — | — | comprador género | ✅ 25 jun (118 libros) |
| `/libros-escolares-usados` | libros escolares usados | — | — | temporada escolar | ⬜ Pendiente |

> **Método validado (25 jun):** antes de crear una landing de ciudad/tema, verificar stock real con script (geolocalización o needles). Crear solo si ≥~15 libros para evitar thin content. De 9 ciudades candidatas, 6 tenían 0 stock → descartadas. Cruzar siempre con búsquedas reales (`page_views /search?q=`) para priorizar por demanda.

**Patrón por landing:**
1. H1 con keyword exacta en forma natural
2. Intro editorial (no genérica)
3. Pasos o explicación corta
4. Grid de libros reales de la BD (si aplica)
5. FAQ con intención de búsqueda (7+ preguntas)
6. Internal links a `/search`, `/vender`, `/como-funciona`
7. Schemas: FAQPage + BreadcrumbList + HowTo o ItemList
8. Agregar al sitemap con priority 0.8

**Cadencia recomendada:** una landing cada 5–7 días. Submitir en GSC manualmente después de cada deploy. Esperar indexación antes de publicar la siguiente.

**Orden ajustado:**
1. `/libros-usados-santiago` — mayor volumen RM (esta semana)
2. `/libros-usados-providencia` — semana del 22 mayo ⚠️ Gran parte del catálogo está en Providencia → ángulo genuinamente diferente de Santiago, no duplicado
3. `/comprar-libros-usados` — espejo comprador de `/vender-libros-usados`
4. `/libros-escolares-usados` — antes de julio (temporada crítica)

**Notas por landing:**
- `/libros-usados-santiago` — libros con lat/lng en RM, ángulo local (retiro en mano, sin despacho)
- `/libros-usados-providencia` — hiperlocal real: Vero vive ahí, catálogo concentrado ahí. Mencionar barrios (Manuel Montt, Baquedano, Pedro de Valdivia). Mostrar libros reales de vendedores en Providencia.
- `/comprar-libros-usados` — grid de libros destacados, FAQ comprador
- `/libros-escolares-usados` — filtrar por `subcategory=academico-escolar`, temporada marzo–abril y julio–agosto

---

### 🟡 Alta prioridad (impacto directo en conversión)

**Conversión a registro / publicación (sesión propia con smoke test)**
- [x] **Reducir fricción `/publish` → registro** — ✅ deployado 29 may (commit `239fc1d`, oportuno para Furia del Libro). El `next` ahora se encadena de punta a punta: link a register lo propaga, `emailRedirectTo` lo arrastra al callback, y si el signUp devuelve sesión inmediata redirige directo a `/publish`. Copy contextual en login/register cuando `next` apunta a publicar ("Inicia sesión para publicar" / "Crea tu cuenta y publica"). Verificado en prod por curl (cadena de URLs + copy + no-regresión). **Pendiente menor:** confirmar el submit real con correo descartable (camino sesión-inmediata no se ejerció para no crear usuario en prod). Ver memoria `project_publish_next_threading`.
- [x] **Landing logged-out de `/publish`** — ✅ 29 may (commit, pendiente push). El deslogueado ya no va seco a `/login`: ve el pitch "Publica tu libro · Siempre gratis" + CTA a registrarse (`next=/publish`). Sacado de `protectedPaths` del middleware; el form/API siguen exigiendo auth. Smoke test: landing 200, CTAs con next, resto de rutas protegidas sin regresión.

**Ciclo de vida del usuario**
- [ ] **Re-engage email 3 días post-registro** — si user no publicó ni compró en 3 días, email recordatorio con link a ISBN scanner o libro destacado relevante.
- [ ] **Carrito abandonado** — email automático a quien deja libros sin comprar. Álvaro lo pidió explícitamente.
- [ ] **Retargeting por email** — sugerencias basadas en lo que el usuario miró. Pedido por Álvaro.

**Catálogo y búsqueda**
- [ ] **Full-text search con `pg_trgm` + GIN index** — hoy el buscador usa `LIKE` sin índice. 10-100x más rápido y soporta typos. Alta prioridad cuando catálogo supere 500 libros activos.
- [x] **Search empty state review** — 80% bounce en /search. Rediseñado con CTA de economía inversa (Se busca) y sugerencias dinámicas de libros destacados.
- [x] **Rotación automática FeaturedRow** — ✅ 30 jun. Con 1.058 listings, 776 sin una sola visita. Destacados ahora = 10 curados + 6 "descubrimientos" rotativos por día (enterrados con portada, excluye deprioritized). HeroBar rota 24 clásicos por semana. Además se eliminaron TODOS los repetidos de la portada (colecciones multi-tag + grilla vs recientes) — ver memoria `feedback_portada_sin_repetidos`. Simulador `scripts/_sim_full_home.mjs`.

**Reputación**
- [ ] **Sistema de reputación por vendedor** — tabla `reviews` existe pero vacía. UI básica en perfil existe sin datos. Álvaro y otros lo piden: historial independiente por librería, estilo ML.

---

### 🟠 Media prioridad

**Feedback CIMLibros / Carlos (1 jul 2026)** — su vendedor más activo
- [x] **Contador de confianza en el home** — ✅ 1 jul. Prueba social arriba del fold: libros publicados (1.076) · tiendas activas (40) · visitas totales (~31k). Componente `components/home/StatsBar.tsx`, datos cacheados (`getPublicStats` en page.tsx). **Sin "vendidos" a propósito** (hoy ~0 / off-platform → delataría el problema). Incluye link "Mira lo nuevo →" a /novedades (Carlos dijo que las novedades quedan poco visibles).
- [x] **Ranking de tiendas** — ✅ 1 jul. Página `/tiendas` (`app/(main)/tiendas/page.tsx`) rankea las 40 tiendas por publicaciones activas (dato honesto; ventas fuera mientras sea ~0), con medallas al top 3. Linkeada desde el contador ("tiendas activas" → /tiendas), footer y sitemap.
- [ ] **Varios puntos de entrega por tienda** — Carlos entrega en varios lugares. Necesita modelo de datos (`pickup_points` o JSON en users/listings) + publish form + ficha + checkout + cercanía. Sesión propia.
- **Insight clave (Carlos):** "mucha gente me ubica por fuera y concreta fuera de la página" → confirma la fuga off-platform (ventas reales por WhatsApp que no dejan comisión). Su cuenta SÍ puede cobrar, así que es fuga por costumbre, no por MP roto. Evidencia directa para el trabajo de conversión ("Comprar manda"). Ver [[project_conversion_compra_jul2026]].

**UX y features**
- [x] **Modo vacaciones (libros visibles pero no comprables)** — ✅ deployado 3 jun (commit `c98423d`). En vez de pausar (que vaciaba la tienda), `users.on_vacation=true` deja los libros **visibles** pero no comprables: banner en perfil, aviso en ficha, overlay "🌴 En vacaciones" en tarjetas, bloqueo server-side en `/api/cart` y `/api/orders`. Buhardilla lo estrenó; **reactivada automáticamente el 8 jun** vía bloque fechado en el cron `cleanup-bots`. **Pendiente (autoservicio):** toggle en `/mis-libros` para que el vendedor lo active/desactive solo + fecha de regreso automática (hoy se setea por backend).
- [ ] **Fix HeroBar simplificado** — sacar las 5 cards horizontales (redundan con feature sections ya movidas). Alto impacto, bajo esfuerzo.
- [ ] **Fix Libros Huertas avatar** — removido temporalmente del carrusel de vendedores destacados. Pedirle foto por WhatsApp para reactivar.
- [ ] **Navbar mobile: Inicio/Novedades en dropdown hamburger** — libera la nav row en mobile.
- [ ] **PostHog session replay** — para entender POR QUÉ rebotan (hoy solo sabemos CUÁNTO). Activar cuando haya presupuesto.
- [ ] **Mejorar Core Web Vitals / LCP** (detectado 25 jun vía Semrush Site Audit; alertas por email recurrentes). Diagnóstico: **CLS perfecto (0.000, 10/10 verde)** y Rendimiento técnico 100%, pero **LCP malo: 3.0–4.0s en las 10 páginas medidas** (Google quiere <2.5s) → Core Vitals marca 0%. Causa que da Semrush: *"Elimina el JavaScript no utilizado"* + *"Evita JS heredado a navegadores modernos"* + *"Evita cadenas de solicitudes críticas"* — el sitio carga demasiado JS de una y retrasa el render del libro. Páginas peores: `/vendedor/cimlibros` y `/` (home), LCP ~3.6-4.0s. **NO urgente** (tráfico subió a récord igual; CLS —lo que más molesta al usuario— está perfecto). Proyecto de performance dedicado: code-splitting, lazy-load de componentes pesados (mapa Mapbox, animaciones), revisar bundles. Sesión aparte con cabeza fresca.

**Modelo de negocio**
- [ ] **Venta en pack / lote (lado vendedor)** — pedido por Carlos (CIM Libros, 28 may). Publicar varios libros como **una sola unidad** que se vende junta: packs (ej. 4 Lafourcade) y obras **multitomo** (ej. "Historia de la Vida Privada - Tomo 1..N"). ⚠️ Distinto del bundle checkout actual (`bundle_id`), que es lado **comprador** (varios listings sueltos del mismo vendedor pagados juntos). Acá el lote es atómico: no se compra un libro suelto del pack. Scope a diseñar: modelo de datos (`listing` tipo lote + `listing_items`, o flag `is_bundle`), publish form, ficha, carrito, checkout y etiqueta Shipit (peso/volumen del lote). Sesión dedicada.
- [ ] **Sistema de ofertas entre usuarios** — tabla `offers`, endpoint y UI para que compradores propongan precio. Decidir si es prioridad. ⚠️ Los "13 ofertas" del commit de abril son precios con `original_price` tachado, NO negociación.
- [ ] **Flujo de devolución de arriendos** — arriendo se crea y cobra pero no hay tracking "libro debe devolverse en X días" ni confirmación de devolución.
- [ ] **Rewards de referidos** — código y estadísticas funcionan pero no se entregan descuentos/créditos al cumplir. Sin incentivo real, no convierte.
- [ ] **Componente testimonios escalable** — hoy TestimonialBanner hardcodeado. Cuando haya ≥3, migrar a tabla `testimonials` + widget.

**Datos y calidad**
- [x] **Bug revenue admin "Negocio" = $0** — ✅ 29 may (commit, pendiente push). Era `orders.total_amount` (columna inexistente; la real es `total`). Estaba en DOS archivos: el admin `business-metrics/route.ts` Y el cron `daily-summary/route.ts` (o sea el resumen diario también mostraba $0). Corregidas las 3 ocurrencias de cada uno.
- [ ] **`/search` como entrada: bounce alto, baja prioridad** — `/search` pelado (sin query) muestra el catálogo completo (no está roto); ~40 entradas/30d, rebote en parte natural de página-catálogo. Opcional: chips de categorías/colecciones arriba para dar punto de entrada. No urgente (28 may).
- [x] **Hobsbawm "Un tiempo de rupturas"** — ✅ 29 may. Verificado en BD: 0 listings con `featured=true` + `featured_rank null`. Ya estaba limpio, nada que hacer.

---

### SEO

- [x] **Migración de medición SEO a Google Search Console API** (19 jun) — SEMrush expiró. Tooling nuevo en `scripts/seo/` (`npm run seo:gsc` / `seo:sitemaps` / `seo:audit-404`) con service account (proyecto Cloud `libros2026`, propiedad dominio `sc-domain:tuslibros.cl`). Línea base congelada 26-may en `baseline.ts`. Ver `scripts/seo/README.md`.
- [x] **Limpieza de sitemaps zombis** (19 jun) — causa raíz de los ~1.154 404 de GSC: había 10 sitemaps del WordPress viejo (`www.tuslibros.cl/...`, 2020) declarando ~970 URLs muertas. Borrados de GSC → quedó solo `tuslibros.cl/sitemap.xml` (858 URLs reales). Esperar 2-4 semanas a que bajen los 404.
- [x] **Revisar keywords de Baldor** (19 jun) — falsa alarma: NO desaparecieron, solo cayeron fuera del top-1000 por impresiones de mi reporte (vol. muy bajo: 5 impresiones / 28d). Siguen vivas (~35 variantes en 90d, baldor pos 23, álgebra pos 19). **Hallazgo real = canibalización:** `/search?q=algebra de baldor` (bloqueada en robots) se lleva 263 impresiones vs 68 de la landing `/algebra-de-baldor` (que rankea mejor, pos 7.4). Ajusté el reporte para no marcar "PERDIDA" a keywords de bajo volumen. **Decisión: baldor es bajo ROI, dejar en pausa**; foco en geo (Temuco/Viña/Santiago suben). Si se retoma: noindex/301 de `/search?q=` y `/libro/algebra-de-baldor/` → landing.
- [ ] **Correr `seo:audit-404` con input real** — exportar de GSC la lista de 404 a `scripts/seo/input/404-gsc.csv` para clasificar los que no venían del sitemap (legacy / enlaces rotos). Opcional ahora que se atacó la raíz.
- [ ] **Monitorear posición "donde vender libros usados"** — entró al top 10, verificar consolidación en 7 días.
- [ ] **Medir impacto landing `/libros-usados-chile`** — monitorear en GSC en 3-4 semanas.
- [ ] **Backlinks (linkbuilding)** — correos en frío a 5 blogs (ecología/universidades) para apalancar autoridad de dominio.
- [ ] **Blog con tono confesional** — base técnica SEO sólida, debilidad es falta de contenido long-tail. ("Por qué tu Neruda del 2008 vale más de lo que crees"). Prioridad baja — foco en circulación primero.

---

### Growth & Distribución

- [ ] **Recuperar Instagram @tuslibros.cl** — 317 seguidores. Al 13 mayo: Meta review en curso desde 23 abril. FB "Veronica Tus Libros" también inaccesible. Vía potencial: Apple Watch con FB loggeado.
- [ ] **Constituir SpA + postular Startup Chile SUP** — acordado desde 23 abril.
- [ ] **3 DMs warm a ángeles** — deck USD 80-120k en `docs/deck_valorizacion.pptx`.
- [ ] **Ping a Alfredo Enrione** — profesor ESE, serie LinkedIn Clásicos en el Directorio. Ofrecer café/Zoom 30min.
- [ ] **Decisión AdSense** — Google aprobó el sitio. DECIDIDO no activar ahora (revenue simbólico, mostraría competidores, daña Core Web Vitals). Revisitar cuando sesiones ≥10k/mes y bounce <50%. Pub ID: `ca-pub-7953415124311211`.

---

### Infra / Housekeeping

- [ ] **Migrar imágenes a Cloudflare R2** — Supabase Storage cuesta más que R2 a volumen. Sesión dedicada ~2h con testing.
- [ ] **Fix INP issue** — 6.2s según Vercel Toolbar.
- [ ] **Optimización polling `/api/messages/unread`** — hoy cada 30s. Reducir a 2-3 min o migrar a Supabase Realtime. Prioridad sube cuando haya 50+ usuarios activos.

---

### 🔵 Futuro

- [ ] **Panel analytics por vendedor** — visitas, mensajes, ventas, libros publicados. Primeros 50 vendedores: panel gratis de por vida.
- [ ] **Manejo de stock** — cantidad disponible por listing (hoy es 1 o nada). Descontar automáticamente al vender. Prioridad: cuando haya vendedores con múltiples copias.
- [ ] **Ampliar smoke tests E2E** — registro real, agregar al carrito, bundle checkout, pago sandbox MP, mensajería, publicar libro con login.
- [ ] **Subagente `ux-tester`** — corre flujos bajo demanda con screenshots.
- [ ] **Categorías sugeridas por vendedores** — tabla `category_suggestions`, botón en publish form, notificación email/Telegram a admin.
- [ ] **Reseñas: separar libro vs vendedor** — migrar tabla `reviews` con `target_type: 'book' | 'seller'`.
- [ ] **Páginas SEO de colecciones** — `/coleccion/maigret`, `/coleccion/biblioteca-de-babel`.
- [ ] **Campañas con deep link a libros específicos** — (no al home) en IG/WhatsApp.
- [ ] **Tracking envíos visual**
- [ ] **OAuth Facebook/Instagram**
- [ ] **Filtros adicionales** — encuadernación, editorial, páginas, buscador en página del vendedor.
- [ ] **Newsletter semanal automático**
- [ ] **Cron testimonios post-compra** — detecta orders `status = completed` >3 días, pide testimonio al comprador. Tabla `testimonials` + widget home.
- [ ] **Uber Despachos Chile** — investigar Uber Direct API (B2B) para envíos locales mismo día en RM. Alternativa a Shipit para Santiago.
- [ ] **Expansión Brasil** — esperar 12-18 meses. Validar Chile primero. Gap real: no existe P2P entre personas (Estante Virtual es solo librerías).

---

### Requiere acción de Vero

- [ ] **Apple OAuth** — $99/año, decidir si vale la pena.
- [ ] **Recontactar 150+ vendedores históricos**
- [ ] **WhatsApp Business para tuslibros.cl**
- [ ] **Configurar verificación 2 pasos Google Cloud**
- [ ] **Medir tracción QR expo 18 abril** — GA4, filtro `utm_campaign=18abril`.
- [ ] **Linkedin empresa** — 15 seguidores, estrategia de crecimiento pendiente.

---

### Descartados

- ~~Checkout múltiple carrito~~ — split payment MP no soporta múltiples vendedores → resuelto con bundle checkout por vendedor
- ~~Infinite scroll~~ — paginación numérica es mejor para SEO
- ~~Suscripciones mensuales~~ — foco en comisiones por venta
- ~~Fee fijo~~ — nunca habrá fee fijo
- ~~AdSense (por ahora)~~ — no activar hasta sesiones ≥10k/mes
- ~~Upgrade Next.js 16 / Tailwind 4~~ — no ahora, sin beneficio inmediato vs riesgo de quiebre

---

## Completado

### Hitos recientes (mayo 2026 — 20 mayo)

**Handoff de diseño UI — aplicado completo**

- [x] **PR1 · ListingCard refactor** — jerarquía simplificada, 1 badge (sin apilamiento), botones siempre visibles en mobile, precio con descuento tachado, rating solo si hay reviews. Lógica de arriendo eliminada (segmento pendiente). `bg-coral` como CSS var, `address` parseado para mostrar comuna.
- [x] **PR4 · Home editorial calmo (variación A)** — Hero dos columnas editorial, H1 "Cada estantería es una librería", quote de Vero, chips de categoría, CTAs claros. Secciones con voz: "Esta semana en el velador", "Librerías de confianza", "Recién subidos". Buscador duplicado eliminado.
- [x] **Fix · Ficha del libro (§04)** — Precio grande con tachado y pill -X%, grid de metadata (Estado/Encuadernación/Editorial/Páginas/Año/ISBN), notas del vendedor como quote editorial, tarjetas de entrega (Encuentro gratis / Courier cotiza), seller card con "Ver tienda →", buybox consolidado con botón coral principal. CTAs duplicados eliminados.
- [x] **Colecciones editoriales** — 10 colecciones en home curadas por tag: `tarde-de-lluvia`, `literatura-chilena`, `latinoamerica-contemp`, `historia-chile`, `clasicos`, `novela-negra`, `filosofia`, `ensayo`, `ciencia-divulgacion`, `para-regalar`. Se muestran solo si hay ≥3 libros. 202 libros taggeados automáticamente desde BD. Campo de tags editable en `/mis-libros`.
- [x] **CollectionBanners** — eliminado banner "Arrienda un libro", reemplazado por "Historia y Ensayo". Título con voz editorial.
- [ ] **PR2 · distance_km en API** — pendiente para cuando catálogo > 1.000 libros.
- [ ] **PR3 · Toggle compra/arriendo** — descartado. Segmento bibliotecas/universidades sin abordar.
- [ ] **Barra de planes (8%/5%/3%)** — pendiente para cuando haya ≥2.000 libros activos.

### Hitos recientes (mayo 2026 — 19 mayo, sesión mañana)
- [x] **Editorial y Páginas en formulario de publicación** — pedido de CIM. Antes solo disponibles al editar. Ahora aparecen al publicar y se pre-llenan si el ISBN scanner los detecta.
- [x] **Fix slug Economía** — corregido a `no-ficcion-economia` (estaba como `economia` suelto, sin prefijo de categoría padre).
- [x] **Fix landings SEO** — filtrar listings sin `book` antes de `sortListingsForDisplay` (bug en las 6 landings de clusters).
- [x] **`/publish` bloqueada en robots.txt** — evita que crawlers sigan el 307 de auth.
- [x] **`llms.txt`** — agrega descripción del sitio para motores de búsqueda con IA (Perplexity, ChatGPT, etc.).
- [x] **Fix ads.txt en middleware** — excluido del middleware para que Google AdSense pueda validarlo correctamente.
- [x] **6 landings SEO indexadas en GSC** — `/algebra-de-baldor`, `/pablo-neruda`, `/mario-vargas-llosa`, `/rayuela`, `/cien-anos-de-soledad`, `/el-arte-de-amar` solicitadas a Google.

### Hitos recientes (mayo 2026 — sesión tarde 16 mayo)
- [x] **Fix Shipit origen vendedor** — commit 8308c5d. La etiqueta ya muestra la dirección del vendedor real, no la de Vero.
- [x] **Fix sitemap.xml** — eliminadas URLs con `&` que rompían el XML (categorías como query params). Vendedores usan username. `/search` removida. `/libros-usados-chile` agregada.
- [x] **6 landings SEO** — `/algebra-de-baldor`, `/pablo-neruda`, `/mario-vargas-llosa`, `/rayuela`, `/cien-anos-de-soledad`, `/el-arte-de-amar`. Redirect 308 desde URLs legacy en `next.config.mjs`.
- [x] **Comparador de precios honesto** — renombrado a "Compara los precios", eliminada etiqueta "Neutral" hardcodeada. Links funcionan, sin promesas falsas. Comparador automático ML descartado (API no pública en Chile).
- [x] URLs amigables vendedor — `/vendedor/username` resuelve por username O UUID. 5 vendedores sin username corregidos.
- [x] #1 Google "vender libros usados Chile" — FAQ section + FAQPage schema en `/vender`. Saltó de pos 11 a #1 en <24h.
- [x] Block /search en robots.txt — URLs `/search?q=…` ya no se indexan.
- [x] Marquee libros destacados — auto-scroll en loop, pausa al hover. CSS puro.
- [x] Aviso automático match Se Busca — webhook marca `fulfilled=true` tras email. Primer match real: El gato negro.
- [x] Scripts integración PrestaShop — `import_prestashop.mjs` + `sync_prestashop.mjs`.
- [x] Limpieza spam BD — 21 usuarios bot eliminados. Newsletter_subscribers depurado.
- [x] Newsletter 106 destinatarios — enviado 13 mayo.

### Performance y editorial (mayo 2026)
- [x] Optimización TBT Mobile — animaciones SVG pesadas y partículas desactivadas.
- [x] Limpieza listings obsoletos (Kamasutra y otros fuera de línea editorial).
- [x] Fix slugs legacy — generación masiva de slugs para vendedores antiguos.
- [x] Scan portadas con Claude — `ANTHROPIC_API_KEY` en Vercel. Modelo `claude-sonnet-4-6`.
- [x] Taxonomía chilena completa — `lib/genres.ts` y DB.
- [x] Clasificador admin pro con buscador en tiempo real.
- [x] Backfill de tags — +100 libros sin metadatos.
- [x] Nube de tags (Vibras) en sidebar.
- [x] Home de temporada — banners Escolares y Lectura Complementaria.
- [x] Vendedores destacados — lógica de prioridad para Bárbara Barcia.

### Security (abril 2026)
- [x] SQL migration hardening aplicada.
- [x] hCaptcha en registro (frontend, NO en Supabase).
- [x] Country blocking auth routes (RU/VN/CN/KP/IR/BY).
- [x] 9 bots eliminados + leaked password protection ON.

### Marketplace y UX
- [x] Split Payment producción — verificado con venta real (6 abril 2026).
- [x] Bundle checkout — orders con `bundle_id` compartido, una preferencia MP.
- [x] Shipit integración completa — cotización, etiquetas, tracking. Validado para vendedores no-admin.
- [x] Comisiones por plan (Libre 8%, Librero 5%, Librería 3%).
- [x] Economía inversa "Se busca" — tabla `book_requests`, API, página `/solicitudes`.
- [x] Ranking por cercanía en /solicitudes.
- [x] Activación post-registro — webhook welcome email con 3 CTAs.
- [x] Notificar solicitudes a vendedores — email automático con CTA a /publish.
- [x] Tracking session → user_id (backfill pageviews anónimas al loguearse).
- [x] OG images con portada del vendedor primero.
- [x] Fix SEO: listings eliminados redirigen 308 al home.
- [x] Sinopsis masiva en español — 208/209 libros.
- [x] Comparador de precios en ficha (Buscalibre, MercadoLibre, IberLibro).
- [x] Badged vendedor MercadoPago en ficha y perfil.
- [x] Badge reactivo del carrito en header.
- [x] Vista vendedor: carritos con mis libros.

### Infraestructura
- [x] Next.js 14 + Supabase + Vercel
- [x] Dominio tuslibros.cl (NIC Chile → Vercel nameservers)
- [x] Resend SMTP + API (noreply@tuslibros.cl)
- [x] Google OAuth + LinkedIn OAuth
- [x] Sitemap dinámico + robots.txt
- [x] PWA instalable
- [x] Vercel Analytics + GA4 + Google Search Console
- [x] PageTracker propio en tabla `page_views`
- [x] Google Merchant Center operativo
- [x] Google Business Profile (4.3★, 4 opiniones)
- [x] RLS fix en `contact_messages`
- [x] Reactivar Next Image (Vercel Pro)
- [x] Supabase Pro + Vercel Pro activos (~$45/mes)
- [x] Agente QA con Playwright — 5 flujos dorados

### SEO & Performance
- [x] Metadata dinámica en listing detail, search, vendedor
- [x] JSON-LD schemas (Product, BreadcrumbList, Organization, FAQPage)
- [x] Sitemap con URLs `/libro/username/slug`
- [x] Meta descriptions + títulos optimizados
- [x] Libros vendidos indexados con schema SoldOut
- [x] Structured data shipping + return policy

### Emails transaccionales (10+)
- [x] Confirmación registro / bienvenida newsletter
- [x] Notificaciones admin (nuevo usuario, contacto)
- [x] Confirmación compra/arriendo → comprador
- [x] Notificación venta/arriendo → vendedor
- [x] Cambios estado arriendo
- [x] Preguntas → vendedor / respuestas → comprador
- [x] Newsletter sender (admin panel + template)

### Admin
- [x] Panel con stats, delete individual/masivo, filtros
- [x] Tab Newsletter con preview y botón enviar
- [x] Tab Analytics: visitas/día, navegadores, OS, dispositivos, páginas top
- [x] Tab Herramientas con accesos rápidos
- [x] Tab Categorías: CRUD con árbol visual
- [x] Tab Negocio: embudo conversión, revenue, carritos abandonados
- [x] Selector de vendedor en herramientas
- [x] Toggle featured por publicación

### Contenido y marketing
- [x] Voz personal en todo el sitio (confesional, 1ª persona, español chileno)
- [x] Landing /vender (conversión vendedores)
- [x] Landing /libros-usados-chile
- [x] Pitch /pitch/ público con decks
- [x] Banners Escolares y Lectura Complementaria
- [x] Sistema de referidos con código personal
- [x] Página /novedades (changelog público)
- [x] Gong Telegram al publicar libro
- [x] Testimonios Zdravko y Camilo en home

---

## Documentos de referencia

- `MODELO-NEGOCIO.md` — flujos de pago, planes, comisiones, ciclo arriendo
- `CLAUDE.md` — convenciones del proyecto para Claude Code
- `docs/kit_metralleta_confesional.html` — mensajes listos tono confesional (v2)
- `docs/guia_integracion_alvaro.html` — guía para onboarding de Álvaro
- `docs/INSTRUCCIONES_CARGA_MASIVA.md` — formato CSV para vendedores

---

## Historial de sesiones

### 20 junio 2026
**Ruth Díaz publicada:** subí sus 70 libros de romance/YA (`scripts/_upload_ruth.mjs`, saltando los 3 que ella ya tenía), portadas vía Open Library, origen Puerto Varas. Notificada por email. 13 quedaron sin portada (pendiente foto). **Importador — 2 fixes desplegados** a partir del test real de Carlos (CIM): (1) feedback de fotos en pantalla — cuántas portadas asoció + nombres del CSV sin archivo (commit `ffc7f91`); (2) match tolerante a la extensión — el CSV de Carlos nombraba las fotos sin `.jpg` y por eso no calzaban; ahora funciona igual + deduplica galería (commit `c1edbc2`). Carlos ya tenía sus 9 libros publicados sin portada → email-guía para que borre y reimporte él mismo. **Baldor:** falsa alarma (bajo volumen, no perdido) + canibalización `/search?q=` vs landing; reporte ajustado.

### 19 junio 2026
Día doble: SEO + primera vendedora cargada con flujo nuevo. **SEO:** migré la medición a Google Search Console API (SEMrush expiró) — tooling reproducible en `scripts/seo/` (commit `0c1d329`), service account en proyecto Cloud `libros2026`. El `seo:audit-404` cazó la causa raíz de los ~1.154 404 de GSC: **10 sitemaps zombis del WordPress de 2020** (`www.tuslibros.cl/...`) declarando ~970 URLs muertas; Vero los borró todos de GSC → quedó solo el sitemap real (858 URLs). Primer corte GSC: 11 keywords mejoraron desde mayo (Temuco +70, Viña/Santiago/Providencia +11/+14), las de baldor desaparecieron (revisar). Bug evitado: el commit de los scripts rompía `next build` (spread de iteradores con el target del tsconfig) — cazado y corregido (`9703a53`) antes de que reventara Vercel. **Ruth Díaz:** vendedora orgánica por WhatsApp con 70 libros de romance/YA. Flujo nuevo replicable: leí los lomos de sus fotos con visión + saqué precios de un video con `ffmpeg`, armé el CSV completo (`docs/carga_ruth_jun2026.csv`, $713.000), generé un preview visual (`preview_ruth.png`, portadas vía Open Library) y le envié una **propuesta por email** (Resend) para que confirme precios/estado/comuna. Pendiente: subir los 70 cuando responda. `/novedades` actualizada con la limpieza de SEO en voz de Vero.

### 12 junio 2026
Auditoría de vendedores activos con la columna MP correcta (`mercadopago_access_token`): **30 activos, 15 con MP / 15 sin**. De los 16 nuevos (últimos 30d), 9 sin MP. Onboardeados a mano **Josefa Cerda** (10 libros, juvenil/romance), **Fabián Sagredo** (Talca, 21 libros, historia+clásicos — categoricé sus 19 NULL) y **Sol PG** (Temuco, 7 libros autoayuda) — destacados + email de bienvenida en voz de Vero con botón "Conectar MercadoPago". **Nuevo cron `/api/cron/mp-nudge`** (`0 14 * * *`, 10am Chile): empuja a conectar MP a vendedores 48-72h post-registro que ya publicaron pero no tienen MP. Diseño sin columna de estado (la ventana de 24h se cruza una sola vez → un correo, sin spam); recap a Vero. **SEO sano:** tráfico 7d 2.925 vistas (▲48% vs semana previa), bounce 6%, 5,1 pág/sesión, 28% desde buscadores, ChatGPT ya aparece como fuente. Oportunidades anotadas: `/publish` 2ª página más vista (cuello de botella = conectar MP), Concepción y el sur (Temuco/Melipeuco) desatendidos.

### 8 junio 2026
Dos vendedores **orgánicos** llegaron solos (Lorena Cortés, 39 novelas, Concepción; Nicolás "Libros del Bardo", historia, Melipeuco) — no spam. Onboardeados: destacados, libros de Lorena categorizados `ficcion`, emails de bienvenida en voz de Vero. Buhardilla reactivada sola del modo vacaciones (cron, 5am). **Bug descubierto:** la columna MP real es `mercadopago_access_token`, no `mp_access_token` → todos los chequeos viejos de "sin MP" daban falsos negativos. Respuesta correcta: 14 de 29 vendedores activos sin MP. **Backfill de `city`** a los 42 usuarios que la tenían en NULL, extraída de `default_address` (0 activos sin ciudad ahora). Estrategia de Vero este mes: visibilidad primero, monetizar después.

### 21 mayo 2026
Vercel Firewall: bloqueados Vietnam, India, Filipinas (deny). Rate limit 60 req/min en /api (modo log — pasar a deny en ~48h tras revisar dashboard). Curación "Esta semana en el velador" renovada: 9 libros adultos literarios (Poe, Huxley, Padura, Enders, Laborde, Bonnefoy, Hurtado, Porché, Osses). Vendedores destacados: agregados Librería Huertas (fabian, 32 libros) y María Soledad (20 libros). Fix crítico: next revertido de 9.3.3 accidental → 14.2.35. Novedades actualizadas a Día 42. Alias `actualizar` en ~/.zshrc.

### 13 mayo 2026
URLs amigables, FAQ #1 Google, block /search robots.txt, marquee destacados, match automático Se Busca, scripts PrestaShop para Álvaro, limpieza 21 bots, newsletter 106 destinatarios. Nuevos vendedores: Mónica Espinoza (47 libros pendientes) y Patricio Bustos Barros (1 libro activo).

### 5 mayo 2026
Optimización TBT mobile, limpieza listings obsoletos, fix slugs legacy, scan portadas con Claude (modelo actualizado a `claude-sonnet-4-6`), taxonomía chilena completa, clasificador admin pro, backfill tags, nube de tags, home de temporada, lógica vendedores destacados.

### 29 abril 2026
Security hardening: SQL migration, hCaptcha registro, country blocking auth routes, 9 bots eliminados, leaked password protection ON.

### 23 abril 2026 — Día del Libro
LinkedIn + placa + Reddit publicados. Buhardilla 11 libros (adoptó OFERTA mismo día). Fix CTA ficha en prod. Instagram en cola Meta. Reddit primer comentario "le pegaste el palo al gato". SEMrush: 5 keywords núcleo +5 posiciones. Auditoría SEO técnica nota 10/10. Apagado campaña PMax accidental. Pitch email a Diario Financiero. Post r/chileIT exitoso.

### 22 abril 2026
SEMrush: tuslibros.cl único dominio del sector que sube (+2.19%). Bounce 26.2% (3x mejor que el mes, día excepcional). Antonio Lacámara: primer vendedor externo que conectó MP solo. cimlibros 33 listings activos. Newsletter a 19 destinatarios. Mega-commit: 13 ofertas con precio tachado, registro simplificado 3 campos, welcome personalizado, LeadCaptureBar, badge "Recién publicado", /novedades 6 entradas nuevas.

### 21 abril 2026
Fix mobile navbar sin romper dropdowns (confirmado por Vero). Tracking session→user_id. Shipit validado. Rebrand "Gente de Confianza". Mapa arriba por default. H1 nuevo "los que ya leíste". Admin Búsquedas. Landing /libros-usados-chile.

### 19 abril 2026
Replanteo completo home (72% bounce → FeaturedRow above the fold). HeroBar simplificado. Home de ~6000px a ~3800px. Smoke tests E2E ampliados. Lanzamiento "Economía inversa / Se busca". MercadoPago de Margarita (mamá de Vero) conectado al vendedor TusLibros.

### 18 abril 2026
Expo libros usados — primer intento real de onboardear libreros físicos. Footer con LinkedIn + X. QR para expo con UTM trackeable.

### 16 abril 2026 (tarde/noche)
Zdravko autorizó testimonio. Primer vendedor tras beta: Nicolás Eltit (Mein Kampf marcado `deprioritized`). Top 10 destacados con `featured_rank`. Colección Emar y De Rokha. Mapa con markers diferenciados. SEO overhaul: hero reescrito, metadata global, schema Product, sitemap con URLs amigables. Auditoría 30d: bounce 72.6%, 72.9% catálogo invisible, 2 compradores reales.

### 16 abril 2026 (mañana)
Auditoría tracción — 3 días secos. Imágenes WhatsApp universitarios (arriendo y venta).

### 15 abril 2026
Sort home por idioma. Columna `books.language` + backfill 32 libros alemanes. Fix bug publish form ISBN. Badge MercadoPago en perfiles. Libros De La Buhardilla destacado. Fix incidente home 500 (unstable_cache + SSR). Fix SEO listings eliminados → 308. Agente QA Playwright setup. Tab Negocio en admin.

---

## 📚 Libros a buscar en ferias (demanda real abril 2026)

### Ficción literaria (top demanda)
- Autores chilenos: Donoso, Bolaño, Cortázar, Allende, Maturana
- Clásicos cortos sub $8k: Metamorfosis (Kafka), Bartleby (Melville), Crimen y Castigo
- Series completas: Harry Potter (tomos faltantes), Percy Jackson

### No-ficción práctica (buscadores intencionales)
- Hábitos Atómicos (James Clear)
- Libros de productividad/mentalidad (Tim Ferriss, Cal Newport)
- Filosofía accesible: Cartas a un Joven Poeta (Rilke), El Profeta (Gibran)

### Evitar (bajo engagement)
- ❌ Autoayuda genérica sin autor célebre
- ❌ Ediciones muy antiguas sin reimpresiones modernas
- ❌ Textos académicos (ingeniería, medicina)

**Nota**: Actualizar mensualmente con `scripts/top-listings-week.mjs`.
