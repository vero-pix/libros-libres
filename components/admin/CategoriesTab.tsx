"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "./SharedUI";

export interface AdminCategory {
  slug: string;
  name: string;
  parent_slug: string | null;
  sort_order: number;
}

interface Props {
  categories: AdminCategory[];
  onUpdate: (cats: AdminCategory[]) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CategoriesTab({ categories: init, onUpdate }: Props) {
  const [categories, setCategories] = useState(init);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState(0);
  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState<string | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const roots = categories.filter((c) => !c.parent_slug).sort((a, b) => a.sort_order - b.sort_order);
  const childrenOf = (parentSlug: string) =>
    categories.filter((c) => c.parent_slug === parentSlug).sort((a, b) => a.sort_order - b.sort_order);

  const updateState = (updated: AdminCategory[]) => {
    setCategories(updated);
    onUpdate(updated);
  };

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    const slug = slugify(name);
    if (categories.some((c) => c.slug === slug)) {
      setError(`Ya existe una categoría con slug "${slug}"`);
      return;
    }
    setSaving(true);
    setError(null);

    const parentSlug = newParent || null;
    const siblings = parentSlug
      ? categories.filter((c) => c.parent_slug === parentSlug)
      : categories.filter((c) => !c.parent_slug);
    const sort_order = siblings.length + 1;

    const row: AdminCategory = { slug, name, parent_slug: parentSlug, sort_order };
    const { error: err } = await supabase.from("categories").insert(row);
    if (err) {
      setError(err.message);
    } else {
      updateState([...categories, row]);
      setNewName("");
      setNewParent("");
    }
    setSaving(false);
  }

  async function handleSaveEdit(slug: string) {
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("categories")
      .update({ name, sort_order: editOrder })
      .eq("slug", slug);
    if (err) {
      setError(err.message);
    } else {
      updateState(categories.map((c) => (c.slug === slug ? { ...c, name, sort_order: editOrder } : c)));
      setEditing(null);
    }
    setSaving(false);
  }

  async function handleDelete(slug: string) {
    const children = childrenOf(slug);
    if (children.length > 0) {
      setError(`No puedes eliminar "${slug}" porque tiene ${children.length} subcategoría(s). Elimínalas primero.`);
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${slug}"?`)) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("categories").delete().eq("slug", slug);
    if (err) {
      setError(err.message);
    } else {
      updateState(categories.filter((c) => c.slug !== slug));
    }
    setSaving(false);
  }

  function startEdit(cat: AdminCategory) {
    setEditing(cat.slug);
    setEditName(cat.name);
    setEditOrder(cat.sort_order);
  }

  if (categories.length === 0 && !newName) {
    return <EmptyState text="Sin categorías. Agrega la primera abajo." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">cerrar</button>
        </div>
      )}

      {/* Tree view */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Árbol de categorías ({categories.length})</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {roots.map((root) => (
            <div key={root.slug}>
              {/* Root category */}
              <CategoryRow
                cat={root}
                depth={0}
                editing={editing === root.slug}
                editName={editName}
                editOrder={editOrder}
                saving={saving}
                onEditName={setEditName}
                onEditOrder={setEditOrder}
                onStartEdit={() => startEdit(root)}
                onSave={() => handleSaveEdit(root.slug)}
                onCancel={() => setEditing(null)}
                onDelete={() => handleDelete(root.slug)}
              />
              {/* Children */}
              {childrenOf(root.slug).map((child) => (
                <CategoryRow
                  key={child.slug}
                  cat={child}
                  depth={1}
                  editing={editing === child.slug}
                  editName={editName}
                  editOrder={editOrder}
                  saving={saving}
                  onEditName={setEditName}
                  onEditOrder={setEditOrder}
                  onStartEdit={() => startEdit(child)}
                  onSave={() => handleSaveEdit(child.slug)}
                  onCancel={() => setEditing(null)}
                  onDelete={() => handleDelete(child.slug)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Agregar categoría</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Ciencia Ficción"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
            {newName.trim() && (
              <p className="text-xs text-gray-400 mt-1">slug: {slugify(newName)}</p>
            )}
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs text-gray-500 mb-1">Categoría padre (opcional)</label>
            <select
              value={newParent}
              onChange={(e) => setNewParent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
            >
              <option value="">— Raíz (categoría principal) —</option>
              {roots.map((r) => (
                <option key={r.slug} value={r.slug}>{r.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-ink/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando..." : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Row component ── */

interface RowProps {
  cat: AdminCategory;
  depth: number;
  editing: boolean;
  editName: string;
  editOrder: number;
  saving: boolean;
  onEditName: (v: string) => void;
  onEditOrder: (v: number) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

function CategoryRow({ cat, depth, editing, editName, editOrder, saving, onEditName, onEditOrder, onStartEdit, onSave, onCancel, onDelete }: RowProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors ${depth === 1 ? "pl-10" : ""}`}>
      {depth === 1 && <span className="text-gray-300 text-xs">└</span>}
      {editing ? (
        <>
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditName(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <input
            type="number"
            value={editOrder}
            onChange={(e) => onEditOrder(Number(e.target.value))}
            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ink/20"
            title="Orden"
          />
          <button onClick={onSave} disabled={saving} className="text-xs text-green-600 hover:underline disabled:opacity-50">
            Guardar
          </button>
          <button onClick={onCancel} className="text-xs text-gray-400 hover:underline">
            Cancelar
          </button>
        </>
      ) : (
        <>
          <span className={`flex-1 text-sm ${depth === 0 ? "font-semibold text-gray-900" : "text-gray-700"}`}>
            {cat.name}
          </span>
          <span className="text-xs text-gray-400 font-mono">{cat.slug}</span>
          <span className="text-xs text-gray-300 w-6 text-center" title="Orden">{cat.sort_order}</span>
          <button onClick={onStartEdit} className="text-xs text-blue-600 hover:underline">
            Editar
          </button>
          <button onClick={onDelete} className="text-xs text-red-500 hover:underline">
            Eliminar
          </button>
        </>
      )}
    </div>
  );
}
