# Prompt para Claude Code — Activación de MercadoPago al publicar

**Objetivo:** que el vendedor que acaba de publicar su primer libro conecte MercadoPago en ese mismo momento.
**Origen:** caso real del 25-07-2026. Un vendedor llegó desde Instagram, se registró, publicó un libro y no conectó MercadoPago. Hizo exactamente lo que el producto le enseñó: publicar y nada más. Ese libro hoy solo se puede comprar coordinando por WhatsApp.
**Impacto:** es el punto de activación más barato disponible. Hoy no existe.

---

## Contexto

Publicar un libro no lo deja vendible por la vía con pago protegido: para eso el vendedor necesita tener MercadoPago conectado. Ese paso vive en el perfil y nadie lo lleva hasta ahí.

El momento de máxima motivación es **justo después de publicar**: el vendedor acaba de invertir esfuerzo y quiere resultado. Hoy ese momento se pasa en blanco.

**No es un bloqueo.** La estrategia del negocio mantiene la vía directa por WhatsApp sin comisión como opción de primera clase. Publicar sin MercadoPago debe seguir siendo perfectamente válido. Esto es una invitación bien puesta, no un peaje.

---

## Qué construir

### 1. Estado de éxito al publicar

Localizar el flujo de publicación (`/publish`) y su estado de confirmación.

Cuando la publicación se crea correctamente **y el vendedor no tiene MercadoPago conectado**, el estado de éxito debe:

- Celebrar primero. El libro se publicó, eso es la buena noticia y va arriba.
- Presentar la conexión de MercadoPago como el siguiente paso natural, con la razón:

> **Te falta un paso para que te puedan pagar**
> Sin MercadoPago conectado, solo te puede comprar alguien que coordine contigo en persona. Conectándolo te compran desde cualquier región — y la plata te llega directa a ti.
>
> [Conectar MercadoPago] · [Ahora no]

- "Ahora no" cierra sin fricción y sin culpa. No repetir el mensaje en la misma sesión.

Si el vendedor **ya tiene MercadoPago conectado**, el estado de éxito no cambia.

### 2. Aviso persistente en el área de vendedor

Un vendedor que descartó el aviso no debe perder el camino de vuelta.

Mientras la cuenta no tenga MercadoPago conectado y tenga **al menos una publicación activa**, mostrar una franja discreta en `/mis-libros` con el mismo mensaje y el mismo botón.

Requisitos:
- Discreta, no un modal ni algo que tape contenido.
- Descartable, y que el descarte persista.
- Desaparece sola al conectar MercadoPago.

### 3. Eventos GA4

Para saber si esto sirve, desde el día uno:

| Evento | Cuándo |
|---|---|
| `mp_aviso_visto` | Se renderiza el aviso. Parámetros: `ubicacion` (`publish_exito` / `mis_libros`), `n_publicaciones` |
| `mp_aviso_click` | Clic en "Conectar MercadoPago". Mismos parámetros |
| `mp_aviso_descartado` | Clic en "Ahora no" o cierre |
| `mp_conectado` | La conexión se completa con éxito. Parámetro: `origen` |

Sin `mp_aviso_visto` no hay denominador y no se puede calcular tasa de conversión.

---

## Restricciones

- **No modificar la integración de MercadoPago ni el flujo de conexión existente.** Solo enlazar a él. Si hoy vive en `/perfil`, el botón lleva ahí.
- **No bloquear** la publicación ni condicionarla a conectar MercadoPago.
- **No tocar** homepage ni checkout.
- No introducir dependencias nuevas.
- Español de Chile, tú/usted. **Nunca voseo.** "Conecta" no "Conectá".
- Mantener el tono cercano y en primera persona de Vero que ya usa el sitio.
- Paleta y tipografía existentes. No inventar estilos nuevos.
- Deploy enfocado: solo esta funcionalidad.

---

## Validación

1. `npm run build` sin errores.
2. Con una cuenta **sin** MercadoPago conectado: publicar un libro y confirmar que aparece el aviso en el estado de éxito.
3. Confirmar que "Ahora no" cierra y que el aviso reaparece en `/mis-libros`.
4. Confirmar que el descarte en `/mis-libros` persiste entre sesiones.
5. Con una cuenta **con** MercadoPago conectado: confirmar que no aparece ningún aviso en ninguna de las dos ubicaciones.
6. En GA4 DebugView: confirmar que llegan los cuatro eventos con sus parámetros.
7. Confirmar que publicar sigue funcionando exactamente igual.

---

## Orden de ejecución

1. Localizar cómo se determina hoy si un vendedor tiene MercadoPago conectado, y dónde vive el flujo de conexión.
2. Localizar el estado de éxito de `/publish`.
3. Implementar el aviso en el estado de éxito.
4. Implementar la franja en `/mis-libros` con descarte persistente.
5. Instrumentar los cuatro eventos.
6. Validar con las dos cuentas antes de desplegar.

---

## Nota posterior al deploy

Registrar en GA4 las dimensiones personalizadas `ubicacion`, `origen` y `n_publicaciones`. Sin registrarlas, los parámetros llegan pero no se pueden segmentar, y lo anterior al registro no se recupera.
