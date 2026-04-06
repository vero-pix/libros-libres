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
      {/* View toggle */}
      <div className="flex border border-gray-200 rounded-md overflow-hidden">
        <button
          onClick={() => updateParam("view", "grid")}
          className={`p-2 transition-colors ${
            (searchParams.get("view") ?? "grid") === "grid"
              ? "bg-brand-500 text-white"
              : "bg-white text-gray-500 hover:text-ink"
          }`}
          title="Vista grilla"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </button>
        <button
          onClick={() => updateParam("view", "list")}
          className={`p-2 transition-colors ${
            searchParams.get("view") === "list"
              ? "bg-brand-500 text-white"
              : "bg-white text-gray-500 hover:text-ink"
          }`}
          title="Vista lista"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

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
