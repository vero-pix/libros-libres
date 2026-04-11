import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect legacy /libro/[slug] (without username) → /libro/[username]/[slug]
  const libroMatch = pathname.match(/^\/libro\/([^/]+)$/);
  if (libroMatch) {
    const slug = libroMatch[1];
    // Create a lightweight Supabase client for the lookup
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
    );
    const { data } = await supabase
      .from("listings")
      .select("slug, seller:users(username)")
      .eq("slug", slug)
      .single();

    if (data && (data.seller as any)?.username) {
      const url = request.nextUrl.clone();
      url.pathname = `/libro/${(data.seller as any).username}/${data.slug}`;
      return NextResponse.redirect(url, 308);
    }

    // Fallback: slug no resuelve a ningún listing → tratarlo como búsqueda
    // Esto recupera tráfico SEO de URLs legacy (WordPress, Buscalibre, etc.)
    const searchUrl = request.nextUrl.clone();
    searchUrl.pathname = "/search";
    searchUrl.searchParams.set("q", slug.replace(/-/g, " "));
    return NextResponse.redirect(searchUrl, 302);
  }

  // Redirect legacy /listings/[uuid] → /libro/[username]/[slug]
  const listingsMatch = pathname.match(/^\/listings\/([0-9a-f-]{36})$/);
  if (listingsMatch) {
    const id = listingsMatch[1];
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
    );
    const { data } = await supabase
      .from("listings")
      .select("slug, seller:users(username)")
      .eq("id", id)
      .single();

    if (data?.slug && (data.seller as any)?.username) {
      const url = request.nextUrl.clone();
      url.pathname = `/libro/${(data.seller as any).username}/${data.slug}`;
      return NextResponse.redirect(url, 308);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
