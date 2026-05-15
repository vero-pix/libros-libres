# tuslibros.cl — Roadmap

Última actualización: 15 mayo 2026

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

- [ ] **Dominio librolibre.cl** — vence 24 mayo 2026. Titular: Cinta Carmesí. Si no renueva, registrar al tiro ($9.990/año, NIC Chile, 30 días gracia post-vencimiento).

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

---

### SEO — Landings estratégicas

Cadencia sugerida: una landing por día hábil. Cada una apunta a una keyword con intención clara, usa FAQPage + HowTo + BreadcrumbList schema, y se agrega al sitemap. Modelo base: `/vender-libros-usados` (deployada 15 mayo).

| Ruta | Keyword objetivo | Vol | KD | Intent | Estado |
|---|---|---|---|---|---|
| `/libros-usados-chile` | libros usados chile | — | — | comprador genérico | ✅ Deployada |
| `/vender` | vender libros usados en chile | — | — | vendedor | ✅ Deployada |
| `/vender-libros-usados` | vender libros usados | 140 | 23 | vendedor informacional | ✅ 15 mayo |
| `/libros-usados-santiago` | libros usados santiago | — | — | comprador local RM | ⬜ Pendiente |
| `/libros-usados-providencia` | libros usados providencia | — | — | comprador local Providencia | ⬜ Pendiente |
| `/comprar-libros-usados` | comprar libros usados | — | — | comprador informacional | ⬜ Pendiente |
| `/libros-escolares-usados` | libros escolares usados | — | — | temporada escolar | ⬜ Pendiente |

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

**Ciclo de vida del usuario**
- [ ] **Re-engage email 3 días post-registro** — si user no publicó ni compró en 3 días, email recordatorio con link a ISBN scanner o libro destacado relevante.
- [ ] **Carrito abandonado** — email automático a quien deja libros sin comprar. Álvaro lo pidió explícitamente.
- [ ] **Retargeting por email** — sugerencias basadas en lo que el usuario miró. Pedido por Álvaro.

**Catálogo y búsqueda**
- [ ] **Full-text search con `pg_trgm` + GIN index** — hoy el buscador usa `LIKE` sin índice. 10-100x más rápido y soporta typos. Alta prioridad cuando catálogo supere 500 libros activos.
- [ ] **Search empty state review** — 80% bounce en /search. Auditar qué ve alguien cuando busca algo que no existe.
- [ ] **Rotación automática FeaturedRow** — 191 de 240 listings sin una sola visita en 30d. Exponer los enterrados con pool rotativo.

**Reputación**
- [ ] **Sistema de reputación por vendedor** — tabla `reviews` existe pero vacía. UI básica en perfil existe sin datos. Álvaro y otros lo piden: historial independiente por librería, estilo ML.

---

### 🟠 Media prioridad

**UX y features**
- [ ] **Fix HeroBar simplificado** — sacar las 5 cards horizontales (redundan con feature sections ya movidas). Alto impacto, bajo esfuerzo.
- [ ] **Fix Libros Huertas avatar** — removido temporalmente del carrusel de vendedores destacados. Pedirle foto por WhatsApp para reactivar.
- [ ] **Navbar mobile: Inicio/Novedades en dropdown hamburger** — libera la nav row en mobile.
- [ ] **PostHog session replay** — para entender POR QUÉ rebotan (hoy solo sabemos CUÁNTO). Activar cuando haya presupuesto.

**Modelo de negocio**
- [ ] **Sistema de ofertas entre usuarios** — tabla `offers`, endpoint y UI para que compradores propongan precio. Decidir si es prioridad. ⚠️ Los "13 ofertas" del commit de abril son precios con `original_price` tachado, NO negociación.
- [ ] **Flujo de devolución de arriendos** — arriendo se crea y cobra pero no hay tracking "libro debe devolverse en X días" ni confirmación de devolución.
- [ ] **Rewards de referidos** — código y estadísticas funcionan pero no se entregan descuentos/créditos al cumplir. Sin incentivo real, no convierte.
- [ ] **Componente testimonios escalable** — hoy TestimonialBanner hardcodeado. Cuando haya ≥3, migrar a tabla `testimonials` + widget.

**Datos y calidad**
- [ ] **Hobsbawm "Un tiempo de rupturas"** — quedó con `featured=true` sin `featured_rank`. Limpiar: `update listings set featured=false where featured_rank is null and featured=true;`

---

### SEO

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

### Hitos recientes (mayo 2026)
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
