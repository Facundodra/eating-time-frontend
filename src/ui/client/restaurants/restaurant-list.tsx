"use client";

import {
  CheckCircleIcon,
  MoonIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import useDebounce from "@/hooks/use-debounce";

import type { LocalList } from "@/lib/client/types";
import { getLocales } from "@/services/client/client-service";

type RestaurantListProps = {
  compact?: boolean;
};

type SortKey = "rating-desc" | "rating-asc" | "name-asc" | "name-desc";

export default function RestaurantList({ compact = false }: RestaurantListProps) {
  const [restaurants, setRestaurants] = useState<LocalList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [sort, setSort] = useState<SortKey>("rating-desc");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyTopRated, setOnlyTopRated] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage("");

    getLocales()
      .then((locals) => {
        // client-side filter by name when backend doesn't support query
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.trim().toLowerCase();
          setRestaurants(locals.filter((l) => l.nombre.toLowerCase().includes(q)));
        } else {
          setRestaurants(locals);
        }
      })
      .catch((error) =>
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudieron cargar los locales.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [debouncedSearch]);

  const visibleRestaurants = useMemo(() => {
    const filtered = restaurants.filter((restaurant) => {
      if (onlyOpen && !restaurant.estado_servicio) return false;
      if (onlyTopRated && restaurant.calificacion < 4) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === "rating-desc") return b.calificacion - a.calificacion;
      if (sort === "rating-asc") return a.calificacion - b.calificacion;
      if (sort === "name-desc") return b.nombre.localeCompare(a.nombre);
      return a.nombre.localeCompare(b.nombre);
    });
  }, [onlyOpen, onlyTopRated, restaurants, sort]);

  if (isLoading) {
    return <RestaurantSkeleton compact={compact} />;
  }

  if (errorMessage) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        {errorMessage}
      </p>
    );
  }


  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyOpen((value) => !value)}
            className={filterButtonClassName(onlyOpen)}
          >
            <CheckCircleIcon className="h-4 w-4" />
            Abiertos
          </button>
          <button
            type="button"
            onClick={() => setOnlyTopRated((value) => !value)}
            className={filterButtonClassName(onlyTopRated)}
          >
            <StarIcon className="h-4 w-4" />
            4+ estrellas
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          Ordenar
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="rating-desc">Mejor calificacion</option>
            <option value="rating-asc">Menor calificacion</option>
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
          </select>
        </label>
      </div>

      {visibleRestaurants.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No encontramos locales con esos filtros.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(compact ? visibleRestaurants.slice(0, 6) : visibleRestaurants).map(
            (restaurant) => (
              <article
                key={restaurant.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500/50"
              >
                <div className="relative flex h-36 items-center justify-center bg-orange-50 dark:bg-orange-500/10">
                  <img
                    alt={restaurant.nombre}
                    src={restaurant.url_foto}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={clsx(
                      "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
                      restaurant.estado_servicio
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                    )}
                  >
                    {restaurant.estado_servicio ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <MoonIcon className="h-4 w-4" />
                    )}
                    {restaurant.estado_servicio ? "Abierto" : "Cerrado"}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">
                      {restaurant.nombre}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 dark:text-orange-300">
                      <StarIcon className="h-4 w-4" />
                      {restaurant.calificacion.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {restaurant.descripcion}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {restaurant.direccion}
                  </p>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function filterButtonClassName(active: boolean) {
  return clsx(
    "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition",
    active
      ? "border-orange-600 bg-orange-600 text-white"
      : "border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-orange-500/50 dark:hover:text-orange-300",
  );
}

function RestaurantSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: compact ? 3 : 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-36 animate-pulse bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="mt-2 w-full sm:mt-0 sm:w-64">
            <input
              placeholder="Buscar restaurantes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
