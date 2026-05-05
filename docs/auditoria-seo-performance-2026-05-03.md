# Auditoria SEO + Performance - tuslibros.cl

Fecha: 2026-05-03  
Estado: diagnostico, sin cambios aplicados

## Resumen ejecutivo

tuslibros.cl esta indexable y la base SEO principal existe: home, sitemap, robots, metadata global, canonical, Open Graph, Twitter cards, idioma `es-CL` y schema.org. Las fichas de libros son el activo SEO mas fuerte del sitio: tienen URL propia, metadata dinamica, canonical, H1, schema `Book`, `Product` y breadcrumbs.

El problema mas relevante no parece ser falta de SEO, sino performance y control de indexacion. La home y especialmente `/search` estan pesadas, hay imagenes de portadas demasiado grandes y el sitemap incluye URLs con query params que pueden generar duplicados o senales contradictorias.

## Hallazgos priorizados

| Prioridad | Hallazgo | Evidencia | Impacto probable | Riesgo de corregir |
|---|---|---|---|---|
| Alta | `/search` genera HTML excesivo | Produccion: aprox. 3.7 MB de HTML | Carga lenta, crawl budget caro, peor UX | Medio |
| Alta | Home sin cache CDN efectivo | Header: `cache-control: private, no-cache, no-store`; `x-vercel-cache: MISS` | Cada visita recalcula HTML | Medio |
| Alta | Portadas demasiado pesadas | Home cargada en navegador: aprox. 35 MB total, 28.9 MB imagenes | LCP lento, mala experiencia movil | Bajo/medio |
| Alta | Sitemap incluye URLs con query params | `/?category=...`, `/?genre=...` | Duplicados/canonical conflictivo | Bajo |
| Media | Home filtrada canonicaliza siempre a `/` | `app/(main)/page.tsx` devuelve canonical fijo `https://tuslibros.cl` | Google puede ignorar categorias/genres | Bajo |
| Media | `/search` sin query esta indexable | Canonical `/search`, contenido fino/duplicado | Puede competir con home | Bajo |
| Media | Logo demasiado pesado | `public/logo-books.png`: 569 KB, 1024x1024, detectado como JPEG | Peso innecesario en todas las paginas | Bajo |
| Baja | Imagen publica duplicada/no usada | `public/hero-libros-old.jpg`: 897 KB, sin referencias en codigo | Ruido en repo/public | Bajo |

## Lo que esta bien

- `robots.txt` existe y permite rastreo publico.
- `sitemap.xml` existe y responde 200.
- Home responde 200 para Googlebot.
- No se detecto `noindex` accidental en home, search o ficha revisada.
- Documento usa `lang="es-CL"`.
- Home tiene title, description, canonical, OG y Twitter cards.
- Fichas de libros tienen URLs indexables tipo `/libro/[username]/[slug]`.
- Fichas de libros tienen title, description, canonical, H1 y schema.
- GA4 no aparece duplicado; el ID usado es `G-N243GH70EQ`.

## Evidencia tecnica

Produccion revisada:

- `https://tuslibros.cl/`
- `https://tuslibros.cl/search`
- `https://tuslibros.cl/sitemap.xml`
- `https://tuslibros.cl/robots.txt`
- `https://tuslibros.cl/libro/vero/la-casa-del-juez`

Mediciones observadas:

- Home HTML: aprox. 472 KB.
- `/search` HTML: aprox. 3.7 MB.
- Sitemap: 357 URLs.
- Home cargada en navegador: aprox. 35.2 MB.
- Imagenes en home: aprox. 28.9 MB.
- JS en home: aprox. 5.0 MB.
- Ficha ejemplo `/libro/vero/la-casa-del-juez`: aprox. 89 KB HTML.

Top problema de imagenes:

- Varias portadas desde Supabase cargan entre 3.3 MB y 4.1 MB.
- Algunas imagenes se estan sirviendo directo desde Supabase en secciones horizontales, no siempre pasando por `next/image`.
- Objetivo recomendado por portada: 80-180 KB para card/listado; maximo razonable 250 KB si es imagen principal.

## Archivos involucrados

- `app/sitemap.ts`
- `app/robots.ts`
- `app/layout.tsx`
- `app/(main)/page.tsx`
- `app/(main)/search/page.tsx`
- `app/(main)/libro/[username]/[slug]/page.tsx`
- `components/listings/ListingCard.tsx`
- `components/home/CollectibleRow.tsx`
- `components/listings/ImageUploadMultiple.tsx`
- `components/ui/Logo.tsx`
- `public/logo-books.png`
- `public/images/hero-libros.jpg`
- `public/hero-libros-old.jpg`

## Quick wins recomendados

1. Limpiar sitemap
   - Sacar URLs `/?category=...` y `/?genre=...` del sitemap por ahora.
   - Mantener home, paginas estaticas valiosas, fichas de libro y vendedores.
   - Riesgo: bajo.

2. Controlar indexacion de `/search`
   - Opcion conservadora: sacar `/search` del sitemap.
   - Opcion mas estricta: `noindex, follow` para `/search` sin query.
   - Mantener indexables las fichas de libros.
   - Riesgo: bajo/medio.

3. Reducir peso del logo
   - Reemplazar `public/logo-books.png` por un asset real optimizado.
   - Objetivo: menos de 40 KB.
   - Riesgo: bajo.

4. Comprimir portadas al subir
   - Limitar lado mayor a 1200 px.
   - Convertir a WebP/JPEG optimizado.
   - Quality aproximada: 0.72-0.78.
   - Objetivo: 80-180 KB por portada.
   - Riesgo: medio si se toca flujo de subida; bajo si se hace con prueba acotada.

5. Evitar que `/search` renderice todo el catalogo
   - Agregar paginacion/limit real.
   - Evitar respuesta HTML de varios MB.
   - Riesgo: medio porque toca comportamiento de busqueda.

6. Revisar cache de paginas publicas
   - Home y fichas salen con `no-store`.
   - Puede venir de lectura de sesion/cookies en layout/navbar o cliente Supabase server.
   - No tocar como primer patch si estamos en modo bajo consumo.
   - Riesgo: medio.

## Patch minimo propuesto, sin aplicar

Orden recomendado:

1. `app/sitemap.ts`
   - Eliminar del sitemap las URLs con query params de categorias y generos.
   - Mantener URLs canonicas limpias.

2. `app/(main)/search/page.tsx`
   - Sacar `/search` del sitemap primero.
   - En una segunda pasada, evaluar `robots: { index: false, follow: true }` solo para busqueda generica sin query.

3. `public/logo-books.png`
   - Optimizar/reemplazar por imagen liviana.
   - No cambia branding ni layout.

4. Flujo de subida de imagenes
   - Agregar compresion antes de subir a Supabase.
   - Hacerlo con test manual de publicacion/edicion.

## Riesgos y notas

- No tocar Search Console desde codigo.
- No duplicar GA4.
- No cambiar SEO legal ni metadata legal.
- No tocar pagos, autenticacion ni base de datos para estos quick wins.
- Las fichas de libros son lo mas valioso para SEO; no bloquearlas.
- Las categorias actuales por query param no son ideales para SEO. A futuro conviene crear rutas estables tipo `/categoria/ficcion` o `/genero/filosofia`, pero eso ya seria una mejora mayor, no quick win.

## Recomendacion final

Primer movimiento seguro: limpiar sitemap + optimizar logo.  
Segundo movimiento: reducir peso de `/search`.  
Tercer movimiento: compresion de portadas nuevas.  
Cuarto movimiento: cache publico, con mas cuidado.

