"use client";

import { useEffect, useState } from "react";
import { TagIcon } from "@heroicons/react/24/outline";

import { getDishes, type DishFilter } from "@/services/client/client-service";
import type { ClientDish } from "@/lib/client/types";

const PAGE_SIZE = 20;

type OrdenValue = "" | "precio-asc" | "precio-desc";
type Filters = Omit<DishFilter, "pagina" | "tamano">;

function DishSkeleton() {
  return (
    <div className="flex flex-wrap">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="px-2 py-2 w-1/2 md:w-1/3 lg:w-1/4">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
            <div className="bg-gray-100 h-[150px]" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DishesList() {
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  useEffect(() => {
    const isNewSearch = page === 1;
    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    getDishes({ ...filters, pagina: page, tamano: PAGE_SIZE })
      .then((data) => {
        setDishes((prev) => (isNewSearch ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      )
      .finally(() => {
        if (isNewSearch) setLoading(false);
        else setLoadingMore(false);
      });
  }, [filters, page]);

  function updateFilters(patch: Partial<Filters>) {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  }

  function handleOrden(val: OrdenValue) {
    if (val === "") {
      updateFilters({ orden: undefined, sentido: undefined });
    } else {
      const [orden, sentido] = val.split("-") as ["precio", "asc" | "desc"];
      updateFilters({ orden, sentido });
    }
  }

  function toggleDescuento() {
    updateFilters({ conDescuento: filters.conDescuento ? undefined : true });
  }

  function applyPrecio() {
    const min = Number(precioMin);
    const max = Number(precioMax);
    updateFilters({
      precioMin: precioMin !== "" && !isNaN(min) ? min : undefined,
      precioMax: precioMax !== "" && !isNaN(max) ? max : undefined,
    });
  }

  const ordenValue: OrdenValue = filters.orden
    ? `${filters.orden}-${filters.sentido ?? "asc"}`
    : "";

  return (
    <div className="max-w-[1440px] mx-auto px-2">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center bg-white p-3 rounded-xl gap-x-6 gap-y-2 mb-6 border-b border-gray-100 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Ordenar:</span>
          <select
            value={ordenValue}
            onChange={(e) => handleOrden(e.target.value as OrdenValue)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          >
            <option value="">Por defecto</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
          </select>
        </div>

        <div className="h-4 w-px bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Filtrar:</span>
          <button
            type="button"
            onClick={toggleDescuento}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              filters.conDescuento
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600"
            }`}
          >
            <TagIcon className="h-3.5 w-3.5" />
            Con descuento
          </button>
        </div>

        <div className="h-4 w-px bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="font-medium text-gray-600">Precio:</span>
          <input
            type="number"
            min={0}
            placeholder="mín"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            onBlur={applyPrecio}
            onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
            className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            min={0}
            placeholder="máx"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            onBlur={applyPrecio}
            onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
            className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <DishSkeleton />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : dishes.length === 0 ? (
        <p className="text-sm text-slate-400">
          No se encontraron resultados para los filtros aplicados.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap">
            {dishes.map((dish) => (
              <div key={dish.id} className="px-2 py-2 w-1/2 md:w-1/3 lg:w-1/4">
                <div className="rounded-xl border border-gray-200 hover:border-orange-700 transition-all duration-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-center bg-orange-50 h-[150px]">
                    {dish.imageUrl ? (
                      <img
                        alt={dish.name}
                        src={dish.imageUrl}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-4xl font-black text-orange-600">
                        {dish.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="inline-block font-bold text-gray-800">
                      {dish.name}
                    </span>
                    <div className="mt-2">
                      <span className="text-md text-orange-700 font-bold">
                        ${dish.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cargar más */}
          {hasMore && (
            <div className="flex justify-center mt-8 mb-4">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-600" />
                    Cargando...
                  </>
                ) : (
                  "Cargar más"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
