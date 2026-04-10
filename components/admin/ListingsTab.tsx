"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { AdminListing } from "./types";
import { FilterBtn, SmallBtn, EmptyState } from "./SharedUI";

const LISTING_STATUSES = ["active", "paused", "completed", "rented"] as const;
const LISTING_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Activo", color: "bg-green-100 text-green-700" },
  paused: { label: "Pausado", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Vendido", color: "bg-gray-100 text-gray-500" },
  rented: { label: "Arrendado", color: "bg-blue-100 text-blue-700" },
};

export default function ListingsTab({ listings, onUpdate }: { listings: AdminListing[]; onUpdate: (l: AdminListing[]) => void }) {
  const supabase = createClient();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);

  const filtered = filter === "all" ? listings : listings.filter((l) => l.status === filter);
  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (!error) {
      onUpdate(listings.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase.from("listings").update({ featured: !current }).eq("id", id);
    if (!error) {
      onUpdate(listings.map((l) => (l.id === id ? { ...l, featured: !current } : l)));
    }
  }

  async function deleteListing(id: string) {
    if (!window.confirm("¿Eliminar esta publicación?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (!error) {
      onUpdate(listings.filter((l) => l.id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Eliminar ${ids.length} publicación(es)?`)) return;
    const { error } = await supabase.from("listings").delete().in("id", ids);
    if (!error) {
      onUpdate(listings.filter((l) => !ids.includes(l.id)));
      setSelected(new Set());
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap flex-1">
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>Todas ({listings.length})</FilterBtn>
          {LISTING_STATUSES.map((s) => (
            <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)}>
              {LISTING_STATUS_LABELS[s].label} ({listings.filter((l) => l.status === s).length})
            </FilterBtn>
          ))}
        </div>
        <button
          onClick={async () => {
            setBackfilling(true);
            setBackfillResult(null);
            try {
              const res = await fetch("/api/admin/backfill-descriptions", { method: "POST" });
              const data = await res.json();
              setBackfillResult(`${data.updated} sinopsis encontradas, ${data.failed} sin resultado`);
            } catch { setBackfillResult("Error"); }
            setBackfilling(false);
          }}
          disabled={backfilling}
          className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {backfilling ? "Buscando sinopsis..." : "Completar sinopsis"}
        </button>
      </div>
      {backfillResult && (
        <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">{backfillResult}</p>
      )}

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
          Seleccionar todos
        </label>
        {selected.size > 0 && (
          <button onClick={deleteSelected} className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg">
            Eliminar seleccionados ({selected.size})
          </button>
        )}
      </div>

      {filtered.length === 0 && <EmptyState text="No hay publicaciones con este filtro." />}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filtered.map((listing) => (
          <div key={listing.id} className="flex items-center gap-3 p-3">
            <input type="checkbox" checked={selected.has(listing.id)} onChange={() => toggleOne(listing.id)} className="rounded border-gray-300" />

            <div className="relative flex-shrink-0 w-10 h-14 rounded overflow-hidden bg-gray-100">
              {(listing.cover_image_url ?? listing.book?.cover_url) ? (
                <Image src={(listing.cover_image_url ?? listing.book.cover_url)!} alt={listing.book?.title || "Portada"} fill className="object-cover" sizes="40px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📚</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{listing.book?.title}</p>
              <p className="text-xs text-gray-500 truncate">
                {listing.seller?.full_name ?? listing.seller?.email ?? "—"} · {listing.price != null ? `$${listing.price.toLocaleString("es-CL")}` : "Arriendo"}
              </p>
            </div>

            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LISTING_STATUS_LABELS[listing.status]?.color ?? "bg-gray-100 text-gray-500"}`}>
              {LISTING_STATUS_LABELS[listing.status]?.label ?? listing.status}
            </span>

            <button
              onClick={() => toggleFeatured(listing.id, listing.featured)}
              title={listing.featured ? "Quitar destacado" : "Destacar"}
              className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${listing.featured ? "bg-amber-100 text-amber-500" : "bg-gray-100 text-gray-300 hover:text-amber-400"}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>

            <div className="flex gap-1 flex-shrink-0">
              {listing.status === "active" && (
                <SmallBtn onClick={() => updateStatus(listing.id, "paused")} color="yellow">Pausar</SmallBtn>
              )}
              {listing.status === "paused" && (
                <SmallBtn onClick={() => updateStatus(listing.id, "active")} color="green">Activar</SmallBtn>
              )}
              <SmallBtn onClick={() => deleteListing(listing.id)} color="red">Eliminar</SmallBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
