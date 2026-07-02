import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { createPublicClient } from '@/lib/supabase/public'
import ListingCard from '@/components/listings/ListingCard'
import { COLLECTIONS } from './collections.config'
import type { ListingWithBook } from '@/types'

export const revalidate = 3600

type Props = { params: { slug: string } }

export async function generateStaticParams() {
  return Object.keys(COLLECTIONS).map((slug) => ({ slug }))
}

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

export default async function ColeccionPage({ params }: Props) {
  const collection = COLLECTIONS[params.slug]
  if (!collection) notFound()

  const supabase = createPublicClient()

  const { data: listings, error } = await supabase
    .from('listings')
    .select(`*, book:books!inner(*), seller:users(id, username, full_name, avatar_url, on_vacation, vacation_message)`)
    .eq('status', 'active')
    .neq('deprioritized', true)
    .contains('book.tags', [collection.tagFilter])
    .order('featured_rank', { ascending: true, nullsFirst: false })
    .limit(48)

  if (error) console.error('[coleccion] Error fetching listings:', error)
  const books = ((listings ?? []).filter((l: any) => l.book) as unknown) as ListingWithBook[]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.title,
    description: collection.seoDescription,
    url: `https://tuslibros.cl/coleccion/${params.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: books.length,
      itemListElement: books.slice(0, 10).map((listing, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Book',
          name: listing.book?.title,
          author: listing.book?.author ? { '@type': 'Person', name: listing.book.author } : undefined,
          offers: listing.price != null
            ? { '@type': 'Offer', price: listing.price, priceCurrency: 'CLP', availability: 'https://schema.org/InStock' }
            : undefined,
        },
      })),
    },
  }

  return (
    <>
      <Script
        id="coleccion-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
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

        {/* Grid de libros */}
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {books.map((listing) => (
              <ListingCard key={listing.id} listing={listing} showDistance={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-ink-muted">
            <p className="font-display text-lg mb-2">No hay libros disponibles en esta colección ahora mismo.</p>
            <p className="text-sm">
              Revisa más tarde o{' '}
              <Link href="/" className="text-brand-600 hover:underline">
                explora la tienda completa
              </Link>.
            </p>
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
    </>
  )
}
