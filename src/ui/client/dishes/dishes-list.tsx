"use client";

import { TagIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { ClientDish } from "@/lib/client/types";
import { getDishes, type DishFilter } from "@/services/client/client-service";

const PAGE_SIZE = 20;

type OrdenValue = "" | "precio-asc" | "precio-desc";
type Filters = Omit<DishFilter, "pagina" | "tamano">;

function DishSkeleton() {
  return (
    <div className="flex flex-wrap">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="w-1/2 px-2 py-2 md:w-1/3 lg:w-1/4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900">
            <div className="h-[150px] bg-gray-100 dark:bg-slate-800" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-3 w-1/4 rounded bg-gray-100 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DishesList({ idLocal }: { idLocal?: number }) {
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

    getDishes({ ...filters, idLocal, pagina: page, tamano: PAGE_SIZE })
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
  }, [filters, page, idLocal]);

  function updateFilters(patch: Partial<Filters>) {
    setLoading(true);
    setError(null);
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  }

  function handleOrden(val: OrdenValue) {
    if (val === "") {
      updateFilters({ orden: undefined, sentido: undefined });
      return;
    }

    const [orden, sentido] = val.split("-") as ["precio", "asc" | "desc"];
    updateFilters({ orden, sentido });
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
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border-b border-gray-100 bg-white p-3 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600 dark:text-slate-300">Ordenar:</span>
          <select
            value={ordenValue}
            onChange={(e) => handleOrden(e.target.value as OrdenValue)}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
          >
            <option value="">Por defecto</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
          </select>
        </div>

        <div className="hidden h-4 w-px bg-gray-200 dark:bg-slate-800 sm:block" />

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600 dark:text-slate-300">Filtrar:</span>
          <button
            type="button"
            onClick={toggleDescuento}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              filters.conDescuento
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            }`}
          >
            <TagIcon className="h-3.5 w-3.5" />
            Con descuento
          </button>
        </div>

        <div className="hidden h-4 w-px bg-gray-200 dark:bg-slate-800 sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="font-medium text-gray-600 dark:text-slate-300">Precio:</span>
          <input
            type="number"
            min={0}
            placeholder="min"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            onBlur={applyPrecio}
            onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
            className="w-20 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
          />
          <span className="text-gray-400 dark:text-slate-500">-</span>
          <input
            type="number"
            min={0}
            placeholder="max"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            onBlur={applyPrecio}
            onKeyDown={(e) => e.key === "Enter" && applyPrecio()}
            className="w-20 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
          />
        </div>
      </div>

      {loading ? (
        <DishSkeleton />
      ) : error ? (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : dishes.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          No se encontraron resultados para los filtros aplicados.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap">
            {dishes.map((dish) => (
              <div key={dish.id} className="w-1/2 px-2 py-2 md:w-1/3 lg:w-1/4">
                <Link
                  href={`/client/platos/${dish.id}`}
                  className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
                >
                  <div className="flex h-[150px] items-center justify-center bg-orange-50 dark:bg-orange-500/10">
                    {dish.imageUrl ? (
                      <img
                        alt={dish.name}
                        src={dish.imageUrl}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-black text-orange-600 dark:text-orange-300">
                        {dish.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="inline-block font-bold text-gray-800 dark:text-white">
                      {dish.name}
                    </span>
                    <div className="mt-2">
                      <span className="text-md font-bold text-orange-700 dark:text-orange-300">
                        ${dish.price}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mb-4 mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setLoadingMore(true);
                  setError(null);
                  setPage((p) => p + 1);
                }}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {loadingMore ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-600" />
                    Cargando...
                  </>
                ) : (
                  "Cargar mas"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
