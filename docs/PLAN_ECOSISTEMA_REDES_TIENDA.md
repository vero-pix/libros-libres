# Plan de ecosistema tuslibros.cl — Sitio + Redes + Tienda + Medición

> Objetivo: reconstruir, mejor que antes, un sistema integrado donde el **sitio es el centro** y las redes/tienda de Meta son satélites que traen tráfico y descubrimiento — sin fragmentar la venta ni perder la comisión. No es "publicar por publicar": es un motor que prioriza tu inventario, engancha a los vendedores y se mide.
> Estado: plan maestro para revisión de Vero. Decisiones abiertas marcadas **[DECISIÓN]**.

---

## 1. Principio rector (esto ordena todo)

**tuslibros.cl (el sitio) es la fuente de la verdad y donde ocurre la transacción.** Ahí vive el catálogo real, MercadoPago (split + comisión) y el despacho (Shipit). Todo lo demás —Instagram, Facebook, tienda de Meta, píxel— existe para **llevar gente al sitio**, no para reemplazarlo.

Consecuencia práctica: la tienda de Meta se arma en modo **catálogo con checkout en el sitio** (el botón "comprar" lleva a tuslibros.cl), NO checkout dentro de Facebook. Así conservas comisión, logística y datos. Esto es explícitamente "mejor que antes".

---

## 2. Estado actual (lo que ya tienes recuperado)

**Activos vivos bajo tu portafolio comercial ("Veronica Velasquez"):**
- **Instagram `tuslibros.cl`** — recuperado, dentro del portafolio, 3 personas con acceso.
- **Página FB `Tuslibros.cl`** — la buena: logo de libros apilados, 402 seguidores, username `vendetuslibros.cl`, 3 personas con acceso.
- **Sitio `tuslibros.cl`** — marketplace en producción (Next.js, Supabase, MercadoPago, Shipit).

**Ruido a limpiar:**
- Página duplicada **"Tus Libros"** (T morada) — vieja, genera confusión. **No borrar aún**; primero confirmar que no tenga seguidores/historia que rescatar, luego archivar o fusionar.
- Otras Páginas del portafolio (2wash, LaMargot.cl, Margot) — no son de este proyecto, se dejan como están.

**Gaps vs. el objetivo:**
1. IG ↔ Página FB sin vinculación confirmada.
2. Sin tienda/catálogo de Meta reconstruida.
3. Sin píxel ni Conversions API (medición y retargeting).
4. Sin motor de contenido que **priorice tus libros**.
5. Sin mecánica de enganche a vendedores.

---

## 3. Arquitectura objetivo (7 capas)

| Capa | Qué es | Rol |
|------|--------|-----|
| 1. Sitio | tuslibros.cl | Fuente de verdad · checkout · comisión · despacho |
| 2. Hub de control | Meta Business Suite / Portfolio | Administra Página + IG + catálogo + píxel en un lugar |
| 3. Presencia | Página FB + Instagram | Marca, descubrimiento, tráfico |
| 4. Comercio | Meta Shop + Catálogo (Commerce Manager) | Vitrina de libros; "comprar" → sitio. Alimentado por **feed automático** |
| 5. Medición | Meta Pixel + Conversions API + GA4 + UTM | Retargeting, atribución, saber qué red vende |
| 6. Contenido | Generador (prioriza libros de Vero) + Metricool | Publicación diaria y programada |
| 7. Comunidad | Mecánica de enganche a vendedores | Retención y crecimiento de oferta |

El corazón nuevo son las capas **4, 5 y 7** — son las que no tenías bien resueltas y las que hacen la diferencia.

---

## 4. Prioridad de contenido (regla dura)

Las publicaciones deben **privilegiar tus propios libros a la venta** (tu cuenta vendedora en el sitio: seller `vero`, Providencia — id `2201d163…`), y recién después destacar a otros vendedores.

**Jerarquía de selección para cada post:**
1. **Primero:** libros activos de tu cuenta (`seller.username = 'vero'`) con foto real y stock.
2. **Segundo (para enganchar vendedores):** libro destacado de otro vendedor — rotando, con crédito.
3. **Relleno:** novedades/ofertas/colección del catálogo general.

> Ajuste técnico al generador: agregar un flag de prioridad por vendedor (`--seller vero` o peso por defecto a tu id) para que el 60–70% de los posts sean tu inventario y el resto rote vendedores. Tarea para Claude Code — es un cambio chico sobre `scripts/generar-post-social.mjs`.

---

## 5. Mecánica de enganche a vendedores (la capa que casi nadie hace)

No basta con publicar el libro de un vendedor: hay que **hacérselo saber y darle motivo para volver y traer más**.

**Mecánicas propuestas (de menor a mayor esfuerzo):**
1. **"Tu libro salió en nuestro Instagram"** — cuando el generador destaca el libro de un vendedor, se le avisa (email/notificación in-app, ya existe `lib/notifications`). Efecto: el vendedor se siente visto, reshareа a su red = alcance gratis.
2. **Vendedor de la semana** — spotlight rotativo en FB/IG. Reconocimiento → fideliza y atrae oferta nueva.
3. **Incentivo por buena foto** — solo entran a redes los libros con foto propia de calidad → empuja a subir mejores fotos (mejora todo el catálogo y el SEO).
4. **Bucle de referidos** — ya existe tabla `referrals`: premiar al vendedor que trae vendedores, difundido en redes.
5. **Ranking/gamificación ligera** — "los libros más vistos de la semana" desde redes, con link al sitio.

> Principio: cada vez que tocas a un vendedor, le das (a) visibilidad y (b) una razón para publicar más y compartir. Eso hace crecer la oferta, que es tu activo escaso.

---

## 6. Medición (píxel y todo)

1. **Meta Pixel** instalado en tuslibros.cl (todas las páginas) — mide visitas, vistas de producto, checkout, compra.
2. **Conversions API (CAPI)** — respaldo server-side del píxel (más preciso, resiste bloqueadores). Se conecta desde el backend a eventos reales de MercadoPago.
3. **GA4 + UTM** — cada link de redes con `utm_source/medium/campaign` para separar qué red y qué post traen tráfico y ventas.
4. **Retargeting** — con el píxel poblado, campañas a quienes vieron un libro y no compraron (fase avanzada, opcional).
5. **Revisión mensual** — un tablero: tráfico por red, productos vistos, conversión, costo si hay ads.

> Tareas de dev (Claude Code): instalar píxel + CAPI, mapear eventos (ViewContent, AddToCart, Purchase) a tus flujos reales. **No tocar** checkout ni MercadoPago core, solo instrumentar.

---

## 7. Roadmap por fases (ordenado por impacto/esfuerzo)

### Fase 0 — Consolidar y blindar (hoy/esta semana) · esfuerzo bajo
- [ ] Confirmar admin de la Página `Tuslibros.cl` y vincular Instagram `tuslibros.cl` (Business Suite → Cuentas vinculadas).
- [ ] Seguridad total: 2FA con app + códigos de recuperación guardados, en IG y en la cuenta personal admin de FB.
- [ ] Corregir bio de la Página (typo "comisi´on" → "comisión").
- [ ] Decidir qué hacer con la Página duplicada "Tus Libros".

### Fase 1 — Medición base · esfuerzo medio (dev)
- [ ] Instalar Meta Pixel + CAPI en tuslibros.cl.
- [ ] Estándar de UTMs para todos los links de redes.

### Fase 2 — Tienda/Catálogo de Meta sincronizado · esfuerzo medio-alto (dev)
- [ ] Generar **feed de catálogo automático** desde Supabase (XML/CSV en `tuslibros.cl/catalogo-meta.xml`) que Meta actualiza solo: libros vendidos desaparecen, nuevos entran.
- [ ] Conectar el feed en **Commerce Manager**; checkout apuntando al sitio.
- [ ] (Opcional) mismo feed sirve para Google Merchant.

### Fase 3 — Motor de contenido · esfuerzo bajo-medio
- [ ] Ajustar generador para **priorizar libros de Vero** (60–70%) + rotar vendedores.
- [ ] Conectar **Metricool** y programar semana completa de una corrida.
- [ ] Definir cadencia (sugerido: 4–5 posts/semana + stories).

### Fase 4 — Comunidad y enganche · esfuerzo medio
- [ ] Automatizar aviso "tu libro salió en redes" a vendedores.
- [ ] Lanzar "Vendedor de la semana".
- [ ] Difundir bucle de referidos.

---

## 8. Métricas de éxito (para saber si funciona)

- **Tráfico social → sitio** (GA4 por UTM): meta inicial, X sesiones/semana desde IG+FB.
- **Conversión asistida por redes** (píxel): ventas donde el primer toque fue social.
- **Crecimiento de oferta**: nuevos vendedores / nuevos listings atribuibles a la mecánica de enganche.
- **Engagement de seguidores**: crecimiento de los 402 de FB y del IG recuperado.
- **Reshares de vendedores**: cuántos comparten cuando salen destacados.

---

## 9. Decisiones

**Cerradas (19 jul 2026):**
1. **Modelo de tienda:** ✅ catálogo con checkout en el sitio. El "comprar" siempre lleva a tuslibros.cl; se conserva comisión, MercadoPago y Shipit.
2. **Feed de catálogo:** ✅ automático desde Supabase. Meta se actualiza solo; nada manual.
3. **Mezcla de contenido:** ✅ 70% libros de Vero / 30% vendedores destacados.

**Aún por definir:**
4. **Página duplicada "Tus Libros":** archivar, fusionar o dejar. → Revisar seguidores/historia antes de decidir.
5. **Ads/retargeting:** ¿entra ahora o después de tener píxel poblado? → Sugiero después.
6. **Qué hace quién:** las tareas de dev (píxel, feed, ajuste del generador) → Claude Code; la operación de redes y Business Suite → tú, con mi guía.
