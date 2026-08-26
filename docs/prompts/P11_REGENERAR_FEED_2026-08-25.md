# P11 · Regenerar las 193 piezas del feed en 4:5

> **Versión corregida (25 ago, 23:20).** La primera versión mandaba a Claude Code a
> `scripts/feed-validar.mjs`. Ese archivo **no tiene nada que ver**: lo creó Claude Code hoy a
> las 19:14 en el commit `db58d48` para validar el feed de producto de P10. Si ya pasaste la
> versión anterior, pasa esta.

## Diagnóstico verificado

Leí los archivos y medí los PNG. Los números no dejan dudas:

| carpeta | generado | tamaño | estado |
|---|---|---|---|
| `content-out/` | 7 ago, con `npm run cards` | **1080×1350** | correcto |
| `ideas/instagram-feed/` | 25 jul | **1080×1080** | roto — es lo publicado |

`scripts/content-cards/brand.ts` ya declara `CANVAS_W = 1080`, `CANVAS_H = 1350`, `SAFE_X = 130`,
con un comentario que describe exactamente este problema: *"Antes era cuadrado (1080×1080) y la
grilla del perfil —que desde enero de 2026 es vertical— lo recortaba por los lados: el wordmark
se leía 'ibros.cl' en todas las miniaturas."*

O sea: **el generador actual ya produce el formato correcto.** Las 193 piezas son anteriores al
arreglo y ningún script del repo las produce hoy — no hay nada en `scripts/` que escriba
`feed_NNN_*.png`, así que salieron de una corrida suelta que no quedó versionada.

**La aritmética del corte:** para meter un cuadrado de 1080 de ancho en el slot 4:5 del perfil,
Instagram recorta a 864 — 108 píxeles por lado. El wordmark empieza cerca del borde izquierdo y
pierde las primeras letras.

## El misterio del UTM: resuelto, y no era un bug

Dije en P4 que el pipeline no emitía UTM. Es cierto para `social/metricool-batch.csv` (0 de 14
posts) y **falso** para estas 193: `captions.txt` sí trae
`?utm_source=instagram&utm_medium=post&utm_campaign=catalogo_vero`.

Pero el post publicado **no lleva ese link**. La caption real dice:

> 📍 En tuslibros.cl · envío a todo Chile o retiro en mano
> 👉 **Link en la bio**

Y ahí está la explicación del único page_view con `utm_source=instagram` en toda la base: el
link con UTM nunca se publicó. Alguien lo reemplazó por "link en la bio" — que además es lo
correcto, porque **Instagram no hace clickeables los links en las captions**. No hay bug que
arreglar en el middleware: el link simplemente nunca salió.

Lo que sí queda al descubierto es que todo el embudo de Instagram depende de un solo enlace, el
de la bio, y hoy apunta al home. Ahí es donde `/ofertas` deja de ser una página más y pasa a ser
la única puerta.

**Y la consecuencia para P10:** el catálogo de Meta es lo que vuelve clickeables estas piezas.
Las etiquetas de producto sí se pueden tocar dentro del post, con precio y link a la ficha. Sin
catálogo, cada publicación es una postal bonita sin salida.

## El otro dato, que es más grave que el formato

El post de *Muerte en verano* lleva **5 días con cero "me gusta"** en una cuenta de 322
seguidores. No es un problema de recorte de wordmark: Instagram no está distribuyendo el
contenido. Regenerar las 193 en 4:5 arregla la vitrina del perfil, no el alcance. Conviene
tenerlo separado en la cabeza antes de invertir más trabajo ahí.

---

## El prompt

```
Las 193 piezas de ideas/instagram-feed/ están en 1080×1080 y por eso Instagram me corta el
wordmark en la grilla del perfil: en las miniaturas se lee "ibros.cl". Verificado midiendo los
PNG — las de ideas/instagram-feed/ miden 1080×1080 y las de content-out/ (generadas el 7 de
agosto con npm run cards) miden 1080×1350, que es lo correcto.

O sea el generador actual ya está bien: scripts/content-cards/brand.ts declara CANVAS_W 1080 ×
CANVAS_H 1350 con SAFE_X 130. Las 193 son de antes de ese arreglo y no las produce ningún script
del repo — no hay nada en scripts/ que escriba feed_NNN_*.png, salieron de una corrida suelta.

Ojo: NO toques scripts/feed-validar.mjs. Ese es el validador del feed de producto que hiciste
hoy en db58d48 y no tiene relación con esto.

Lo que quiero:

1. Un script versionado que arme el spec del lote a partir de la BD: los mismos listings que
   están hoy en ideas/instagram-feed/, es decir activos del seller vero
   (2201d163-4423-4971-91f0-f6cebd00d1bd). Que quede en el repo, no como corrida suelta —
   ese fue el problema de origen.
2. Regenerar las 193 con el generador actual (plantilla ficha, 1080×1350), reutilizando
   scripts/content-cards/ tal como está. No dupliques constantes de tamaño: que todo importe
   CANVAS_W/CANVAS_H/SAFE_X de brand.ts.
3. Conservar las captions de ideas/instagram-feed/captions.txt tal cual, incluidos los UTM que
   ya traen. No las reescribas. Si cambian los nombres de archivo, actualiza captions.txt para
   que sigan calzando una a una.
4. Portadas: seguir priorizando books.cover_url sobre listing_images, como está hoy.
5. Al terminar, valida y muéstrame: cuántas piezas quedaron, que todas midan 1080×1350, y si
   alguna quedó con texto crítico fuera de SAFE_X.

Dime también si quedan otras piezas cuadradas en el repo que haya que rehacer de una vez.

No publiques nada ni toques Metricool. Tu entrega son los PNG regenerados y el script que los
produce.
```

---

## Y lo otro

**Sí está publicando solo, pero no desde el repo.** El lote de Metricool
(`social/metricool-batch.json`) cubrió del 21 de julio al 3 de agosto y se acabó. Lo que sigue
publicando es **Meta Business Suite**, con las piezas cargadas a mano ahí — el post de *Muerte en
verano* es del 20 de agosto. En el repo no hay cron ni integración con la Graph API: buscar
"metricool|instagram|graph.facebook" solo devuelve scripts de análisis y el generador.

O sea: la programación vive fuera del código, en la consola de Meta. Las 193 regeneradas son
**tres meses de feed a dos diarias** para cargar ahí de una vez.

Orden correcto: (1) regenerar en 4:5, (2) terminar el catálogo de Meta de P10 para que las piezas
lleven etiqueta de producto clickeable, (3) apuntar el link de la bio a `/ofertas`, (4) recién
entonces cargar el lote completo. Cargar 193 postales sin salida no cambia nada.
