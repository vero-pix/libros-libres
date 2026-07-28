# tuslibros.cl — Guía para Claude

Marketplace de libros usados en Chile. Producto en producción con ventas reales.

## Stack

> Nota: el global CLAUDE.md menciona Next 16 / Tailwind v4 / AI SDK v6 — eso aplica a otros proyectos de Vero. Este repo sigue en **Next 14 y Tailwind 3** (el resto está en `package.json`).

## Comandos

- `npm run bulk-upload` — script de carga masiva

## Convenciones del código

- **Tabla de perfiles es `users`**, NO `profiles`. Columna de nombre es `full_name`, no `display_name`.
- **`cart_items.added_at`**, no `created_at`.
- **Nunca hardcodear datos que puedan venir de la BD.** Categorías, precios, etc. vienen de Supabase.
- **Seller correcto para scripts masivos**: id `2201d163...` (username `vero`, Providencia). NO usar `9bee4b1a...` (admin sin username ni MP).
- **URLs amigables**: `/libro/[username]/[slug]`. Si el vendedor no tiene username, cae a `/listings/[uuid]`.
- **Bundle checkout**: orders con `bundle_id` compartido, una preferencia MP, `external_reference = bundle_id`. Shipping/fee solo en la primera order del bundle.
- **Eventos del carrito**: dispatch `window.dispatchEvent(new CustomEvent("cart-updated"))` al agregar/eliminar para que el badge del navbar se refresque.
- **Migraciones**: `supabase/migrations/` es SQL versionado — aplicar manual en el SQL Editor si no hay CLI.

## Reglas de trabajo

- **Español chileno** ("prueba", "avísame"). Nunca argentino ni neutro.
- **Voz en 1ª persona** (yo/nosotros/Vero) en copy orientado al cliente. No marca impersonal.
- **Humor confesional** en marketing, no frases de agencia.
- **Probar siempre en local primero** (rama + `npm run dev`) antes de push a main.
- **`git push` a main: autorizado, sin preguntar** (27-07-2026). El **deploy a producción sí** requiere autorización explícita de Vero. Esto reemplaza la regla del CLAUDE.md global, que sigue vigente para los otros proyectos.
- **Nunca commitear con `--no-verify`** ni saltarse hooks.
- Preferir editar archivos existentes sobre crear nuevos.

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
| Features pendientes y entregadas | `ROADMAP.md` | |
| Onboarding de vendedores | `docs/MENSAJES-ONBOARDING-VENDEDOR.md` · `docs/guia-vender-v2.html` | |

**Documentos históricos — NO usar como fuente:**

- `MODELO-NEGOCIO.md` — congelado en abril 2026. Describe el arriendo como vivo (descontinuado el 24-07-2026) y la comisión como si fuera sobre logística. Ya contaminó un plan completo.
- `SESION-*.md`, `docs/*-2026-0[456]-*.md` — registros de sesiones pasadas, no estado actual.

Otras carpetas:

- `docs/` — material de trabajo, fotos, research (no commitear HEICs grandes)
- `ideas/` — ignorado en git, material personal

## Trabajo desde sesiones de chat

Vero trabaja desde chats (Cowork/Claude) que producen prompts, documentos y piezas. **Ese material debe quedar en el repo, no en la carpeta temporal de la sesión** — si no, se pierde y el próximo agente parte a ciegas.

Convención:

- Documentos de estrategia y estado → `docs_desde_claude/`
- Prompts ejecutables para Claude Code → `docs/prompts/`
- Piezas y material de apoyo → `docs/`
- Todo lo que se vuelva fuente de verdad → agregarlo a la tabla de arriba

Regla: si un archivo importa la semana que viene, va en el repo.
