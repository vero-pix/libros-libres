# Prompt para Claude Code — Comisión única de 8%

**Decisión de Vero (26-07-2026):** la comisión es **8% sobre el precio del libro, para todos**. No hay tramos ni planes. Los 5% de librero y 3% de librería se eliminan del producto, no solo del copy.

**Contexto:** los 202 usuarios tienen `plan = free`, así que los tramos publicados hoy en `/como-funciona` y `/faq` no aplican a nadie — ni a CIM ni a Buhardilla. El copy dice algo que es falso en la práctica.

---

## 1 · Copy

Quitar toda mención a 5% librero y 3% librería en `/como-funciona` y `/faq`. Dejar únicamente **8% sobre el precio del libro**, sin condicionales ni "según tu tipo de cuenta".

Redactarlo simple y directo. Sirve algo del estilo: *"Cuando vendes con MercadoPago o despacho por courier, cobro un 8% del precio del libro. Si coordinas por WhatsApp y entregas en persona, no pagas nada."*

Mantener la voz en primera persona de Vero.

## 2 · Código

Simplificar `lib/commissions.ts` a una tasa única de 8%.

Dejar tramos muertos en el código es la misma clase de problema que los documentos congelados que ya nos costaron un día: el próximo que lea el archivo va a creer que existen tres planes.

Antes de borrar, verificar qué consume esa función y que ningún cálculo dependa de `tipo_vendedor` o `plan`. Si algo depende, adaptarlo a la tasa única en vez de dejarlo colgando.

## 3 · Instrumentación

El parámetro `tipo_vendedor` que quedó en los eventos de GA4 del commit `0955003` ya no distingue nada: sería constante para todos. Quitarlo de los eventos y de la lista de dimensiones a registrar.

## 4 · Coherencia

Revisar que no queden menciones a los tramos en otras superficies: `docs/KB-TUSLIBROS.md` ya está corregida, pero buscar en `content/`, `app/` y `components/` por si hay copy con "librero", "librería" o porcentajes sueltos.

---

## Restricciones

- No tocar homepage ni el flujo de checkout más allá del cálculo de comisión.
- Español de Chile, tú/usted. Nunca voseo.
- Migración versionada si hay que tocar la base.
- Commit enfocado, separado de los dos que están sin pushear.

## Validación

1. `npm run build` limpio.
2. `/como-funciona` y `/faq` muestran solo el 8%, sin rastro de tramos.
3. El cálculo de comisión en un checkout de prueba da 8% del precio del libro.
4. Ninguna búsqueda de "5%", "3%", "librero" o "librería" devuelve copy vigente sobre comisiones.
