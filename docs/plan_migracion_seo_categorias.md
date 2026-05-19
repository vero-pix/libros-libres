# Plan de migración SEO: URLs semánticas de categorías

**Proyecto:** tuslibros.cl  
**Fecha:** 15 mayo 2026  
**Estado:** Plan técnico — pendiente implementación

---

## Diagnóstico: problemas SEO actuales

Antes de migrar, hay problemas existentes que la migración debe resolver al mismo tiempo:

| Problema | Impacto | Urgencia |
|---|---|---|
| Canonical siempre `tuslibros.cl` sin importar la categoría | Google trata todas las páginas de categoría como duplicados del home | Alta |
| Sitemap no incluye URLs de categorías | Google no descubre ni indexa las páginas de categoría | Alta |
| Footer tiene 4 links a categorías obsoletas (`ficcion`, `no-ficcion`, etc.) que no existen | Tráfico cae en resultados vacíos | Media |
| Metadata usa slugs crudos ("general-adulto-novela") en vez de nombres legibles | Títulos feos en SERPs | Media |

---

## Estado actual de la arquitectura

### URLs actuales
```
/?category=general-adulto
/?category=general-adulto&subcategory=general-adulto-novela
/?category=escolar
/?category=escolar&subcategory=escolar-media
```

### Árbol de categorías (7 raíces + 44 subcategorías)

**Raíces:**
- `escolar` → Escolar
- `lectura-complementaria` → Lectura Complementaria
- `universitario` → Universitario
- `tecnico-cft` → Técnico / CFT
- `general-adulto` → General / Adulto
- `idiomas` → Idiomas
- `otros` → Otros

**Subcategorías relevantes (general-adulto):**
- `general-adulto-novela` → Novela y Ficción
- `general-adulto-policial` → Novela Policial / Suspenso
- `general-adulto-poesia` → Poesía
- `general-adulto-historia` → Historia
- `general-adulto-ensayo` → Ensayo y Divulgación
- `general-adulto-biografia` → Biografías y Memorias
- ... y 7 más

### Archivos afectados por la migración

| Archivo | Rol | Cambio requerido |
|---|---|---|
| `app/(main)/page.tsx` | Home + filtros + metadata | Canonical dinámico + redirects |
| `app/(main)/search/page.tsx` | Búsqueda de texto | Canonical dinámico |
| `components/ui/CategoriesSidebar.tsx` | Links sidebar desktop | Actualizar hrefs |
| `components/ui/CategoriesMobileDrawer.tsx` | Links mobile | Actualizar hrefs |
| `components/home/CollectionBanners.tsx` | 7 banners hardcodeados | Actualizar hrefs |
| `components/ui/Footer.tsx` | 4 links obsoletos | Reemplazar por categorías reales |
| `app/sitemap.ts` | Sitemap XML | Agregar URLs de categorías |
| `lib/urls.ts` | Helpers de URL | Agregar función `categoriaUrl()` |
| `next.config.js` | Redirects | Agregar 308 desde QP a rutas semánticas |

### Query params que coexisten (NO se migran)

Estos siguen siendo query params porque son filtros secundarios:
- `?sort=`, `?price_min=`, `?price_max=`, `?condition=`, `?modality=`
- `?tag=`, `?author=`, `?binding=`, `?page=`, `?view=`
- `?lat=`, `?lng=`, `?collectible=`

---

## Estrategia recomendada: rutas paralelas con canonical

**No migrar `/?category=` — crear rutas nuevas que la reemplacen como entry points.**

Los query params se mantienen internamente para filtros combinados, paginación y `ListingToolbar`. Las nuevas rutas son entry points limpios que reutilizan la misma lógica.

### URLs objetivo

```
/categoria/[slug]                   → categoría raíz
/categoria/[slug]/[subcategory]     → subcategoría
```

**Ejemplos:**
```
/categoria/general-adulto           → General / Adulto
/categoria/general-adulto/novela    → Novela y Ficción
/categoria/general-adulto/policial  → Novela Policial
/categoria/escolar                  → Escolar
/categoria/escolar/media            → Media 1°–4°
/categoria/idiomas/aleman           → Alemán
```

**Simplificación de slugs:** se stripea el prefijo del padre.
- `general-adulto-novela` → `/categoria/general-adulto/novela`
- `escolar-basica-1-6` → `/categoria/escolar/basica-1-6`

Esta lógica se centraliza en `lib/urls.ts`.

---

## Arquitectura de implementación

### Nuevas rutas a crear

```
app/(main)/
└── categoria/
    └── [slug]/
        ├── page.tsx              ← categoría raíz
        └── [subcategory]/
            └── page.tsx          ← subcategoría
```

Ambas páginas son Server Components que:
1. Reciben `params.slug` (y `params.subcategory` en la segunda)
2. Renderizan el mismo contenido que el home con el filtro pre-aplicado
3. Generan metadata con nombre legible del árbol de categorías
4. Incluyen **canonical dinámico** correcto
5. Aceptan query params secundarios (sort, price, etc.) igual que el home

### Función `categoriaUrl()` en `lib/urls.ts`

```typescript
export function categoriaUrl(categorySlug: string, subcategorySlug?: string): string {
  if (!subcategorySlug) return `/categoria/${categorySlug}`;
  // Strip del prefijo del padre: "general-adulto-novela" → "novela"
  const sub = subcategorySlug.startsWith(`${categorySlug}-`)
    ? subcategorySlug.slice(categorySlug.length + 1)
    : subcategorySlug;
  return `/categoria/${categorySlug}/${sub}`;
}
```

### Canonical dinámico

**En las nuevas rutas `/categoria/...`:**
```typescript
canonical: `https://tuslibros.cl/categoria/${slug}${subcategory ? `/${subcategory}` : ""}`
```

**En el home `/?category=...` existente:**
```typescript
// Agregar a generateMetadata()
if (category) {
  const canonicalUrl = subcategory
    ? categoriaUrl(category, subcategory)
    : `/categoria/${category}`;
  alternates: { canonical: `https://tuslibros.cl${canonicalUrl}` }
}
```

### Redirects 308

En `next.config.js`:
```javascript
async redirects() {
  return [
    // /?category=slug → /categoria/slug
    {
      source: '/',
      has: [{ type: 'query', key: 'category' }],
      destination: '/categoria/:category',
      permanent: true,
    },
    // Subcategorías: requiere middleware para stripear prefijo
  ];
}
```

**Nota:** Para subcategorías el redirect necesita transformar el slug (quitar prefijo del padre). Implementar en `middleware.ts` con lógica específica, o dejar que la nueva ruta haga un `redirect()` interno de Next.js.

### Sitemap actualizado

Agregar a `app/sitemap.ts`:
```typescript
// Categorías raíz con al menos 1 libro
const rootCategoryPages = rootCategories.map(cat => ({
  url: `${base}/categoria/${cat.slug}`,
  lastModified: new Date(),
  changeFrequency: "weekly" as const,
  priority: 0.8,
}));

// Subcategorías con al menos 1 libro
const subcategoryPages = subcategories
  .filter(sub => sub.count > 0)
  .map(sub => ({
    url: `${base}${categoriaUrl(sub.parentSlug, sub.slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
```

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Google indexa `/?category=` antes del redirect | Media | Implementar canonical en home ANTES de crear nuevas rutas |
| Duplicación transitoria de contenido | Alta (inevitable) | Canonical correcto en ambas versiones — Google resuelve en 2-4 semanas |
| Romper paginación con filtros combinados | Baja | Paginación interna sigue usando QP internamente |
| Slugs de subcategorías ambiguos | Ninguna | El árbol actual no tiene colisiones |
| Footer con categorías obsoletas genera 404 | Alta | Resolver en Fase 1, antes de cualquier otra cosa |

---

## Orden de implementación incremental

### Fase 1 — Sin romper nada (1-2h)
> Se puede hacer y deployar de forma independiente.

1. **Fix Footer:** reemplazar 4 links obsoletos por categorías reales con slugs actuales
2. **Canonical dinámico** en `/?category=` del home existente (solo metadata)
3. **Agregar categorías al sitemap** (`app/sitemap.ts`)

### Fase 2 — Nuevas rutas (2-3h)
> Requiere Fase 1 completada.

4. Función `categoriaUrl()` en `lib/urls.ts`
5. Crear `app/(main)/categoria/[slug]/page.tsx`
6. Crear `app/(main)/categoria/[slug]/[subcategory]/page.tsx`
7. Metadata legible usando árbol de categorías (`buildCategoryTree()`)

### Fase 3 — Migrar links internos (1h)
> Requiere Fase 2 completada.

8. `CategoriesSidebar.tsx` → usar `categoriaUrl()`
9. `CategoriesMobileDrawer.tsx` → usar `categoriaUrl()`
10. `CollectionBanners.tsx` → actualizar 7 hrefs a nuevas rutas

### Fase 4 — Redirects (30min)
> Requiere Fase 3 completada para no crear bucles.

11. Redirects 308 en `next.config.js` desde `/?category=` → `/categoria/`
12. Middleware para subcategorías si el redirect de next.config no es suficiente

### Fase 5 — Validación (1h)
13. Google Search Console: inspeccionar nuevas URLs
14. Smoke tests para rutas nuevas y redirects
15. Verificar que `/?category=` redirige correctamente

---

## Lo que NO cambia

- `/search?q=...` — búsqueda de texto, no toca categorías
- `/?sort=`, `/?price_min=`, etc. — filtros secundarios siguen siendo QP
- Rutas de libros: `/libro/username/slug`
- Rutas de vendedores: `/vendedor/username`
- Lógica interna de Supabase queries — reutiliza el mismo código existente
- `ListingToolbar` — sigue generando QP para filtros interactivos

---

## Contexto técnico relevante

- **Framework:** Next.js 14.2 App Router
- **Rendering:** Server Components con `unstable_cache` (revalidate 60-300s)
- **Categorías en BD:** tabla `categories` con `slug (PK)`, `name`, `parent_slug`, `sort_order`
- **En libros:** `books.category` y `books.subcategory` son FK a `categories.slug`
- **buildCategoryTree():** en `lib/categoryTree.ts`, 2 queries a Supabase
- **No hay ISR explícito** en home — usa `unstable_cache` con `revalidate`
