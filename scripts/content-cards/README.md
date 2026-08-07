# Generador de tarjetas de contenido

Convierte una lista de piezas en **PNGs 1080×1350 (4:5) con la identidad de tuslibros**,
compositando la **portada real** de cada libro desde el catálogo. Es para el
volumen diario de redes (5–10 piezas), no para historias especiales (esas se
diseñan a mano). Deja además un `manifest.json` con la caption por pieza, listo
para el futuro auto-posteo con la Graph API de Meta.

No es código de la app: no toca runtime, home ni checkout. Vive bajo `scripts/`.

> ⚠️ **Hay dos pipelines de redes y hacen cosas distintas.** Este genera
> tarjetas. `scripts/generar-post-social.mjs` genera `social/metricool-batch.csv`,
> cuya columna `Image` apunta a la **portada cruda** en Supabase Storage — las
> tarjetas HTML que deja en `social/cards/` son una alternativa que hay que
> capturar a mano. O sea: **cargar ese CSV a Metricool publica portadas crudas,
> no estas tarjetas.** Lo publicado en el feed hasta el 6-08-2026 salió de acá
> (el wordmark cortado a la izquierda es el `footerSvg` de este generador; el de
> la tarjeta HTML va centrado y no se cortaría).

## Uso

```bash
npm run cards                                  # usa content/cards/lote-1.json
npm run cards -- content/cards/otro-lote.json  # spec explícito
```

Salida en `content-out/` (gitignored): `NN_template_slug.png` + `manifest.json`.

> Corre con **tsx** (no `node` pelado) porque importa módulos `.ts` — misma
> convención que el resto de scripts del repo (`seo:*`, `bulk-upload`).

## Plantillas

| template      | qué es                                                            | campos del spec |
|---------------|------------------------------------------------------------------|-----------------|
| `ficha`       | portada real arriba a todo el ancho + título/autor abajo. La de más enganche | `slug` o `listingId`, `kicker` |
| `tipografica` | frase/dato grande en Playfair sobre crema. Portada chica opcional | `headline`, `sub`, `kicker`, `slug` (opcional) |
| `lista`       | grilla de 3–6 portadas (carruseles). Varias láminas si hay >6 | `slugs[]`, `kicker` |

Todas: dos pesos tipográficos (Playfair 700 + Inter 400/600), crema/tinta/ámbar,
sin neón. En `headline` los saltos de línea se escriben `\\n`.

### Formato y zona segura

El lienzo es **4:5 (1080×1350)**. Antes era cuadrado y la grilla del perfil de
Instagram —vertical desde enero de 2026— lo recortaba por los lados: el wordmark
se leía **"ibros.cl"** en todas las miniaturas.

Nada crítico (wordmark, título, kicker) puede entrar en el **12% de cada borde
lateral**: es la constante `SAFE_X` de `brand.ts` y las plantillas del feed la
usan como margen, no `MARGIN`. Para verificar un lote nuevo, recorta una tarjeta
a `820x1350` centrado y confirma que todo sobrevive.

### El precio no va en la imagen

Una tarjeta con el precio encima se lee como aviso, y nadie guarda ni comparte un
aviso — que es justo lo que Instagram premia. El precio va en el **caption del
post**; `generate.mjs` avisa por consola si el caption de una pieza no lo trae.
Las historias (1080×1920) sí lo llevan: son efímeras y no entran a la grilla.

## Spec de entrada

`content/cards/lote-1.json`:

```json
{
  "pieces": [
    { "template": "ficha", "slug": "vero/ayer", "kicker": "Joya del día",
      "caption": "…", "firstComment": "#librosusados #juanemar" },
    { "template": "tipografica", "kicker": "¿Sabías que…?",
      "headline": "El 96% de un libro\\nusado ya lo leyó alguien.",
      "sub": "Y por eso cuesta menos.", "caption": "…" },
    { "template": "lista", "kicker": "Menos de $5.000",
      "slugs": ["vero/maximas-y-aforismos", "vero/locos-egregios"], "caption": "…" }
  ]
}
```

- **`slug`**: `username/slug` del catálogo (el mismo de la URL `/libro/username/slug`).
  También acepta un UUID de listing.
- **`caption`**: texto del post. **`firstComment`**: primer comentario (hashtags).

## Portada real

`fetchListing.ts` usa exactamente la misma fuente que el sitio:
`listing.cover_image_url ?? book.cover_url`. La imagen se descarga y se embebe
como `data:` URI dentro de un `<image>` recortado tipo `object-fit: cover`.

> El `content-type` del storage no es confiable (Supabase sirve algunos PNG
> etiquetados como `image/webp`), así que el mime se detecta por los magic bytes.

## manifest.json

Una entrada por pieza (= un post futuro):

```json
{
  "archivo": "01_ficha_....png",
  "archivos": ["01_ficha_....png"],   // todas las imágenes (carrusel = un post)
  "template": "ficha",
  "caption": "…",
  "primer_comentario": "#…"
}
```

## Fase siguiente (NO acá)

Con la cuenta de Instagram Business/Creator conectada, un paso posterior tomará
`content-out/manifest.json` (imagen(es) + caption) y publicará vía Meta Graph API
o un programador (Metricool). El manifest ya está pensado para eso — pero el
posteo **no** se implementa en este script.

## Fuentes

`fonts/` trae Playfair Display 700 e Inter 400/600 (TTF estáticos de fontsource).
resvg los carga vía `font.fontFiles` sin fuentes del sistema.
