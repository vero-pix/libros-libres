"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function ListingToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
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
      <select
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
        placeholder="Filtrar por autor..."
        defaultValue={searchParams.get("author") ?? ""}
        onBlur={(e) => updateParam("author", e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="text-sm border border-gray-200 rounded-md px-3 py-2 w-40 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
      />

      {/* Condition */}
      <select
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
        onChange={handleChange("modality")}
        defaultValue={searchParams.get("modality") ?? ""}
        className={selectClass}
      >
        <option value="">Modalidad: Todos</option>
        <option value="sale">Venta</option>
        <option value="loan">Préstamo</option>
        <option value="both">Venta y préstamo</option>
      </select>
    </div>
  );
}
