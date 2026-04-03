"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { ListingWithBook, ListingStatus } from "@/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Activo", color: "bg-green-100 text-green-700" },
  paused: { label: "Pausado", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Vendido", color: "bg-gray-100 text-gray-500" },
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Como nuevo",
  good: "Buen estado",
  fair: "Estado regular",
  poor: "Con detalles",
};

const MODALITY_LABELS: Record<string, string> = {
  sale: "Venta",
  loan: "Préstamo",
  both: "Venta y préstamo",
};

interface Props {
  listings: ListingWithBook[];
}

export default function MyListings({ listings: initial }: Props) {
  const [listings, setListings] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ListingStatus>("all");
  const supabase = createClient();

  const filtered = filter === "all" ? listings : listings.filter((l) => l.status === filter);

  const counts = {
    all: listings.length,
    active: listings.filter((l) => l.status === "active").length,
    paused: listings.filter((l) => l.status === "paused").length,
    completed: listings.filter((l) => l.status === "completed").length,
  };

  async function updateStatus(id: string, status: ListingStatus) {
    setLoading(id);
    const { error } = await supabase
      .from("listings")
      .update({ status })
      .eq("id", id);

    if (!error) {
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
    }
    setLoading(null);
  }

  async function deleteListing(id: string) {
    if (!confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    setLoading(id);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (!error) {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
    setLoading(null);
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No tienes publicaciones aún.</p>
        <Link
          href="/publish"
          className="inline-block mt-4 bg-brand-500 hover:bg-brand-600 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Publicar mi primer libro
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
        {(["all", "active", "paused", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 text-xs font-medium py-2 px-3 rounded-lg transition-colors ${
              filter === f
                ? "bg-brand-500 text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "Todos" : STATUS_LABELS[f].label} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Listings */}
      {filtered.map((listing) => (
        <ListingRow
          key={listing.id}
          listing={listing}
          isEditing={editingId === listing.id}
          isLoading={loading === listing.id}
          onToggleEdit={() => setEditingId(editingId === listing.id ? null : listing.id)}
          onUpdateStatus={updateStatus}
          onDelete={deleteListing}
          onUpdated={(updated) => {
            setListings((prev) =>
              prev.map((l) => (l.id === updated.id ? updated : l))
            );
            setEditingId(null);
          }}
        />
      ))}

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          No hay publicaciones con este filtro.
        </p>
      )}
    </div>
  );
}

/* ── ListingRow ── */

interface RowProps {
  listing: ListingWithBook;
  isEditing: boolean;
  isLoading: boolean;
  onToggleEdit: () => void;
  onUpdateStatus: (id: string, status: ListingStatus) => void;
  onDelete: (id: string) => void;
  onUpdated: (listing: ListingWithBook) => void;
}

function ListingRow({
  listing,
  isEditing,
  isLoading,
  onToggleEdit,
  onUpdateStatus,
  onDelete,
  onUpdated,
}: RowProps) {
  const { book } = listing;
  const coverUrl = listing.cover_image_url ?? book.cover_url;
  const statusInfo = STATUS_LABELS[listing.status] ?? STATUS_LABELS.active;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Cover */}
        <Link href={`/listings/${listing.id}`} className="flex-shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              className="w-16 h-22 sm:w-20 sm:h-28 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-22 sm:w-20 sm:h-28 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
              </svg>
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{book.title}</h3>
              <p className="text-xs text-gray-500 truncate">{book.author}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {listing.price != null && (
              <span className="font-bold text-gray-900">
                ${listing.price.toLocaleString("es-CL")}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {CONDITION_LABELS[listing.condition]} · {MODALITY_LABELS[listing.modality]}
            </span>
          </div>

          {book.genre && (
            <span className="inline-block text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full mt-1.5">
              {book.genre}
            </span>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {listing.status === "active" && (
              <button
                onClick={() => onUpdateStatus(listing.id, "paused")}
                disabled={isLoading}
                className="text-xs text-yellow-600 hover:bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-200 transition-colors"
              >
                Pausar
              </button>
            )}
            {listing.status === "paused" && (
              <button
                onClick={() => onUpdateStatus(listing.id, "active")}
                disabled={isLoading}
                className="text-xs text-green-600 hover:bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 transition-colors"
              >
                Reactivar
              </button>
            )}
            {listing.status !== "completed" && (
              <button
                onClick={() => onUpdateStatus(listing.id, "completed")}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
              >
                Marcar vendido
              </button>
            )}
            {listing.status === "completed" && (
              <button
                onClick={() => onUpdateStatus(listing.id, "active")}
                disabled={isLoading}
                className="text-xs text-green-600 hover:bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 transition-colors"
              >
                Republicar
              </button>
            )}
            <button
              onClick={onToggleEdit}
              className="text-xs text-gray-500 hover:bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors"
            >
              {isEditing ? "Cancelar" : "Editar"}
            </button>
            <button
              onClick={() => onDelete(listing.id)}
              disabled={isLoading}
              className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Edit form */}
      {isEditing && (
        <EditForm listing={listing} onUpdated={onUpdated} onCancel={onToggleEdit} />
      )}
    </div>
  );
}

/* ── EditForm inline ── */

function EditForm({
  listing,
  onUpdated,
  onCancel,
}: {
  listing: ListingWithBook;
  onUpdated: (l: ListingWithBook) => void;
  onCancel: () => void;
}) {
  const supabase = createClient();
  const [price, setPrice] = useState(listing.price?.toString() ?? "");
  const [condition, setCondition] = useState(listing.condition);
  const [modality, setModality] = useState(listing.modality);
  const [notes, setNotes] = useState(listing.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const updates: Record<string, unknown> = {
      condition,
      modality,
      notes: notes.trim() || null,
      price: modality !== "loan" ? parseFloat(price) || null : null,
    };

    const { error: err } = await supabase
      .from("listings")
      .update(updates)
      .eq("id", listing.id);

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    onUpdated({
      ...listing,
      ...updates,
      price: updates.price as number | null,
      condition: updates.condition as typeof listing.condition,
      modality: updates.modality as typeof listing.modality,
      notes: updates.notes as string | null,
    });
    setSaving(false);
  }

  return (
    <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Modality */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Modalidad</label>
          <select
            value={modality}
            onChange={(e) => setModality(e.target.value as typeof modality)}
            className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="sale">Venta</option>
            <option value="loan">Préstamo</option>
            <option value="both">Venta y préstamo</option>
          </select>
        </div>

        {/* Price */}
        {modality !== "loan" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Precio</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-2.5 flex items-center text-gray-400 text-sm pointer-events-none">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="100"
                className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              />
            </div>
          </div>
        )}

        {/* Condition */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as typeof condition)}
            className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="new">Como nuevo</option>
            <option value="good">Buen estado</option>
            <option value="fair">Estado regular</option>
            <option value="poor">Con detalles</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs text-white bg-brand-500 hover:bg-brand-600 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
