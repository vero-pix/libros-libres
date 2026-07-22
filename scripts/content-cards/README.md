# Generador de tarjetas de contenido

Convierte una lista de piezas en **PNGs 1080×1080 con la identidad de tuslibros**,
compositando la **portada real** de cada libro desde el catálogo. Es para el
volumen diario de redes (5–10 piezas), no para historias especiales (esas se
diseñan a mano). Deja además un `manifest.json` con la caption por pieza, listo
para el futuro auto-posteo con la Graph API de Meta.

No es código de la app: no toca runtime, home ni checkout. Vive bajo `scripts/`.

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
| `ficha`       | portada real protagonista + título/autor/precio. La de más enganche | `slug` o `listingId`, `kicker` |
| `tipografica` | frase/dato grande en Playfair sobre crema. Portada chica opcional | `headline`, `sub`, `kicker`, `slug` (opcional) |
| `lista`       | grilla de 3–6 portadas con precio (carruseles). Varias láminas si hay >6 | `slugs[]`, `kicker` |

Todas: márgenes ≥88, dos pesos tipográficos (Playfair 700 + Inter 400/600),
crema/tinta/ámbar, sin neón. En `headline` los saltos de línea se escriben `\\n`.

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
