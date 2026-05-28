"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_NAMES, CATEGORY_GROUPS } from "@/lib/genres";
import Image from "next/image";
import Link from "next/link";

interface OrphanBook {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  cover_url: string | null;
  description: string | null;
}

export default function ClasificadorPage() {
  const supabase = createClient();
  const [books, setBooks] = useState<OrphanBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile?.role !== "admin") {
        window.location.href = "/";
        return;
      }
      setIsAdmin(true);
      fetchOrphans();
    }
    checkAdmin();
  }, []);

  async function fetchOrphans() {
    setLoading(true);
    // Buscamos libros que NO tengan categoría asignada
    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, genre, cover_url, description")
      .is("category", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBooks(data);
    }
    setLoading(false);
  }

  async function handleAssign(bookId: string, category: string) {
    setSavingId(bookId);
    
    // Si la categoría tiene subcategorías, intentamos inferir o dejamos pendiente
    // Para simplificar el clasificador rápido, asignamos la categoría principal
    // y si es necesario, una subcategoría genérica.
    
    const { error } = await supabase
      .from("books")
      .update({ 
        category: category,
        // Si es una subcategoría de las que tenemos mapeadas, la seteamos
        subcategory: category.includes("-") ? category : null 
      })
      .eq("id", bookId);

    if (!error) {
      // Remover de la lista local
      setBooks(prev => prev.filter(b => b.id !== bookId));
    } else {
      alert("Error al guardar: " + error.message);
    }
    setSavingId(null);
  }

  if (!isAdmin) return <div className="p-20 text-center">Verificando permisos...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink">Clasificador de Huérfanos</h1>
          <p className="text-ink-muted">
            {search ? (
              <>Mostrando <span className="font-bold text-brand-600">{books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())).length}</span> resultados de la búsqueda.</>
            ) : (
              <>Hay <span className="font-bold text-brand-600">{books.length}</span> libros esperando categoría.</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="text"
            placeholder="Buscar por título o autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-white border border-cream-dark/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-sm"
          />
          <Link href="/admin" className="text-sm font-medium text-brand-600 hover:underline">
            Volver al Admin
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Cargando libros...</div>
      ) : books.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-xl font-bold text-ink">¡Todo al día!</h2>
          <p className="text-gray-500">No hay libros huérfanos por ahora.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-cream-dark/30 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-cream-warm border-b border-cream-dark">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Libro</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Género Anterior</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-64">Nueva Clasificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {books
                .filter(b => 
                  b.title.toLowerCase().includes(search.toLowerCase()) || 
                  b.author.toLowerCase().includes(search.toLowerCase())
                )
                .map((book) => (
                <tr key={book.id} className={savingId === book.id ? "opacity-50 pointer-events-none" : ""}>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      {book.cover_url ? (
                        <div className="relative w-10 h-14 flex-shrink-0">
                          <Image src={book.cover_url} alt={`Portada de ${book.title}`} fill className="object-cover rounded shadow-sm" />
                        </div>
                      ) : (
                        <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400">Sin foto</div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate text-sm">{book.title}</p>
                        <p className="text-xs text-gray-500">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {book.genre || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className="w-full bg-cream border border-cream-dark/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                      onChange={(e) => handleAssign(book.id, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Selecciona categoría...</option>
                      {CATEGORY_GROUPS.map(group => (
                        <optgroup key={group.label} label={group.label}>
                          {group.genres.map(slug => (
                            <option key={slug} value={slug}>{CATEGORY_NAMES[slug] || slug}</option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="otros">Otros</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
