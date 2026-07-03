# PROMPT PARA CLAUDE CODE — Páginas de colección SEO + UX mobile
**Proyecto:** tuslibros.cl (repo: github.com/vero-pix/libros-libres)
**Fecha:** 2 julio 2026
**Prioridad:** Alta — impacto directo en tráfico orgánico y conversión mobile
**Supabase project ID:** tfaqvnsdasaegkcahaal

---

## CONTEXTO

tuslibros.cl tiene colecciones editoriales curadas con voz propia y selección real
(Literatura chilena, Novela negra, Historia de Chile, etc.) que aparecen en la home.
El problema: todas apuntan a `/?tag=novela-negra`, `/?tag=historia-chile`, etc.
Query params sin URL propia = invisibles para Google. El contenido editorial ya existe.
Solo falta la ruta canónica, el texto editorial y emitirlo al sitemap.

Adicionalmente, el sidebar de filtros es `hidden lg:block`, lo que elimina la
capacidad de filtrar en mobile (60-70% del tráfico). Se requiere solución mobile-first.

---

## TAREA 1: Páginas de colección con URL canónica

### Qué construir

Crear el patrón de página `app/(main)/coleccion/[slug]/page.tsx` (Server Component)
que:

1. Recibe el `slug` como parámetro de ruta
2. Busca en Supabase los listings que tengan ese tag en su campo de tags/categoría
3. Renderiza la página con H1 exacto, texto editorial, y grid de libros
4. Genera metadata SEO completa (title, description, canonical, og:title)

### Las 7 colecciones a crear (en orden de prioridad SEO)

Crear estas rutas con su configuración exacta:

```typescript
// app/(main)/coleccion/[slug]/collections.config.ts
export const COLLECTIONS: Record<string, {
  title: string           // H1 visible en página
  seoTitle: string        // <title> para Google (max 60 chars)
  seoDescription: string  // meta description (max 155 chars)
  tagFilter: string       // valor exacto del tag en Supabase
  editorial: string       // texto editorial 150-200 palabras
  subtitle: string        // subtítulo estilo home (ej: "Escritoras y escritores de acá")
}> = {

  'historia-de-chile': {
    title: 'Libros de Historia de Chile',
    seoTitle: 'Libros de Historia de Chile Usados — tuslibros.cl',
    seoDescription: 'Encuentra libros usados sobre historia de Chile: política, memoria, identidad. Despacho a todo Chile o retiro en persona.',
    tagFilter: 'historia-chile',
    subtitle: 'Memoria, política, identidad',
    editorial: `La historia de Chile es un territorio inmenso y a veces incómodo. Aquí encontrarás desde los grandes relatos oficiales hasta las versiones que no entraron en los libros de texto del colegio: la historia económica, la historia oral, los años de plomo y los de transición, los caudillos y los movimientos sociales. Textos de Barros Arana, Vicuña Mackenna, Ascanio Cavallo, y decenas de historiadores que reconstruyeron el pasado desde distintas trincheras. Todos usados, todos con historia propia.`,
  },

  'literatura-chilena': {
    title: 'Literatura Chilena Usada',
    seoTitle: 'Literatura Chilena Usada — tuslibros.cl',
    seoDescription: 'Narrativa, poesía y ensayo de autores chilenos. Donoso, Edwards, Marta Brunet, Nicanor Parra y más. Libros usados con despacho a todo Chile.',
    tagFilter: 'literatura-chilena',
    subtitle: 'Escritoras y escritores de acá',
    editorial: `La literatura chilena tiene una voz propia que cuesta encontrar en las cadenas de librerías. Aquí hay Donoso y hay Edwards, hay Marta Brunet y hay Nicanor Parra. Hay voces del siglo pasado que siguen diciendo cosas vigentes, y voces nuevas que están redefiniendo qué significa escribir desde Chile. Esta colección la armamos con libros que alguien leyó, subrayó y decidió pasar a otro lector. Así funciona la literatura: de mano en mano.`,
  },

  'novela-negra': {
    title: 'Novela Negra y Policial Usada',
    seoTitle: 'Novela Negra y Policial Usada — tuslibros.cl',
    seoDescription: 'Los mejores libros de novela negra y policial usados: Simenon, Camilleri, nordic noir y más. Despacho a todo Chile.',
    tagFilter: 'novela-negra-policial',
    subtitle: 'Para no soltar el libro',
    editorial: `El género negro tiene una honestidad que la literatura mainstream no siempre se permite: mirar de frente la violencia, la corrupción y lo que la gente hace cuando cree que nadie la observa. Georges Simenon con el inspector Maigret, Camilleri con el comisario Montalbano, los escandinavos con sus paisajes fríos y sus crímenes de clase media. Todos usados, todos disponibles ahora. La mejor novela negra no se lee una vez: se relee.`,
  },

  'clasicos': {
    title: 'Clásicos que No Caducan',
    seoTitle: 'Clásicos de Literatura Universal Usados — tuslibros.cl',
    seoDescription: 'Clásicos de la literatura universal en ediciones usadas: Kafka, Orwell, Cortázar, Borges y más. Despacho a todo Chile.',
    tagFilter: 'clasicos',
    subtitle: 'Los que siempre vuelven',
    editorial: `Hay libros que siguen apareciendo en manos de lectores distintos, generación tras generación, porque resuelven algo que no pasa de moda. Un proceso kafkiano. Una rebelión orwelliana. Un rayuela que no termina de leerse de la misma manera dos veces. Esta colección agrupa los títulos que los vendedores de tuslibros.cl han decidido poner en circulación de nuevo — ya los leyeron, ya los marcaron, ya están listos para el siguiente lector.`,
  },

  'tarde-de-lluvia': {
    title: 'Libros para una Tarde de Lluvia',
    seoTitle: 'Libros para Leer en Casa — Selección tuslibros.cl',
    seoDescription: 'Una selección de libros para leer lento, sin apuro. Narrativa, cuentos y novelas para una tarde de lluvia. Libros usados en Chile.',
    tagFilter: 'tarde-de-lluvia',
    subtitle: 'Lectura lenta, sin apuro',
    editorial: `No todos los libros se leen de la misma manera. Estos están hechos para una tarde sin compromisos: una novela que entra suave, un libro de cuentos que se puede interrumpir y retomar, algo que no exige nada excepto que te sientes y leas. Curadería de Vero, fundadora de tuslibros.cl, lectora sin apuro. Esta selección cambia con el catálogo — si un libro se vende, entra otro. Si tienes dudas sobre cuál empezar, escríbenos.`,
  },

  'latinoamerica-contemporanea': {
    title: 'Literatura Latinoamericana Contemporánea',
    seoTitle: 'Literatura Latinoamericana Contemporánea Usada — tuslibros.cl',
    seoDescription: 'Lo mejor de la narrativa latinoamericana contemporánea: Fuentes, Bolaño, Vargas Llosa y nuevas voces. Libros usados con despacho a Chile.',
    tagFilter: 'latinoamerica-contemp',
    subtitle: 'Lo que se está escribiendo ahora mismo',
    editorial: `El boom latinoamericano nunca terminó, solo mutó. Después de García Márquez y Cortázar vino Bolaño, después de Bolaño vienen decenas de escritoras y escritores que están redefiniendo qué significa narrar desde este continente. Acá hay Vargas Llosa y Fuentes porque siguen siendo necesarios, y hay títulos más recientes de autores que todavía no llenan estadios pero que los críticos están mirando. Todos usados, todos disponibles, todos esperando al siguiente lector.`,
  },

  'distopias': {
    title: 'Distopías y Ciencia Ficción Clásica',
    seoTitle: 'Distopías y Ciencia Ficción Usada — tuslibros.cl',
    seoDescription: 'Los grandes clásicos de la distopía: Orwell, Huxley, Dick, Le Guin. Libros usados con despacho a todo Chile.',
    tagFilter: 'distopias-clasicas',
    subtitle: 'Mundos que se parecen demasiado al nuestro',
    editorial: `La distopía no es un género de ciencia ficción: es una forma de hacer diagnóstico social con nombre ficticio. Orwell escribió 1984 como advertencia y se convirtió en manual. Huxley imaginó el control por el placer en vez de por el miedo. Philip K. Dick preguntó qué separa a un humano de una máquina antes de que la pregunta fuera urgente. Esta colección tiene los títulos fundacionales del género, todos usados, todos con lectores anteriores que los leyeron en contextos muy distintos al tuyo.`,
  },
}
```

### Componente de página

```typescript
// app/(main)/coleccion/[slug]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { COLLECTIONS } from './collections.config'
// Reutilizar el componente de card de libro que ya existe en el proyecto

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = COLLECTIONS[params.slug]
  if (!collection) return {}
  return {
    title: collection.seoTitle,
    description: collection.seoDescription,
    alternates: { canonical: `https://tuslibros.cl/coleccion/${params.slug}` },
    openGraph: {
      title: collection.seoTitle,
      description: collection.seoDescription,
      url: `https://tuslibros.cl/coleccion/${params.slug}`,
      siteName: 'tuslibros.cl',
      locale: 'es_CL',
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(COLLECTIONS).map(slug => ({ slug }))
}

export default async function ColeccionPage({ params }: Props) {
  const collection = COLLECTIONS[params.slug]
  if (!collection) notFound()

  const supabase = createClient()

  // Adaptar la query según el esquema real de tags en listings
  // Opciones: campo tags (array), campo genre, campo custom_tags, etc.
  // IMPORTANTE: ajustar el campo y operador según cómo están guardados los tags
  const { data: listings, error } = await supabase
    .from('listings')
    .select(`
      id,
      slug,
      price,
      condition,
      modality,
      books (
        title,
        author,
        cover_url,
        genre
      ),
      users (
        username,
        display_name
      )
    `)
    .eq('status', 'active')
    .contains('tags', [collection.tagFilter])  // ajustar si el campo se llama distinto
    .order('created_at', { ascending: false })
    .limit(48)

  if (error) console.error('Error fetching collection:', error)
  const books = listings ?? []

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-muted mb-8" aria-label="Breadcrumbs">
        <Link href="/" className="hover:text-brand-600 transition-colors">Inicio</Link>
        <span className="text-ink-muted/50">/</span>
        <span className="text-ink font-medium">{collection.title}</span>
      </nav>

      {/* Header editorial */}
      <div className="mb-10 max-w-2xl">
        <p className="text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-2">
          {collection.subtitle}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-4 leading-tight">
          {collection.title}
        </h1>
        <p className="text-ink-muted text-base leading-relaxed">
          {collection.editorial}
        </p>
        <p className="text-xs text-ink-muted/60 mt-3 font-mono">
          {books.length} libro{books.length !== 1 ? 's' : ''} disponible{books.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grid de libros — reutilizar componente existente */}
      {books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {books.map(listing => (
            // Usar el mismo BookCard que se usa en la home y en la tienda
            // La prop href debe apuntar a /libro/[username]/[slug]
            <BookCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-ink-muted">
          <p className="font-display text-lg mb-2">No hay libros disponibles en esta colección ahora mismo.</p>
          <p className="text-sm">Revisa más tarde o <Link href="/" className="text-brand-600 hover:underline">explora la tienda completa</Link>.</p>
        </div>
      )}

      {/* CTA publicar */}
      <div className="mt-16 p-6 bg-cream-warm rounded-xl border border-cream-dark/20 text-center">
        <p className="font-display text-lg font-semibold text-ink mb-1">
          ¿Tienes libros de {collection.title.toLowerCase()}?
        </p>
        <p className="text-sm text-ink-muted mb-4">
          Publícalos gratis y llégales a lectores que los están buscando.
        </p>
        <Link
          href="/vender"
          className="inline-block bg-brand-500 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-brand-600 transition-colors"
        >
          Publicar un libro →
        </Link>
      </div>
    </main>
  )
}
```

### Schema JSON-LD para colecciones

Agregar dentro del `<head>` de cada página de colección:

```typescript
// Dentro de generateMetadata o como componente Script
const schema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": collection.title,
  "description": collection.seoDescription,
  "url": `https://tuslibros.cl/coleccion/${params.slug}`,
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": books.length,
    "itemListElement": books.slice(0, 10).map((listing, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Book",
        "name": listing.books?.title,
        "author": { "@type": "Person", "name": listing.books?.author },
        "offers": {
          "@type": "Offer",
          "price": listing.price,
          "priceCurrency": "CLP",
          "availability": "https://schema.org/InStock"
        }
      }
    }))
  }
}
```

### Actualizar sitemap

En `app/sitemap.ts` (o donde se genere el sitemap dinámico), agregar las rutas de colección:

```typescript
import { COLLECTIONS } from '@/app/(main)/coleccion/[slug]/collections.config'

// Dentro de la función sitemap(), agregar:
const collectionUrls = Object.keys(COLLECTIONS).map(slug => ({
  url: `${baseUrl}/coleccion/${slug}`,
  lastModified: new Date(),
  changeFrequency: 'weekly' as const,
  priority: 0.8,
}))
```

### Actualizar links internos en la home

Cambiar todos los `href="/?tag=novela-negra"` → `href="/coleccion/novela-negra"` y equivalentes.
Buscar en la home por `/?tag=` y reemplazar con la URL de colección correspondiente:

```
/?tag=novela-negra        → /coleccion/novela-negra
/?tag=historia-chile      → /coleccion/historia-de-chile
/?tag=literatura-chilena  → /coleccion/literatura-chilena
/?tag=clasicos            → /coleccion/clasicos
/?tag=tarde-de-lluvia     → /coleccion/tarde-de-lluvia
/?tag=latinoamerica-contemp → /coleccion/latinoamerica-contemporanea
/?tag=distopias-clasicas  → /coleccion/distopias
```

---

## TAREA 2: Filtros y búsqueda visible en mobile

### Problema

El sidebar de categorías y filtros tiene `className="... hidden lg:block"`.
En mobile no existe forma de filtrar desde la tienda ni desde la home.

### Solución: drawer de filtros + barra de búsqueda sticky mobile

**2a. Barra de búsqueda sticky en mobile (above the fold)**

Agregar inmediatamente después del header, solo visible en mobile (`lg:hidden`):

```tsx
// Componente MobileSearchBar — solo en mobile
<div className="lg:hidden sticky top-16 z-30 bg-cream/95 backdrop-blur-sm border-b border-cream-dark/20 px-4 py-2">
  <form action="/search" method="GET">
    <div className="relative">
      <input
        type="search"
        name="q"
        placeholder="Busca por título, autor o ISBN..."
        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-cream-dark/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" .../>
    </div>
  </form>
</div>
```

**2b. Botón "Filtrar" mobile + drawer**

En la vista mobile de la tienda (donde está el grid), agregar encima del grid:

```tsx
// Solo visible en mobile
<div className="lg:hidden flex items-center gap-2 mb-4">
  <button
    onClick={() => setDrawerOpen(true)}
    className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-cream-dark/30 rounded-lg bg-white hover:bg-cream-warm transition-colors"
  >
    <svg ...filtro icon/>
    Filtrar
    {activeFiltersCount > 0 && (
      <span className="ml-1 bg-brand-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
        {activeFiltersCount}
      </span>
    )}
  </button>
  {/* Pills de categoría en scroll horizontal */}
  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
    {['Ficción', 'No ficción', 'Infantil', 'Académico'].map(cat => (
      <a
        key={cat}
        href={`/?category=${cat.toLowerCase().replace(' ', '-')}`}
        className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-cream-dark/30 bg-white hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors whitespace-nowrap"
      >
        {cat}
      </a>
    ))}
  </div>
</div>

{/* Drawer de filtros */}
{drawerOpen && (
  <div className="fixed inset-0 z-50 lg:hidden">
    <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-ink text-lg">Filtros</h3>
        <button onClick={() => setDrawerOpen(false)}>
          <svg ...close icon/>
        </button>
      </div>
      {/* Contenido idéntico al sidebar desktop: categorías, precio, condición */}
      {/* Copiar el contenido del aside existente */}
    </div>
  </div>
)}
```

**Importante:** el drawer requiere `"use client"` en el componente que lo contiene.
Extraer el drawer como `MobileFiltersDrawer.tsx` (Client Component) e importarlo
en la página de tienda (Server Component). No convertir toda la página a client.

---

## TAREA 3: Corrección de URLs `/listings/[uuid]`

### Problema detectado

Algunas fichas nuevas (Orwell, Kafka, otras) apuntan a `/listings/[uuid]` en vez de
`/libro/[vendedor]/[slug]`. Esto genera URLs canónicamente débiles que no rankean.

### Investigar y corregir

1. Revisar en Supabase qué listings tienen `slug` NULL o vacío
2. Revisar el flujo de publicación para identificar dónde se genera (o no) el slug
3. Para listings existentes sin slug: generar slug desde el título del libro
   (ej: "1984" de George Orwell → slug: `1984-george-orwell`)
4. En los componentes de card de libro: asegurar que el `href` siempre use
   `/libro/${usuario.username}/${listing.slug}` y nunca `/listings/${listing.id}`
5. Si un listing no tiene slug todavía, usar `/listings/${listing.id}` como fallback
   pero marcarlo en DB para regeneración

---

## RESTRICCIONES GLOBALES

1. **Español chileno.** Tú/usted, jamás voseo. "Crea" no "Creá", "tienes" no "tenés".
2. **Server Components por defecto.** Usar `"use client"` solo donde hay interactividad
   real (drawer de filtros). Las páginas de colección son Server Components.
3. **Reutilizar componentes existentes.** No crear nuevos componentes de card de libro —
   usar el que ya existe en la home y en la tienda.
4. **Paleta existente.** bg-cream, text-ink, brand-500/600, cream-dark, cream-warm.
   No introducir nuevas variables de color.
5. **No tocar:** home (solo los links `/?tag=` → `/coleccion/`), páginas de ciudad,
   fichas de libro, flujo de publicación (excepto la corrección de slug).
6. **Validar antes de hacer push:** para cada colección, verificar que la query
   de Supabase devuelve resultados reales antes de pushear a producción.
   Si `tagFilter` no matchea en DB, ajustar el valor del tag según los datos reales.

---

## ORDEN DE EJECUCIÓN

1. Inspeccionar la tabla `listings` en Supabase para confirmar el campo exacto
   donde están guardados los tags y sus valores reales.
2. Ajustar `tagFilter` en `COLLECTIONS` según los valores reales en DB.
3. Implementar `app/(main)/coleccion/[slug]/page.tsx` con las 7 colecciones.
4. Actualizar links en la home (`/?tag=` → `/coleccion/`).
5. Actualizar `app/sitemap.ts` para emitir las 7 nuevas URLs.
6. Implementar `MobileFiltersDrawer.tsx` + barra de búsqueda sticky mobile.
7. Auditar y corregir URLs `/listings/[uuid]` en componentes de card.

---

## VALIDACIÓN POST-DEPLOY

Después de pushear a Vercel, verificar:

- [ ] `https://tuslibros.cl/coleccion/historia-de-chile` devuelve 200 con libros reales
- [ ] `https://tuslibros.cl/coleccion/novela-negra` ídem
- [ ] `https://tuslibros.cl/sitemap.xml` incluye las 7 nuevas URLs de colección
- [ ] Links de la home apuntan a `/coleccion/[slug]` (no a `/?tag=`)
- [ ] En mobile (< 1024px): barra de búsqueda visible, botón Filtrar visible
- [ ] `curl -I https://tuslibros.cl/coleccion/historia-de-chile` devuelve `200 OK`
- [ ] Rich Results Test en https://search.google.com/test/rich-results muestra
      el schema CollectionPage sin errores
- [ ] Solicitar indexación manual en GSC para las 7 URLs nuevas
