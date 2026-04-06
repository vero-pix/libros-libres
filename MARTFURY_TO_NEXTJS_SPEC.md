# Martfury WP Theme -> Next.js Migration Spec
## tuslibros.cl Legacy Analysis

**Fecha:** 6 abril 2026
**Tema analizado:** Martfury v3.3.8 (DrFuri) - WooCommerce Marketplace Theme
**Target:** Next.js 14 + TypeScript + Supabase + Mapbox (App Router)

---

## 1. Executive Summary

### Hallazgos clave

Martfury es un tema WooCommerce marketplace con soporte multi-vendor (Dokan, WC Vendors, DC Vendors, WCFM). Incluye 7 variantes de header, mega-menu, product quick-view, wishlist/compare, mini-cart AJAX, y responsive mobile-first. El tema usa un sistema de hooks extensivo -- la mayor parte de la logica visual se inyecta via `do_action()` en `inc/frontend/`, no directamente en los templates PHP.

### Complejidad estimada

| Aspecto | Complejidad | Nota |
|---------|-------------|------|
| Templates PHP core | Baja | 11 archivos, estructura estandar WP |
| WooCommerce overrides | Media-Alta | 48 archivos con customizaciones profundas |
| Sistema de headers | Media | 7 layouts, pero solo 1 se usa tipicamente |
| CSS/SCSS | Alta | 720KB compilado, ~600KB en SCSS modulares |
| JS funcionalidad | Media | 115KB scripts.js (sliders, AJAX, quickview) |
| Vendor integration | Baja para tuslibros | Dokan/WC Vendors no aplica; ya usan Supabase |

### Prioridad de migracion

Del analisis del tema y el roadmap actual de tuslibros.cl, los componentes criticos a migrar son: product card (listing), search con autocompletado, single product page, checkout flow, y header/footer. El resto (blog, widgets, mega-menu WP) es legacy descartable.

---

## 2. Mapping Table: WP Template -> Next.js Component

### Templates raiz

| WP Template | Funcion WP | Next.js Equivalente | Tipo Component | Prioridad |
|-------------|-----------|---------------------|----------------|-----------|
| `header.php` | Shell HTML + header | `app/layout.tsx` (root layout) | Server | Alta |
| `footer.php` | Footer + wp_footer() | `app/layout.tsx` (root layout) | Server | Alta |
| `index.php` | Homepage / fallback | `app/page.tsx` | Server | Alta |
| `single.php` | Detalle post/libro | `app/libro/[id]/page.tsx` | Server | Alta |
| `archive.php` | Listado categorias | `app/categoria/[slug]/page.tsx` | Server | Alta |
| `search.php` | Resultados busqueda | `app/buscar/page.tsx` | Client | Alta |
| `page.php` | Paginas estaticas | `app/[slug]/page.tsx` | Server | Baja |
| `sidebar.php` | Sidebar condicional | `components/Sidebar.tsx` | Client | Media |
| `comments.php` | Sistema comentarios | `components/Reviews.tsx` | Client | Media |
| `404.php` | Pagina no encontrada | `app/not-found.tsx` | Server | Baja |

### Templates especiales

| WP Template | Next.js Equivalente | Nota |
|-------------|---------------------|------|
| `template-homepage.php` | `app/page.tsx` | Usa Elementor; reemplazar con componentes React |
| `template-full-width.php` | Layout variant sin sidebar | CSS class en layout |
| `template-coming-soon-page.php` | Descartar | No aplica para sitio en produccion |

### Template Parts

| WP Template Part | Next.js Equivalente | Tipo |
|-----------------|---------------------|------|
| `template-parts/headers/layout-1.php` | `components/Header/Header.tsx` | Client |
| `template-parts/footers/layout-1.php` | `components/Footer/Footer.tsx` | Server |
| `template-parts/content.php` | `components/BookCard.tsx` | Server |
| `template-parts/content-single.php` | `components/BookDetail.tsx` | Server |
| `template-parts/content-search.php` | `components/SearchResult.tsx` | Client |
| `template-parts/content-404.php` | `app/not-found.tsx` | Server |
| `template-parts/content-none.php` | `components/EmptyState.tsx` | Server |
| `template-parts/logo.php` | `components/Logo.tsx` | Server |
| `template-parts/mobile/header-v1.php` | Responsive dentro de `Header.tsx` | Client |
| `template-parts/mobile/navigation.php` | `components/MobileNav.tsx` | Client |
| `template-parts/mobile/cart.php` | `components/MiniCart.tsx` | Client |
| `template-parts/mobile/search.php` | Integrado en `SearchBar.tsx` | Client |
| `template-parts/page-headers/catalog-1.php` | `components/CategoryHeader.tsx` | Server |
| `template-parts/page-headers/product.php` | Breadcrumb en `BookDetail.tsx` | Server |
| `template-parts/vendor/loop-sold-by.php` | `components/SellerBadge.tsx` | Server |

### WooCommerce Overrides -> Componentes Marketplace

| WC Override | Next.js Equivalente | Prioridad |
|-------------|---------------------|-----------|
| `woocommerce/content-product.php` | `components/BookCard.tsx` | **Critica** |
| `woocommerce/content-single-product.php` | `app/libro/[id]/page.tsx` | **Critica** |
| `woocommerce/cart/cart.php` | `app/carrito/page.tsx` | **Critica** |
| `woocommerce/cart/mini-cart.php` | `components/MiniCart.tsx` | Alta |
| `woocommerce/checkout/form-checkout.php` | `app/checkout/page.tsx` | **Critica** |
| `woocommerce/myaccount/form-login.php` | `app/login/page.tsx` | Alta |
| `woocommerce/loop/add-to-cart.php` | `components/AddToCartButton.tsx` | Alta |
| `woocommerce/loop/pagination.php` | `components/Pagination.tsx` | Media |
| `woocommerce/loop/orderby.php` | `components/SortDropdown.tsx` | Media |
| `woocommerce/single-product/product-image.php` | `components/BookImageGallery.tsx` | Alta |
| `woocommerce/single-product/tabs/tabs.php` | `components/BookTabs.tsx` | Media |
| `woocommerce/single-product/related.php` | `components/RelatedBooks.tsx` | Media |
| `woocommerce/single-product/rating.php` | `components/Rating.tsx` | Media |
| `woocommerce/single-product/meta.php` | `components/BookMeta.tsx` | Media |
| `woocommerce/single-product/stock.php` | `components/StockBadge.tsx` | Baja |
| `woocommerce/content-product-quick-view.php` | `components/QuickViewModal.tsx` | Baja |
| `woocommerce/content-product-list.php` | `components/BookCardList.tsx` (vista lista) | Baja |
| `woocommerce/add-to-wishlist*.php` | Descartar | Funcionalidad nativa no aplica |
| `woocommerce/single-product/up-sells.php` | `components/RelatedBooks.tsx` (reutilizar) | Baja |

---

## 3. Component Specs

### 3.1 BookCard (content-product.php -> BookCard.tsx)

**Origen WP:** `woocommerce/content-product.php` renderiza via hooks:
- `woocommerce_before_shop_loop_item` -> link apertura
- `woocommerce_before_shop_loop_item_title` -> imagen + badge sale
- `woocommerce_shop_loop_item_title` -> titulo producto
- `woocommerce_after_shop_loop_item_title` -> rating + precio
- `woocommerce_after_shop_loop_item` -> boton add-to-cart

**Traduccion Next.js:**

```tsx
// components/BookCard.tsx
'use client';

interface BookCardProps {
  id: string;
  titulo: string;
  autor: string;
  precio: number;
  precioOriginal?: number;
  imagen: string;
  condicion: 'nuevo' | 'como_nuevo' | 'buen_estado' | 'aceptable';
  vendedor: {
    id: string;
    nombre: string;
    comuna: string;
  };
  tipo: 'venta' | 'arriendo';
  slug: string;
}

export default function BookCard({
  id, titulo, autor, precio, precioOriginal,
  imagen, condicion, vendedor, tipo, slug
}: BookCardProps) {
  // Integrar con tabla `listings` de Supabase usando cliente client-side
  // Imagen desde Supabase Storage bucket `book-images`
  // Link: /libro/{slug}
  // Boton agregar al carrito: dispatch a carrito context
  return (/* JSX */)
}
```

**Directivas Claude Code:**
- Usar Supabase client-side para fetch si se necesita interactividad (carrito)
- Imagen con `next/image` + loader Supabase Storage
- Condicion del libro como badge visual (no existe en WP original)
- Vendedor + comuna: dato que WP obtiene de Dokan; en tuslibros viene de tabla `profiles`

**Notas de diseno:**
- Grid responsive: 4 cols desktop, 2 cols tablet, 1 col mobile (Martfury usa Bootstrap grid `col-md-3`)
- Hover: quick-view overlay (Martfury) -> simplificar a link directo
- Precio: formato CLP `$XX.XXX` sin decimales

---

### 3.2 Header (headers/layout-1.php -> Header.tsx)

**Origen WP:** Layout 1 tiene 3 secciones:
1. **header-main**: Logo (col-3) + Search bar + Extras menu (hotline, compare, wishlist, cart, account) (col-9)
2. **main-menu**: Department dropdown (col-3) + Navigation menu + Header bar (col-9)
3. **mobile-menu**: Toggle hamburger + search (hidden-lg hidden-md)

**Traduccion Next.js:**

```tsx
// components/Header/Header.tsx
'use client';

interface HeaderProps {
  usuario?: {
    id: string;
    nombre: string;
    avatar?: string;
    estaLogueado: boolean;
  };
  cantidadCarrito: number;
}

export default function Header({ usuario, cantidadCarrito }: HeaderProps) {
  // Supabase Auth para estado de sesion
  // Carrito desde context global
  // Search: autocompletado contra Supabase `listings` con debounce
  return (/* JSX */)
}
```

**Subcomponentes:**
- `SearchBar.tsx` -- autocompletado (ya existe en tuslibros: `autocompletado busqueda` del roadmap)
- `MiniCart.tsx` -- panel lateral con items
- `UserMenu.tsx` -- dropdown login/perfil/mis-ventas
- `MobileNav.tsx` -- drawer lateral categorias
- `Logo.tsx` -- SVG/imagen tuslibros.cl

**Directivas Claude Code:**
- Search debe consultar `listings` via Supabase con `ilike` o Full Text Search
- MiniCart: estado global (Context o Zustand), persistido en localStorage
- Responsive: Tailwind breakpoints (`lg:hidden`, `md:flex`) en vez de Bootstrap `hidden-xs`

**Notas de diseno:**
- Martfury usa Bootstrap grid 12-col; tuslibros ya usa Tailwind
- Sticky header: Martfury lo soporta via opcion `sticky_header`; implementar con `sticky top-0 z-50`
- Paleta actual tuslibros: cream/ink/brand dorado (NO el amarillo #fcb800 de Martfury)

---

### 3.3 Single Product (content-single-product.php -> BookDetail)

**Origen WP:** Dos secciones principales:
1. `mf-product-detail`: Imagen gallery + Summary (titulo, rating, precio, excerpt, add-to-cart, meta)
2. `mf-product-summary`: Tabs (descripcion, info adicional, reviews) + upsells + related

**Traduccion Next.js:**

```tsx
// app/libro/[id]/page.tsx (Server Component)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

interface LibroPageProps {
  params: { id: string };
}

export default async function LibroPage({ params }: LibroPageProps) {
  const supabase = createServerComponentClient({ cookies });
  const { data: libro } = await supabase
    .from('listings')
    .select(`
      *,
      profiles:seller_id (id, full_name, comuna, bio, avatar_url),
      categories (id, name, slug)
    `)
    .eq('id', params.id)
    .single();

  // Server-side fetch, render BookDetail client component
  return <BookDetail libro={libro} />;
}
```

```tsx
// components/BookDetail.tsx
'use client';

interface Libro {
  id: string;
  titulo: string;
  autor: string;
  isbn?: string;
  descripcion: string;
  precio: number;
  condicion: string;
  imagenes: string[];
  tipo: 'venta' | 'arriendo';
  diasArriendo?: 7 | 14 | 30;
  garantia?: number;
  vendedor: {
    id: string;
    nombre: string;
    comuna: string;
    bio?: string;
    avatarUrl?: string;
  };
  categoria: {
    id: string;
    nombre: string;
    slug: string;
  };
}

interface BookDetailProps {
  libro: Libro;
}

export default function BookDetail({ libro }: BookDetailProps) {
  // Galeria imagenes (reemplaza WC product-image.php + product-thumbnails.php)
  // Tabs: Descripcion, Detalles, Ubicacion (Mapbox), Reviews
  // Boton comprar/arrendar -> checkout
  // SellerBadge con link a /tienda/{vendedor.id}
  return (/* JSX */)
}
```

**Directivas Claude Code:**
- Data fetching server-side desde `listings` JOIN `profiles` JOIN `categories`
- Galeria: usar libreria como `swiper` o custom con `next/image`
- Tab "Ubicacion": integrar Mapbox con coordenadas del vendedor (ya en tabla `profiles`)
- Opciones de entrega: mostrar las 3 opciones (persona/retiro/courier) segun vendedor
- ISBN scanner: ya implementado, vincular datos si ISBN disponible

---

### 3.4 Checkout (form-checkout.php -> Checkout)

**Origen WP:** Layout 2 columnas:
- Col 7: Customer details (billing + shipping)
- Col 5: Order review + payment

**Traduccion Next.js:**

```tsx
// app/checkout/page.tsx
'use client';

interface CheckoutProps {}

export default function CheckoutPage() {
  // MercadoPago Split Payment (ya implementado)
  // 3 opciones entrega: persona, retiro, courier (ya implementado)
  // Comisiones por plan: Libre 8%, Librero 5%, Libreria 3%
  // Chilexpress cotizacion (bloqueado - fallback $2.900)
  return (/* JSX */)
}
```

**Directivas Claude Code:**
- Ya funciona en produccion con MercadoPago split
- Mantener estructura actual; no migrar layout WP
- Focus: mejorar UX mobile del checkout existente

---

### 3.5 Footer (footers/layout-1.php -> Footer.tsx)

**Origen WP:** Estructura:
- Newsletter form
- Footer info (texto customizer)
- Footer widgets (6 areas de widgets)
- Footer links (sidebar area)
- Footer bottom: copyright + payment icons

**Traduccion Next.js:**

```tsx
// components/Footer/Footer.tsx
interface FooterProps {
  // Server component - no necesita props reactivos
}

export default function Footer() {
  // Newsletter: ya implementado (form + API + Supabase)
  // Links: categorias, info, contacto
  // Contacto: WhatsApp + formulario (ya migrado)
  // Copyright + redes sociales
  return (/* JSX */)
}
```

---

### 3.6 SellerBadge (loop-sold-by.php -> SellerBadge.tsx)

**Origen WP:** Muestra "Sold By: {shop_name}" con link a tienda Dokan.

```tsx
// components/SellerBadge.tsx
interface SellerBadgeProps {
  vendedorId: string;
  nombre: string;
  comuna?: string;
}

export default function SellerBadge({ vendedorId, nombre, comuna }: SellerBadgeProps) {
  // Link a /tienda/{vendedorId}
  // Mostrar comuna si disponible
  // Integrar con tabla `profiles` de Supabase
  return (/* JSX */)
}
```

---

### 3.7 Login/Register (form-login.php -> AuthPage)

**Origen WP:** Tabs Login/Register en panel unico. Layout "promotion" usa col-5 + promo sidebar.

**Estado actual tuslibros:** Ya implementado como `login/register split panel claro` con Google OAuth.

**Accion:** No migrar. El componente actual de tuslibros es superior al de Martfury. Descartar.

---

## 4. Assets Manifest

### 4.1 CSS/SCSS

| Archivo | Tamano | Contenido | Accion |
|---------|--------|-----------|--------|
| `style.css` | 720KB | CSS compilado completo | **Referencia** - extraer selectores criticos |
| `css/variables.scss` | 609B | Variables color/tipografia | **Migrar** a CSS variables Tailwind |
| `css/typography.scss` | 1.3KB | :root vars + tipografia base | **Referencia** para token mapping |
| `css/header.scss` | 70KB | Estilos 7 layouts header | Extraer layout-1 relevante |
| `css/woocommerce.scss` | 247KB | Todos los estilos WC | Extraer product card, single, cart |
| `css/elements.scss` | 89KB | Componentes UI (botones, badges, tabs) | Extraer patrones reutilizables |
| `css/responsive.scss` | 89KB | Media queries | **Referencia** para breakpoints |
| `css/mobile.scss` | 51KB | Estilos mobile-specific | **Referencia** |
| `css/footer.scss` | 8.7KB | Footer styles | Extraer estructura base |
| `css/modal.scss` | 9.8KB | Modales (quickview, etc) | Extraer si se implementa quickview |
| `css/widgets.scss` | 22KB | Sidebar widgets | Descartar (Tailwind components) |
| `css/content.scss` | 24KB | Blog content styles | Baja prioridad |
| `css/bootstrap.min.css` | 19KB | Bootstrap 3 grid | **Descartar** - ya usan Tailwind |
| `css/font-awesome.min.css` | 30KB | Font Awesome 4 | Descartar - usar Lucide/Heroicons |
| `css/eleganticons.min.css` | 21KB | Elegant Icons | Descartar |
| `css/ionicons.min.css` | 51KB | Ionicons | Descartar |
| `css/linearicons.min.css` | 46KB | Linearicons | Descartar |
| `css/skin.scss` | 1.6KB | Light skin variant | Referencia para modo claro |

### Variables de color - Mapping

| Martfury Variable | Valor | tuslibros Equivalente |
|-------------------|-------|----------------------|
| `$primary-color` / `--mf-primary-color` | `#fcb800` (amarillo) | Brand dorado (verificar valor exacto) |
| `$gray-darker` | `#111` | ink (texto principal) |
| `$gray-dark` | `#666` | texto secundario |
| `$gray` | `#999` | texto terciario/placeholders |
| `$gray-light` | `#ccc` | bordes |
| `$gray-lighter` | `#fafafa` | fondos alternos |
| `$light` | `#fff` | cream (fondo principal) |
| `$dark` | `#000` | ink |
| `$secondary-color` | `#5cb85c` (verde) | estado disponible |

### Tipografia - Mapping

| Martfury | Valor | tuslibros Actual |
|----------|-------|------------------|
| `$font-family-primary` | 'Work Sans', Arial, sans-serif | **DM Sans** (ya definido) |
| `$font-family-secondary` | 'Libre Baskerville', Times, serif | **Playfair Display** (ya definido) |
| Font size base | 14px | Verificar consistencia |
| Heading weights | 700 | Mantener |
| Line-height body | 1.6 | Mantener |

### 4.2 Fonts (archivos locales)

| Familia | Formatos | Tamano total | Accion |
|---------|----------|-------------|--------|
| ElegantIcons | eot, svg, ttf, woff, woff2 | ~460KB | **Descartar** - reemplazar con Lucide React |
| Font Awesome 4 | otf, eot, svg, ttf, woff, woff2 | ~1MB | **Descartar** - usar Lucide o Heroicons |
| Ionicons | eot, svg, ttf, woff, woff2 | ~730KB | **Descartar** |
| Linearicons | eot, svg, ttf, woff, woff2 | ~2.7MB | **Descartar** |

**Total icon fonts legacy: ~4.9MB** -- Reemplazo: Lucide React (tree-shakeable, ~2KB por icono usado).

tuslibros ya usa **Playfair Display + DM Sans** via Google Fonts. No migrar Work Sans ni Libre Baskerville.

### 4.3 Imagenes

| Archivo | Uso | Accion |
|---------|-----|--------|
| `images/logo/logo.png` | Logo Martfury default | **Descartar** - tuslibros tiene logo propio |
| `images/logo/coming-soon-logo.png` | Pagina coming soon | Descartar |
| `images/placeholder.png` | Placeholder producto sin imagen | **Migrar** concepto - crear placeholder book |
| `images/bg-404.jpg` | Background pagina 404 (62KB) | **Evaluar** - podria reutilizarse/adaptar |
| `images/vendor.jpg` | Imagen default vendor (44KB) | **Migrar** concepto - avatar default vendedor |
| `images/transparent.png` | Pixel transparente (lazy load) | Descartar - `next/image` maneja esto |
| `images/sidebars/empty.png` | Sidebar layout icon | Descartar |
| `images/sidebars/single-left.png` | Sidebar layout icon | Descartar |
| `images/sidebars/single-right.png` | Sidebar layout icon | Descartar |
| `screenshot.png` | Preview tema WP (374KB) | **Referencia** visual del diseno original |

### 4.4 JavaScript

| Archivo | Tamano | Funcionalidad | Accion |
|---------|--------|---------------|--------|
| `js/scripts.js` | 115KB | Core theme JS | Analizar funciones |
| `js/scripts.min.js` | 59KB | Minificado | - |
| `js/plugins/` | ~18 archivos | Librerias terceros | Ver detalle abajo |
| `js/backend/` | 4 archivos | Admin WP | Descartar |

**Funcionalidades JS a evaluar:**

| Funcionalidad WP | Implementacion Martfury | Next.js Equivalente | Estado tuslibros |
|-------------------|------------------------|---------------------|------------------|
| Product quickview | AJAX modal | `QuickViewModal.tsx` con Headless UI | No implementado |
| AJAX add to cart | WC fragments | Context + Supabase mutation | **Ya funciona** |
| Search autocomplete | WC AJAX search | Supabase FTS + debounce | **Ya funciona** |
| Image lazy loading | Custom JS + transparent.png | `next/image` native | **Ya funciona** |
| Sticky header | Scroll event listener | `sticky` CSS | Implementar |
| Product gallery | Slick slider | Swiper o custom | Implementar |
| Mini cart toggle | jQuery toggle | React state | **Ya funciona** |
| Newsletter popup | jQuery modal | Descartar (tienen form inline) | **Ya funciona** |
| Back to top | Scroll button | Simple React component | Baja prioridad |
| Product tabs | jQuery tabs | Headless UI Tabs | Implementar |
| Quantity selector | jQuery +/- buttons | React controlled input | **Ya funciona** |
| Mobile menu | jQuery slideToggle | Headless UI Dialog | **Ya funciona** |
| Infinite scroll | AJAX pagination | Intersection Observer + Supabase | No implementado |
| Recently viewed | Cookie + AJAX | localStorage + Context | No implementado |
| Compare products | WC plugin | Descartar | No aplica |
| Wishlist | WC plugin | Descartar | No aplica |

---

## 5. Inc/ Directory Analysis

### Archivos de logica (solo relevantes para migracion)

| Archivo | Funcion | Relevancia |
|---------|---------|------------|
| `inc/frontend/woocommerce.php` | Clase principal WC: hooks, AJAX search, quickview, fragments | **Alta** - logica de negocio del marketplace |
| `inc/frontend/header.php` | Render header, search bar, extras menu | **Alta** - estructura header |
| `inc/frontend/footer.php` | Render footer, newsletter, widgets | Media |
| `inc/frontend/layout.php` | Sidebar logic, body classes | Baja |
| `inc/frontend/entry.php` | Post/page content rendering | Baja |
| `inc/frontend/nav.php` | Navigation, mega-menu render | Media |
| `inc/functions/layout.php` | Layout helpers, column classes | Baja - Bootstrap specific |
| `inc/functions/breadcrumbs.php` | Breadcrumb generation | Media - replicar logica |
| `inc/functions/header.php` | Header utility functions | Referencia |
| `inc/functions/footer.php` | Footer utility functions | Referencia |
| `inc/functions/media.php` | Image sizes, lazy loading | Baja - next/image |
| `inc/vendors/vendors.php` | Multi-vendor setup (Dokan, WCV, etc.) | **Descartar** - Supabase propio |
| `inc/vendors/dokan.php` | Dokan integration | Descartar |
| `inc/vendors/wc_vendors.php` | WC Vendors integration | Descartar |
| `inc/mobile/layout.php` | Mobile detection + layout | Baja - responsive CSS |
| `inc/modules/product-bought-together/` | "Bought together" module | Baja - futuro feature |
| `inc/backend/*` | Admin: customizer, metaboxes, plugins | **Descartar** completamente |
| `inc/mega-menu/*` | Mega menu walker + admin | Descartar - simplificar nav |
| `inc/libs/mobile_detect.php` | PHP mobile detection | Descartar - CSS media queries |

---

## 6. Vendor-specific Templates (Descartar)

Los directorios `dokan/`, `wc-vendors/`, `dc-vendors/`, `vc_templates/` contienen overrides para plugins de vendor marketplace de WordPress. **Todos se descartan** porque tuslibros.cl ya implementa su propio sistema de vendedores con Supabase + MercadoPago split payments.

El concepto relevante a extraer es el patron de "Sold By" (`template-parts/vendor/loop-sold-by.php`): mostrar vendedor + link a tienda en cada listing. Esto ya existe conceptualmente en tuslibros pero puede refinarse visualmente.

---

## 7. Funcionalidades Legacy a Descartar

| Funcionalidad Martfury | Razon de descarte |
|------------------------|-------------------|
| WP Customizer (theme options) | Next.js no usa WP customizer; config via env vars |
| Elementor integration | Page builder WP; componentes React nativos |
| WPML (multilenguaje) | Sitio monolingue espanol chileno |
| WP Widgets system | Reemplazado por componentes React |
| Mega Menu walker | Simplificar a nav estandar con categorias |
| Multiple header layouts (7) | Usar solo 1 layout consistente |
| Post formats (audio, gallery, video, quote) | Blog no es prioridad; posts simples |
| Compare products | No aplica al modelo de libros usados |
| Wishlist | No prioritario; evaluar futuro |
| RTL support (rtl.css 56KB) | No necesario para Chile |
| WC Vendors / Dokan / WCFM | Sistema propio de vendedores |
| TGM Plugin Activation | Backend WP |

---

## 8. Redirects SEO: URLs WordPress -> Next.js

Basado en la estructura del tema, las URLs legacy probables son:

| URL WordPress | URL Next.js | Tipo |
|---------------|-------------|------|
| `/producto/{slug}/` | `/libro/{id}` o `/libro/{slug}` | 301 |
| `/categoria-producto/{slug}/` | `/categoria/{slug}` | 301 |
| `/tienda/` | `/explorar` | 301 |
| `/tienda/{vendor-slug}/` | `/tienda/{vendor-id}` | 301 |
| `/carrito/` | `/carrito` | 301 |
| `/finalizar-compra/` | `/checkout` | 301 |
| `/mi-cuenta/` | `/perfil` | 301 |
| `/mi-cuenta/pedidos/` | `/mis-compras` | 301 |
| `/?s={query}&post_type=product` | `/buscar?q={query}` | 301 |
| `/blog/{slug}/` | `/blog/{slug}` (si se implementa) | 301 |
| `/contacto/` | `/contacto` | 301 |

**Implementar en `next.config.js`:**

```javascript
// next.config.js
module.exports = {
  async redirects() {
    return [
      { source: '/producto/:slug', destination: '/libro/:slug', permanent: true },
      { source: '/categoria-producto/:slug', destination: '/categoria/:slug', permanent: true },
      { source: '/tienda', destination: '/explorar', permanent: true },
      { source: '/finalizar-compra', destination: '/checkout', permanent: true },
      { source: '/mi-cuenta', destination: '/perfil', permanent: true },
      { source: '/mi-cuenta/pedidos', destination: '/mis-compras', permanent: true },
    ];
  },
};
```

---

## 9. Implementation Roadmap

### Fase 0: Assets Recovery (1-2 dias)
- [ ] Extraer screenshot.png como referencia visual
- [ ] Documentar selectores CSS criticos de `woocommerce.scss` para product card
- [ ] Crear placeholder-book.svg y avatar-default.svg inspirados en Martfury
- [ ] Mapear iconos usados en Martfury a equivalentes Lucide React

### Fase 1: Componentes Core (3-5 dias)
- [ ] `BookCard.tsx` -- card de libro para grids (basado en content-product.php)
- [ ] `BookCardList.tsx` -- variante lista horizontal
- [ ] `BookImageGallery.tsx` -- galeria de imagenes producto
- [ ] `BookTabs.tsx` -- tabs descripcion/detalles/ubicacion/reviews
- [ ] `SellerBadge.tsx` -- badge vendedor con comuna
- [ ] `Rating.tsx` -- estrellas de valoracion (preparar para reviews futuro)
- [ ] `Pagination.tsx` -- paginacion numerica (estilo Martfury)
- [ ] `SortDropdown.tsx` -- ordenar por precio/fecha/relevancia
- [ ] `Breadcrumbs.tsx` -- basado en inc/functions/breadcrumbs.php

### Fase 2: Layout y Navegacion (2-3 dias)
- [ ] Refinar `Header.tsx` inspirado en layout-1 de Martfury
- [ ] Refinar `Footer.tsx` basado en footer layout-1
- [ ] Implementar sticky header
- [ ] `CategorySidebar.tsx` -- sidebar filtros (adaptado de catalog-sidebar)
- [ ] Implementar redirects SEO en next.config.js

### Fase 3: Paginas Marketplace (3-5 dias)
- [ ] Refinar `/libro/[id]` con estructura de content-single-product.php
- [ ] Refinar `/explorar` con grid + sidebar + sort + pagination
- [ ] Refinar `/buscar` con resultados estilo Martfury
- [ ] Implementar `/tienda/[id]` -- pagina vendedor
- [ ] Pagina 404 personalizada

### Fase 4: UX Enhancements (2-3 dias)
- [ ] Product quickview modal (opcional)
- [ ] "Vistos recientemente" (localStorage)
- [ ] Infinite scroll como alternativa a paginacion
- [ ] Back to top button
- [ ] Transiciones de pagina (View Transitions API)

### Tiempo total estimado: 11-18 dias de desarrollo

---

## 10. Notas Finales

**Lo que Martfury aporta a tuslibros:** Principalmente patrones de UX marketplace probados: la estructura del product card, el layout 2-col de single product, el header con search prominente, y el flujo visual del checkout. El CSS de 720KB tiene patrones valiosos de spacing, responsive, y estados hover que sirven como referencia.

**Lo que NO migrar:** Todo el sistema de plugins WP (Dokan, WC Vendors, Elementor, TGM), el backend admin, los 4 icon font sets (4.9MB), Bootstrap grid, jQuery dependencies, y las 7 variantes de header. tuslibros.cl ya tiene una base tecnica superior en todos estos aspectos.

**Riesgo principal:** El gap entre "referencia visual" y "implementacion real" requiere disciplina. El tema Martfury fue disenado para configuracion via customizer WP; cada componente Next.js debe ser autocontenido y no depender de opciones globales.
