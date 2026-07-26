# Prompt para Claude Code — Cierre del cambio de copy

Continuación de `ca85cff` (commiteado en `main`, sin push). Tres commits separados y después push.

---

## Commit 1 — Arreglar el JSON-LD de FAQPage

**Defecto que tú mismo detectaste:** el schema hace `typeof item.a === "string" ? item.a : item.q`. Como la mayoría de las respuestas son JSX, Google recibe la pregunta duplicada como respuesta en casi las 15 entradas.

Arreglar extrayendo el texto plano del JSX en lugar de caer al fallback de la pregunta. Si una respuesta no puede serializarse a texto, **omitir esa entrada del schema** — es preferible a publicar una respuesta falsa.

Validación: pegar el JSON-LD renderizado de `/faq` en el Rich Results Test de Google y confirmar que ninguna `acceptedAnswer` repite su `name`.

---

## Commit 2 — Condicionar la política de devoluciones al pago por plataforma

**Decisión de Vero:** la garantía de 7 días aplica **solo a compras pagadas a través de la plataforma** (MercadoPago). No es posible reembolsar dinero que nunca pasó por TusLibros.

Editar `/devoluciones`:

- Agregar al inicio, antes de "Cuándo puedes devolver", una condición clara: la garantía cubre las compras pagadas con MercadoPago dentro de tuslibros.cl. Las compras coordinadas directamente entre comprador y vendedor por WhatsApp son un acuerdo entre las partes y no pasan por este proceso.
- Redactarlo sin tono defensivo ni legalista. La razón es simple y honesta: el reembolso se procesa devolviendo el pago, y eso solo existe si el pago pasó por la plataforma.
- Mantener la voz en primera persona de Vero y el encuadre de confianza que ya tiene la página.

Recién después de esto, en `/como-funciona` puede afirmarse la devolución como un beneficio propio de la vía con MercadoPago. Ajustar esa redacción si en `ca85cff` quedó en condicional.

---

## Commit 3 — Borrar fuentes muertas

- Eliminar `content/como-funciona.mdx` y `content/faq.mdx`. No se renderizan (solo `/terminos` y `/privacidad` usan `next-mdx-remote`) y contienen datos falsos: "Libros Libres" y "no cobra comisión".
- Confirmar antes de borrar que ninguna ruta los importa.

Motivo: son la misma clase de problema que `MODELO-NEGOCIO.md` — documentos muertos que afirman cosas falsas y esperan a que alguien los lea.

---

## Después

`git push` a `main`. Confirmar el deploy en Vercel y verificar en producción:

- `/como-funciona`, `/faq`, `/devoluciones` responden 200
- El porcentaje de comisión aparece y coincide con `lib/commissions.ts`
- El JSON-LD de `/faq` valida limpio

---

## Restricciones

- Un commit por causa, como está arriba. No mezclar.
- No tocar homepage, checkout ni flujos de MercadoPago.
- Español de Chile, tú/usted. Nunca voseo.
- No inventar plazos, coberturas ni cifras.
