"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ListingToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locating, setLocating] = useState(false);
  const isNearMe = !!searchParams.get("lat");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  }

  function handleNearMe() {
    if (isNearMe) {
      // Desactivar
      const params = new URLSearchParams(searchParams.toString());
      params.delete("lat");
      params.delete("lng");
      params.delete("sort");
      router.push(`?${params.toString()}`);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", pos.coords.latitude.toFixed(6));
        params.set("lng", pos.coords.longitude.toFixed(6));
        params.set("sort", "distance");
        router.push(`?${params.toString()}`);
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert("No pudimos obtener tu ubicación. Activa la geolocalización en tu navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleChange(key: string) {
    return (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
      updateParam(key, e.target.value);
  }

  function handlePriceBlur(key: string) {
    return (e: React.FocusEvent<HTMLInputElement>) =>
      updateParam(key, e.target.value);
  }

  const selectClass =
    "text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400";
  const inputClass =
    "text-sm border border-gray-200 rounded-md py-2 pl-6 pr-2 w-24 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400";

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 pb-3 mb-4">
      {/* Near me */}
      <button
        onClick={handleNearMe}
        disabled={locating}
        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md border transition-colors ${
          isNearMe
            ? "bg-brand-500 text-white border-brand-500"
            : "bg-white text-gray-700 border-gray-200 hover:border-brand-400"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        {locating ? "Buscando..." : isNearMe ? "Cerca de mí ✕" : "Cerca de mí"}
      </button>

      <select
        aria-label="Ordenar publicaciones"
        onChange={handleChange("sort")}
        defaultValue={searchParams.get("sort") ?? ""}
        className={selectClass}
      >
        <option value="">Ordenar por los últimos</option>
        <option value="price_asc">Precio: menor a mayor</option>
        <option value="price_desc">Precio: mayor a menor</option>
      </select>

      {/* Price range */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
          <input
            type="number"
            aria-label="Precio mínimo"
            placeholder="Min"
            defaultValue={searchParams.get("price_min") ?? ""}
            onBlur={handlePriceBlur("price_min")}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className={inputClass}
          />
        </div>
        <span className="text-gray-400 text-sm">–</span>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
          <input
            type="number"
            aria-label="Precio máximo"
            placeholder="Max"
            defaultValue={searchParams.get("price_max") ?? ""}
            onBlur={handlePriceBlur("price_max")}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className={inputClass}
          />
        </div>
      </div>

      {/* Author filter */}
      <input
        type="text"
        aria-label="Filtrar por autor"
        placeholder="Filtrar por autor..."
        defaultValue={searchParams.get("author") ?? ""}
        onBlur={(e) => updateParam("author", e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="text-sm border border-gray-200 rounded-md px-3 py-2 w-40 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
      />

      {/* Condition */}
      <select
        aria-label="Filtrar por condición"
        onChange={handleChange("condition")}
        defaultValue={searchParams.get("condition") ?? ""}
        className={selectClass}
      >
        <option value="">Condición: Todos</option>
        <option value="new">Como nuevo</option>
        <option value="good">Buen estado</option>
        <option value="fair">Regular</option>
        <option value="poor">Con detalles</option>
      </select>

      {/* Modality */}
      <select
        aria-label="Filtrar por modalidad"
        onChange={handleChange("modality")}
        defaultValue={searchParams.get("modality") ?? ""}
        className={selectClass}
      >
        <option value="">Modalidad: Todos</option>
        <option value="sale">Venta</option>
        <option value="loan">Arriendo</option>
      </select>
    </div>
  );
}
