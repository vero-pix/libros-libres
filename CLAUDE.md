# tuslibros.cl — Guía para Claude

Marketplace de libros usados en Chile. Producto en producción con ventas reales.

## Stack

- **Next.js 14.2** (App Router) + TypeScript + React 18
- **Tailwind v3** — **NO hay shadcn/ui** (verificado 10-09-2026: cero `@radix-ui`, cero `class-variance-authority`, sin `components.json`). `components/ui/` son componentes propios, coincide el nombre de la carpeta y no el contenido. Tampoco hay `framer-motion` ni `lucide-react`: los iconos son SVG en línea
- **Supabase** (Postgres + Storage + Auth)
- **MercadoPago** split payment (tokens de vendedor + marketplace_fee)
- **Shipit** para etiquetas de courier
- Deploy en **Vercel**

> Nota: el global CLAUDE.md menciona Next 16 / Tailwind v4 / AI SDK v6 — eso aplica a otros proyectos de Vero. Este repo sigue en **Next 14 y Tailwind 3** (el resto está en `package.json`).

## Comandos

- `npm run dev` — local en :3000
- `npm run build` — build de producción (verificar antes de decir "listo")
- `npm run lint`
- `npm run bulk-upload` — script de carga masiva

## Estructura relevante

- `app/(main)/` — páginas públicas (home, search, listings, checkout, perfil, mis-pedidos, mis-ventas)
- `app/api/` — endpoints (orders, cart, webhooks/mercadopago, listings)
- `components/` — UI por dominio (checkout, listings, sales, home, ui)
- `lib/` — clientes Supabase (server/browser), mercadopago, shipit, notifications, genreNormalizer
- `scripts/` — carga masiva, enriquecimiento, utilidades de migración
- `supabase/migrations/` — SQL versionado (aplicar manual en SQL Editor si no hay CLI)

## Convenciones del código

- **Tabla de perfiles es `users`**, NO `profiles`. Columna de nombre es `full_name`, no `display_name`.
- **`cart_items.added_at`**, no `created_at`.
- **Nunca hardcodear datos que puedan venir de la BD.** Categorías, precios, etc. vienen de Supabase.
- **Seller correcto para scripts masivos**: id `2201d163...` (username `vero`, Providencia). NO usar `9bee4b1a...` (admin sin username ni MP).
- **URLs amigables**: `/libro/[username]/[slug]`. Si el vendedor no tiene username, cae a `/listings/[uuid]`.
- **Bundle checkout**: orders con `bundle_id` compartido, una preferencia MP, `external_reference = bundle_id`. Shipping/fee solo en la primera order del bundle.
- **Eventos del carrito**: dispatch `window.dispatchEvent(new CustomEvent("cart-updated"))` al agregar/eliminar para que el badge del navbar se refresque.
- **Migraciones**: `supabase/migrations/` es SQL versionado — aplicar manual en el SQL Editor si no hay CLI.
- **WhatsApp del vendedor**: pasar SIEMPRE por `mostrarWhatsAppVendedor()` de `lib/whatsapp-policy.ts`. No agregar botones de `wa.me` con el teléfono del vendedor sin esa guarda — es lo que hacía que la venta se cerrara fuera del sitio. El WhatsApp de soporte de Vero (`56994583067`) no tiene esta restricción.
- **Buzón de Vero = `VERO_INBOX` de `lib/veroInbox.ts`**, nunca `"vero@tuslibros.cl"` a mano en `to`/`reply_to`. Lo controla `VERO_INBOX_EMAIL` en Vercel (desde el 04-09-2026 apunta al correo personal porque Google Workspace está caído por impago: los correos SALEN por Resend, pero nada ENTRA a @tuslibros.cl). Los `from` siguen siendo @tuslibros.cl. Cuando Workspace vuelva, borrar la variable.
- **Contacto público = WhatsApp de soporte (`56994583067`)**, no `mailto:vero@tuslibros.cl`. Footer, FAQ, devoluciones y alianzas ya lo usan (04-09-2026).
- **Landings antes que fichas.** Las fichas de libro casi no rankean solas (795 fichas = 285 clics/90d; 79 landings = 2.327). Para posicionar un autor: entrada en `app/(main)/autor/[slug]/authors.config.ts` + match en `lib/authorLandings.ts`. Para un tema: copiar `app/(main)/antroposofia/page.tsx` y agregarla a `app/sitemap.ts` y `app/llms.txt/route.ts`. Para raros/caros: marcar `is_collectible`, que `/libros-antiguos` los muestra. Y que las fichas enlazadas tengan sinopsis real: la plantilla "Descubre X de Y. Este libro usado…" en `books.description` deja la meta description vacía.
- **Nunca dejar una pantalla de compra sin salida.** Si el vendedor no puede cobrar, tiene que haber WhatsApp, mensajería interna o `/solicitudes` — nunca solo un cartel que informe el bloqueo. Pasó en el checkout con despacho por courier hasta el 25-08-2026.

## Reglas de trabajo

- **Español chileno** ("prueba", "avísame"). Nunca argentino ni neutro.
- **Voz en 1ª persona** (yo/nosotros/Vero) en copy orientado al cliente. No marca impersonal.
- **Humor confesional** en marketing, no frases de agencia.
- **Probar siempre en local primero** (rama + `npm run dev`) antes de push a main.
- **`git push` a main: autorizado, sin preguntar** (27-07-2026). El **deploy a producción sí** requiere autorización explícita de Vero. Esto reemplaza la regla del CLAUDE.md global, que sigue vigente para los otros proyectos.
- **Nunca commitear con `--no-verify`** ni saltarse hooks.
- Preferir editar archivos existentes sobre crear nuevos.
- **El botón sale de `components/ui/Button.tsx`** (`Button` / `ButtonLink`), no se escribe inline. Antes existía en ~15 variantes con cuatro radios y cuatro alturas.
- **La portada del libro sale de `components/listings/BookCover.tsx`.** Estaba repetida en once archivos, y la cubierta dibujada para los libros sin foto existía solo en la grilla: en los otros diez salía texto plano, un icono gris o un emoji.
- **Las animaciones se definen en `tailwind.config.ts`.** No usar clases de `tailwindcss-animate` (`animate-in`, `fade-in`, `slide-in-from-*`): el plugin NO está instalado y esas clases no existen en el CSS. Pasó con siete, entre ellas el `animate-shake` del error del checkout. Comprobar con `grep -o "animate-[a-z-]*" .next/static/css/*.css`.

## `/novedades`

- **No tocarla salvo que Vero lo pida explícitamente** (27-07-2026). Reemplaza la regla anterior de actualizarla al cerrar cada sesión.

## Antes de terminar una tarea

1. `npm run build` pasa sin errores relevantes
2. Si es UI, probar el flujo en el navegador (golden path + edge case)
3. Si toca BD, verificar que la migración se aplicó en Supabase
4. Commit con mensaje descriptivo en español, sin `--no-verify`

## Memoria y contexto histórico

La memoria persistente del asistente vive en `~/.claude/projects/-Users-veronicavelasquez-dev-libros-libres/memory/` (consolidada el 28 may 2026 desde las carpetas previas de iCloud/Desktop; las antiguas quedaron de respaldo). `MEMORY.md` es el índice — arranca por ahí para entender sesiones previas, feedback acumulado y pendientes. No duplicar en este archivo lo que ya está en memoria: este CLAUDE.md es para convenciones estables; la memoria es para contexto evolutivo.

## Dónde está cada cosa (fuentes canónicas)

Antes de afirmar cualquier dato de negocio, mirar acá. Si un documento contradice a estas fuentes, gana la fuente.

| Tema | Fuente | Nota |
|---|---|---|
| Comisiones | `lib/commissions.ts` | Código, no documento. **8% sobre el precio del libro, igual para todos.** Los tramos por plan (librero 5% / librería 3%) se eliminaron el 26-07-2026: nunca aplicaron a nadie. Solo se cobra si la venta pasa por MercadoPago o despacho por courier; por WhatsApp en persona, $0 |
| Políticas, despacho, devoluciones, URLs | `docs/KB-TUSLIBROS.md` | Verificado contra el sitio publicado |
| Plan de crecimiento vigente | `docs_desde_claude/SPRING_15_DAYS.md` | Sprint de 15 días |
| Visión de largo plazo | `docs_desde_claude/MASTER_PLAN.md` | |
| Features pendientes y entregadas | `ROADMAP.md` | Actualizado el 25-08-2026. El plan de julio que sigue más abajo en ese archivo está marcado como histórico: su diagnóstico quedó superado |
| Onboarding de vendedores | `docs/MENSAJES-ONBOARDING-VENDEDOR.md` · `docs/guia-vender-v2.html` | |
| Cuándo se muestra el WhatsApp del vendedor | `lib/whatsapp-policy.ts` | Código, no documento. **Con MercadoPago conectado NO se muestra** (competía con el botón de comprar); sin MP se muestra siempre, incluso con courier. **Experimento CERRADO el 10-09-2026: se queda.** Medido a 17 días — la captura pasó de 0,8% a 37,6% y el volumen no cayó ($71.249/día antes, $63.351/día después). No reabrir la pregunta sin volver a medir |
| Tasa de captura (la métrica del negocio) | `scripts/_captura.mjs` | Cuánto del volumen vendido pasa por la plataforma y deja comisión. Baseline pre-experimento (agosto al día 25): 0,8%, $800. **Leído el 10-09-2026: septiembre va en 40,7% y $22.823 de comisión en 10 días**, contra $4.880 en todo agosto. **Volver a leer ~10-10-2026.** ⚠️ Los `scripts/_*.mjs` NO están versionados (los tapa el `.gitignore`): existen solo en el disco de Vero y no aparecen en un worktree |
| Estado de las landings de Vero (Wilber, Steiner, antroposofía, antiguos) y del correo con Workspace caído | `docs_desde_claude/ESTADO_2026-09-04.md` | Medir el **18-09-2026** con `npm run seo:gsc`. Pendiente: 2ª tanda de sinopsis (~145 fichas de vero con plantilla) |
| Lectura del experimento del WhatsApp | `scripts/_captura_experimento.mjs` | Parte agosto-septiembre en antes/después del 25-08 y muestra el detalle diario. Diagnóstico vigente: `docs_desde_claude/DIAGNOSTICO_2026-09-02.md`. **Resultado 10-09-2026: 1 venta pagada en los 24 días previos contra 25 en los 17 siguientes.** Ojo al leerlo: 12 de esas 25 son de `libro.de.ocasion`, que se registró el 29-08 con MP y 83 libros. Las otras 13 son de siete vendedores antiguos, que antes cerraban por WhatsApp — ahí está la prueba de que el cambio es del experimento y no del vendedor nuevo |

**Documentos históricos — NO usar como fuente:**

- `MODELO-NEGOCIO.md` — congelado en abril 2026. Describe el arriendo como vivo (descontinuado el 24-07-2026) y la comisión como si fuera sobre logística. Ya contaminó un plan completo.
- `SESION-*.md`, `docs/*-2026-0[456]-*.md` — registros de sesiones pasadas, no estado actual.

Otras carpetas:

- `docs/` — material de trabajo, fotos, research (no commitear HEICs grandes)
- `ideas/` — ignorado en git, material personal

## Trabajo desde sesiones de chat

Vero trabaja desde chats (Cowork/Claude) que producen prompts, documentos y piezas. **Ese material debe quedar en el repo, no en la carpeta temporal de la sesión** — si no, se pierde y el próximo agente parte a ciegas.

Convención:

- Documentos de estrategia y estado → `docs_desde_claude/` — **carpeta PRIVADA**
- Prompts ejecutables para Claude Code → `docs/prompts/`
- Piezas y material de apoyo → `docs/`
- Todo lo que se vuelva fuente de verdad → agregarlo a la tabla de arriba

Regla: si un archivo importa la semana que viene, va en el disco del repo. Pero
ojo con la diferencia entre *estar en la carpeta* y *estar versionado*:

> ⚠️ **`docs_desde_claude/` está en `.gitignore` a propósito y NO se commitea.**
> Este repo es **público** ([[reference_repo_publico]]) y esa carpeta guarda
> material que no puede serlo: el borrador de venta del sitio
> (`forobeta-venta-tuslibros.md`), el teléfono personal de Vero, cifras internas.
> **Nunca forzar con `git add -f`** para meter algo ahí — si un documento tiene
> que quedar versionado, va en `docs/` después de revisar que no exponga nada.
> (El 30-07-2026 se forzó el informe del lote de joyas y hubo que revertirlo.)
