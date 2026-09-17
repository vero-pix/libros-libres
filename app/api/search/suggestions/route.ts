import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { accentInsensitiveRegex } from "@/lib/accentSearch";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();
  // Strip parentheses that break PostgREST or() syntax
  const clean = q.replace(/[()]/g, "").trim();
  if (!clean) return NextResponse.json([]);
  const rx = accentInsensitiveRegex(clean);

  // Se piden más de los que se muestran para poder ordenarlos acá: la base los
  // devuelve en orden arbitrario, así que "atlas" sacaba primero "Cómo Ser
  // Charles Atlas" y el Atlas de Nubes aparecía octavo. (16-09-2026)
  const { data: listings } = await supabase
    .from("listings")
    .select("id, slug, cover_image_url, created_at, book:books!inner(id, title, author, cover_url), seller:users(username)")
    .eq("status", "active")
    .or(`title.imatch.${rx},author.imatch.${rx}`, { referencedTable: "books" })
    .order("created_at", { ascending: false })
    .limit(40);

  // Primero lo que calza mejor, y entre iguales, lo recién publicado — que es
  // lo que el vendedor acaba de subir y quiere ver arriba.
  const normalizar = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const busca = normalizar(clean);
  const puntaje = (l: any) => {
    const titulo = normalizar(l.book?.title ?? "");
    const autor = normalizar(l.book?.author ?? "");
    if (titulo.startsWith(busca)) return 0;            // "Atlas Internacional…"
    if (new RegExp(`\\b${busca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(titulo)) return 1; // palabra del título
    if (titulo.includes(busca)) return 2;              // en cualquier parte del título
    if (autor.startsWith(busca)) return 3;
    return 4;                                          // solo por autor
  };
  const ordenadas = (listings ?? []).slice().sort((a: any, b: any) => {
    const d = puntaje(a) - puntaje(b);
    if (d !== 0) return d;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  }).slice(0, 8);

  const suggestions = ordenadas.map((l: any) => ({
    id: l.id,
    slug: l.slug,
    username: l.seller?.username ?? null,
    title: l.book.title,
    author: l.book.author,
    cover_url: l.cover_image_url ?? l.book.cover_url,
  }));

  return NextResponse.json(suggestions);
}
