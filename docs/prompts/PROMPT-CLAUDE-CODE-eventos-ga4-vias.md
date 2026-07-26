# Prompt para Claude Code — Instrumentar la elección de vía en GA4

**Objetivo:** saber si el comprador elige WhatsApp directo por preferencia real o por falta de información sobre la vía con MercadoPago.
**Alcance:** solo eventos de analítica. Cero cambios de lógica, de UI o de checkout.
**Contexto temporal:** el copy de `/como-funciona` y `/faq` se acaba de modificar. Esta instrumentación crea el antes/después.

---

## Contexto

TusLibros ofrece dos caminos desde la ficha de un libro: contactar al vendedor por WhatsApp (sin comisión) o comprar con MercadoPago (con comisión, e incluye protección de pago y derecho a devolución en 7 días).

Históricamente casi todo ocurre por la vía directa, pero **no sabemos por qué**. Hay tres explicaciones posibles y hoy son indistinguibles:

1. El comprador prefiere el trato directo.
2. El comprador no sabía qué le daba la otra vía.
3. La otra vía **ni siquiera estaba disponible** en esa publicación, porque el vendedor no tiene MercadoPago conectado.

La tercera es la que arruina cualquier medición ingenua: si comparas clics de WhatsApp contra clics de MercadoPago sin saber en cuántas fichas el botón de MercadoPago existía, el resultado no significa nada.

GA4 ya está instalado en el sitio.

---

## Eventos a implementar

### 1. `ver_publicacion`

Se dispara al cargar la ficha de un libro. **Es el evento más importante**: sin él no hay denominador.

Parámetros:

| Parámetro | Tipo | Notas |
|---|---|---|
| `listing_id` | string | |
| `mp_disponible` | boolean | **Crítico.** Si el vendedor tiene MercadoPago conectado y el botón se renderiza |
| `whatsapp_disponible` | boolean | Si el vendedor tiene teléfono registrado |
| `precio` | number | |
| `categoria` | string | |
| `comuna` | string | Comuna del listing |
| `tipo_vendedor` | string | particular / librero / librería — determina el tramo de comisión |

### 2. `click_whatsapp_vendedor`

Al hacer clic en el botón de contacto por WhatsApp de la ficha. Mismos parámetros que `ver_publicacion`.

### 3. `click_comprar_mercadopago`

Al hacer clic en comprar con MercadoPago. Mismos parámetros.

**No modificar el flujo de checkout.** Solo agregar la llamada al evento antes de la acción existente.

### 4. `click_whatsapp_soporte`

Al hacer clic en el WhatsApp del header (`wa.me/56994583067`). Parámetro: `pagina_origen`.

Permite separar consultas de soporte de contactos comerciales.

---

## Qué queremos poder responder

Con estos eventos, en dos semanas debería poderse calcular:

- De las fichas donde **ambas** vías estaban disponibles, qué proporción eligió cada una. Esta es la única cifra que mide preferencia real.
- Qué proporción del catálogo visto tiene MercadoPago disponible. Si es baja, el problema no es de mensaje sino de cobertura.
- Si la proporción cambia entre el antes y el después del cambio de copy.
- Si la elección varía según el precio del libro o la distancia (comuna del listing).

---

## Archivos a modificar

Localizar el componente de la ficha de publicación (probablemente bajo `app/(main)/libro/...` o el componente de detalle de listing) y el componente de header con el enlace de WhatsApp.

**Buscar antes de asumir rutas.** No dar por hecho nombres de archivo ni de props.

---

## Restricciones

- **No tocar** la lógica de checkout ni la integración de MercadoPago. Solo agregar la llamada al evento antes de la acción ya existente.
- **No cambiar** UI, textos, estilos ni comportamiento visible.
- **No introducir** dependencias nuevas. Usar el mecanismo de GA4 ya presente en el sitio.
- **No registrar datos personales** en los parámetros: nada de nombres, teléfonos, correos ni identificadores de usuario. Solo `listing_id` y atributos del listing.
- Los eventos no deben romper la navegación si GA4 falla o está bloqueado por un adblocker. Envolver en try/catch o verificar existencia antes de llamar.
- Español de Chile en cualquier texto o comentario. Nunca voseo.
- Deploy enfocado: solo esta instrumentación.

---

## Validación

1. `npm run build` sin errores.
2. En el navegador, con GA4 DebugView activo: abrir una ficha de libro y confirmar que llega `ver_publicacion` con todos los parámetros poblados.
3. Confirmar que `mp_disponible` refleja correctamente si el botón está o no presente. **Probar con un listing de vendedor sin MercadoPago conectado.**
4. Hacer clic en ambos botones y confirmar que llegan los dos eventos de clic.
5. Confirmar que el flujo de compra sigue funcionando exactamente igual.

---

## Orden de ejecución

1. Localizar el componente de ficha de publicación y verificar cómo se determina hoy si se muestra el botón de MercadoPago.
2. Implementar `ver_publicacion`.
3. Implementar los dos eventos de clic de la ficha.
4. Implementar `click_whatsapp_soporte`.
5. Validar en DebugView antes de desplegar.
6. Registrar en GA4 los parámetros personalizados para que aparezcan en los informes.

---

## Nota posterior al deploy

En GA4 hay que **registrar las dimensiones personalizadas** (`mp_disponible`, `tipo_vendedor`, `comuna`, `categoria`) en Administrar → Definiciones personalizadas. Si no se registran, los parámetros se envían pero no se pueden segmentar en los informes. Los datos anteriores al registro no se recuperan.
