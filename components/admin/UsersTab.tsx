"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AdminUser } from "./types";

export default function UsersTab({ users, onUpdate }: { users: AdminUser[]; onUpdate: (u: AdminUser[]) => void }) {
  const supabase = createClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = users.length > 0 && users.every((u) => selected.has(u.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function updateUser(id: string, updates: Record<string, unknown>) {
    const { error } = await supabase.from("users").update(updates).eq("id", id);
    if (!error) {
      onUpdate(users.map((u) => (u.id === id ? { ...u, ...updates } as AdminUser : u)));
      setEditingId(null);
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (body.blockers) {
        alert(`No se puede eliminar: tiene ${body.blockers.listings} listings, ${body.blockers.ordersAsBuyer} órdenes como comprador, ${body.blockers.ordersAsSeller} como vendedor. Elimina esos primero.`);
      } else {
        alert(`Error: ${body.error || res.statusText}`);
      }
      return;
    }
    onUpdate(users.filter((u) => u.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Eliminar ${ids.length} usuario(s)?`)) return;
    const results = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        return { id, ok: res.ok };
      })
    );
    const successIds = results.filter((r) => r.ok).map((r) => r.id);
    const failures = results.length - successIds.length;
    if (failures > 0) alert(`${failures} usuario(s) no se pudieron eliminar (tienen data asociada).`);
    onUpdate(users.filter((u) => !successIds.includes(u.id)));
    setSelected(new Set());
  }

  return (
    <div className="space-y-3">
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

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {users.map((user) => (
          <div key={user.id}>
            <div className="flex items-center gap-3 p-3">
              <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleOne(user.id)} className="rounded border-gray-300" />

              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(user.full_name ?? user.email ?? "?")[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.full_name ?? "Sin nombre"}</p>
                <p className="text-xs text-gray-500 truncate">{user.email} · {user.phone ?? "sin teléfono"}</p>
              </div>

              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                {user.role === "admin" ? "Admin" : "Usuario"}
              </span>

              <span className="text-[10px] text-gray-400 flex-shrink-0">
                {new Date(user.created_at).toLocaleDateString("es-CL")}
              </span>

              <button
                onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200"
              >
                Editar
              </button>
              <button
                onClick={() => deleteUser(user.id)}
                className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded border border-red-200"
              >
                Eliminar
              </button>
            </div>

            {editingId === user.id && (
              <UserEditForm user={user} onSave={updateUser} onCancel={() => setEditingId(null)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UserEditForm({ user, onSave, onCancel }: { user: AdminUser; onSave: (id: string, u: Record<string, unknown>) => void; onCancel: () => void }) {
  const [name, setName] = useState(user.full_name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [role, setRole] = useState(user.role ?? "user");

  return (
    <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ciudad</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200">Cancelar</button>
        <button
          onClick={() => onSave(user.id, { full_name: name || null, phone: phone || null, city: city || null, role })}
          className="text-xs text-white bg-ink hover:bg-gray-800 px-4 py-1.5 rounded-lg"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
