"use client";

import { useState, useCallback } from "react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pendiente de pago", color: "bg-yellow-100 text-yellow-800" },
  paid:       { label: "Pagado",            color: "bg-blue-100 text-blue-800" },
  active:     { label: "En préstamo",       color: "bg-green-100 text-green-800" },
  returning:  { label: "En devolución",     color: "bg-purple-100 text-purple-800" },
  completed:  { label: "Completado",        color: "bg-gray-100 text-gray-800" },
  overdue:    { label: "Vencido",           color: "bg-red-100 text-red-800" },
  defaulted:  { label: "No devuelto",       color: "bg-red-200 text-red-900" },
};

const DELIVERY_LABELS: Record<string, string> = {
  in_person: "Encuentro en persona",
  pickup_point: "Punto de retiro",
  courier: "Envío courier",
};

interface RentalItem {
  id: string;
  period_days: number;
  rental_price: number;
  deposit: number;
  total: number;
  status: string;
  delivery_method: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  listing: {
    book: { title: string; author: string; cover_url: string | null };
  };
  owner?: { id: string; full_name: string | null; phone: string | null };
  renter?: { id: string; full_name: string | null; phone: string | null };
}

interface Props {
  asRenter: RentalItem[];
  asOwner: RentalItem[];
  userId: string;
}

export default function RentalsList({ asRenter, asOwner, userId }: Props) {
  const [tab, setTab] = useState<"renter" | "owner">("renter");
  const [renterList, setRenterList] = useState(asRenter);
  const [ownerList, setOwnerList] = useState(asOwner);
  const rentals = tab === "renter" ? renterList : ownerList;
  const [updating, setUpdating] = useState<string | null>(null);

  const updateStatus = useCallback(async (rentalId: string, newStatus: string) => {
    if (!window.confirm(`¿Cambiar estado a "${newStatus}"?`)) return;
    setUpdating(rentalId);
    try {
      const res = await fetch(`/api/rentals/${rentalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updateList = (list: RentalItem[]) =>
          list.map((r) => r.id === rentalId ? { ...r, status: newStatus } : r);
        setRenterList(updateList);
        setOwnerList(updateList);
      }
    } catch { /* ignore */ }
    setUpdating(null);
  }, []);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab("renter")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tab === "renter" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Libros que arriendo ({asRenter.length})
        </button>
        <button
          onClick={() => setTab("owner")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            tab === "owner" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Mis libros prestados ({asOwner.length})
        </button>
      </div>

      {rentals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">
            {tab === "renter"
              ? "No tienes arriendos activos."
              : "Nadie ha arrendado tus libros aún."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rentals.map((r) => {
            const { book } = r.listing;
            const statusInfo = STATUS_LABELS[r.status] ?? { label: r.status, color: "bg-gray-100 text-gray-600" };
            const otherPerson = tab === "renter" ? r.owner : r.renter;

            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex gap-3">
                  {/* Cover */}
                  <div className="w-12 h-16 bg-gray-50 rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {book.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.cover_url} alt={book.title} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-lg">📚</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm truncate">{book.title}</p>
                        <p className="text-xs text-gray-500">{book.author}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span>{r.period_days} días</span>
                      <span>${Number(r.rental_price).toLocaleString("es-CL")}</span>
                      {r.deposit > 0 && <span>Garantía: ${Number(r.deposit).toLocaleString("es-CL")}</span>}
                      <span>{DELIVERY_LABELS[r.delivery_method] ?? r.delivery_method}</span>
                    </div>

                    {r.start_date && r.end_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(r.start_date).toLocaleDateString("es-CL")} — {new Date(r.end_date).toLocaleDateString("es-CL")}
                      </p>
                    )}

                    {/* Countdown for active rentals */}
                    {r.status === "active" && r.end_date && (() => {
                      const days = Math.ceil((new Date(r.end_date).getTime() - Date.now()) / 86400000);
                      const color = days > 3 ? "text-green-600" : days > 0 ? "text-yellow-600" : "text-red-600";
                      return (
                        <p className={`text-xs font-medium mt-1 ${color}`}>
                          {days > 0 ? `${days} día${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}` : "Plazo vencido"}
                        </p>
                      );
                    })()}

                    {r.status === "completed" && r.deposit > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-1">Garantía liberada</p>
                    )}

                    {otherPerson && (
                      <p className="text-xs text-gray-400 mt-1">
                        {tab === "renter" ? "Dueño" : "Arrendatario"}: {otherPerson.full_name ?? "Sin nombre"}
                        {otherPerson.phone && (
                          <a
                            href={`https://wa.me/${otherPerson.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-green-600 hover:underline"
                          >
                            WhatsApp
                          </a>
                        )}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tab === "owner" && r.status === "paid" && (
                        <button onClick={() => updateStatus(r.id, "active")} disabled={updating === r.id}
                          className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                          {updating === r.id ? "..." : "Confirmar entrega"}
                        </button>
                      )}
                      {tab === "owner" && r.status === "active" && r.end_date && new Date(r.end_date) < new Date() && (
                        <button onClick={() => updateStatus(r.id, "overdue")} disabled={updating === r.id}
                          className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
                          {updating === r.id ? "..." : "Marcar como vencido"}
                        </button>
                      )}
                      {tab === "owner" && r.status === "returning" && (
                        <button onClick={() => updateStatus(r.id, "completed")} disabled={updating === r.id}
                          className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                          {updating === r.id ? "..." : "Confirmar devolución"}
                        </button>
                      )}
                      {tab === "renter" && r.status === "active" && (
                        <button onClick={() => updateStatus(r.id, "returning")} disabled={updating === r.id}
                          className="text-xs px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50">
                          {updating === r.id ? "..." : "Iniciar devolución"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
