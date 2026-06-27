"use client";

import {
  ArrowLeftIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

import type {
  ClientDishCategorySummary,
  RestaurantList,
} from "@/lib/client/types";
import {
  getAllRestaurants,
  getAllDishes,
  getClientDishCategorySummaries,
} from "@/services/client/client-service";
import { applyRestaurantAvailability } from "@/services/client/restaurant-availability-service";
import CategoryCarousel from "@/ui/client/categories/category-carousel";
import { RestaurantCompactCard } from "@/ui/client/restaurants/restaurant-compact-card";

const RESTAURANT_FETCH_SIZE = 100;

type RestaurantSort = "calificacion-desc" | "calificacion-asc" | "nombre-asc" | "nombre-desc";
type RestaurantStatusFilter = "all" | "open" | "closed";

function parseOptionalNumber(value: string) {
  const parsed = Number(value);
  return value !== "" && !isNaN(parsed) ? parsed : undefined;
}

function getSortParams(sort: RestaurantSort) {
  const [orderBy, direction] = sort.split("-") as [
    "calificacion" | "nombre",
    "asc" | "desc",
  ];

  return { orderBy, direction };
}

function RestaurantCardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[1.86/1] rounded-xl bg-gray-100 dark:bg-slate-800" />
          <div className="mt-2.5 flex items-start gap-2">
            <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-slate-700" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        No hay locales para estos filtros.
      </p>
    </div>
  );
}

export default function ClientRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantList[]>([]);
  const [categories, setCategories] = useState<ClientDishCategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<RestaurantSort>("calificacion-desc");
  const [status, setStatus] = useState<RestaurantStatusFilter>("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const hasActiveFilters =
    Boolean(query) ||
    status !== "all" ||
    priceMin !== "" ||
    priceMax !== "" ||
    selectedCategoryId != null;

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setPriceMin("");
    setPriceMax("");
    setSelectedCategoryId(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadRestaurants() {
      setLoading(true);
      setError(null);

      try {
        const { orderBy, direction } = getSortParams(sort);
        const data = await getAllRestaurants(
          {
            nombre: query.trim() || undefined,
            ordenarPor: orderBy,
            direccion: direction,
          },
          RESTAURANT_FETCH_SIZE,
        );
        const restaurantsWithAvailability = await applyRestaurantAvailability(data);
        if (cancelled) return;

        const dishPriceMin = parseOptionalNumber(priceMin);
        const dishPriceMax = parseOptionalNumber(priceMax);
        const shouldFilterByDish =
          selectedCategoryId != null ||
          dishPriceMin != null ||
          dishPriceMax != null;
        const categoryRestaurantIds =
          !shouldFilterByDish
            ? null
            : new Set(
                (
                  await getAllDishes(
                    {
                      categoriaId: selectedCategoryId ?? undefined,
                      precioMin: dishPriceMin,
                      precioMax: dishPriceMax,
                    },
                    RESTAURANT_FETCH_SIZE,
                  )
                ).map((dish) => dish.localId),
              );
        const filteredData =
          categoryRestaurantIds == null
            ? restaurantsWithAvailability
            : restaurantsWithAvailability.filter((restaurant) =>
                categoryRestaurantIds.has(restaurant.id),
              );
        const filteredByStatus = filteredData.filter((restaurant) => {
          if (status === "open") return restaurant.state;
          if (status === "closed") return !restaurant.state;
          return true;
        });

        if (!cancelled) setRestaurants(filteredByStatus);
      } catch (err) {
        if (!cancelled) {
          setRestaurants([]);
          setError(
            err instanceof Error ? err.message : "No se pudieron cargar los locales.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRestaurants();

    return () => {
      cancelled = true;
    };
  }, [priceMax, priceMin, query, selectedCategoryId, sort, status]);

  useEffect(() => {
    let cancelled = false;

    getClientDishCategorySummaries()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-[1440px] space-y-5 px-0 pb-4 pt-0 dark:bg-slate-950 sm:px-4 sm:pb-5 sm:pt-0">
      <Link
        href="/client"
        className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-500 dark:hover:text-orange-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver
      </Link>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 xl:hidden">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              <FunnelIcon className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-orange-600 dark:bg-orange-400" />
              )}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Limpiar filtros"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              >
                <FunnelIcon className="h-5 w-5" />
                <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
              </button>
            )}

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
              <label htmlFor="client-restaurants-sort-mobile" className="sr-only">
                Orden
              </label>
              <select
                id="client-restaurants-sort-mobile"
                value={sort}
                onChange={(event) => setSort(event.target.value as RestaurantSort)}
                className="h-11 w-[125px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="calificacion-desc">Mejor calificación</option>
                <option value="calificacion-asc">Menor calificación</option>
                <option value="nombre-asc">A-Z</option>
                <option value="nombre-desc">Z-A</option>
              </select>
            </div>
          </div>

          {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 pb-4 pt-20 backdrop-blur-sm sm:items-center sm:pt-16">
              <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-xl sm:max-w-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      Filtros
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Ajusta el listado de locales visible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    aria-label="Cerrar filtros"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:text-orange-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-orange-400"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-4 px-5 py-5">
                  <label htmlFor="client-restaurant-search-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Nombre
                    </span>
                    <input
                      id="client-restaurant-search-mobile"
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar local"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                    />
                  </label>

                  <label htmlFor="client-restaurant-status-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Disponibilidad
                    </span>
                    <select
                      id="client-restaurant-status-mobile"
                      value={status}
                      onChange={(event) =>
                        setStatus(event.target.value as RestaurantStatusFilter)
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                    >
                      <option value="all">Todos</option>
                      <option value="open">Abiertos</option>
                      <option value="closed">Cerrados</option>
                    </select>
                  </label>

                  <div>
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Precio
                    </span>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
                      <input
                        aria-label="Precio mínimo"
                        type="number"
                        min={0}
                        value={priceMin}
                        onChange={(event) => setPriceMin(event.target.value)}
                        placeholder="min"
                        className="h-11 min-w-0 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        aria-label="Precio máximo"
                        type="number"
                        min={0}
                        value={priceMax}
                        onChange={(event) => setPriceMax(event.target.value)}
                        placeholder="max"
                        className="h-11 min-w-0 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-gray-200 px-5 py-4 dark:border-slate-800">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
                    >
                      Limpiar filtros
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="h-11 flex-1 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
                  >
                    Ver resultados
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden gap-5 xl:grid xl:grid-cols-[minmax(16rem,1fr)_auto_auto_auto] xl:items-center">
          <label className="relative min-w-0">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar local"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>

          <div className="flex min-w-0 items-center gap-2">
            <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <select
              aria-label="Ordenar locales"
              value={sort}
              onChange={(event) => setSort(event.target.value as RestaurantSort)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="calificacion-desc">Mejor calificación</option>
              <option value="calificacion-asc">Menor calificación</option>
              <option value="nombre-asc">A-Z</option>
              <option value="nombre-desc">Z-A</option>
            </select>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <select
              aria-label="Filtrar locales por estado"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as RestaurantStatusFilter)
              }
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="all">Todos</option>
              <option value="open">Abiertos</option>
              <option value="closed">Cerrados</option>
            </select>
          </div>

          <div className="grid grid-cols-[auto_5rem_auto_5rem] items-center gap-1.5">
            <CurrencyDollarIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <input
              aria-label="Precio mínimo"
              type="number"
              min={0}
              value={priceMin}
              onChange={(event) => setPriceMin(event.target.value)}
              placeholder="min"
              className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
            <span className="text-slate-400">-</span>
            <input
              aria-label="Precio máximo"
              type="number"
              min={0}
              value={priceMax}
              onChange={(event) => setPriceMax(event.target.value)}
              placeholder="max"
              className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </div>
        </div>
      </section>
      <CategoryCarousel
        categories={categories}
        loading={loadingCategories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(category) =>
          setSelectedCategoryId((current) =>
            current === category.id ? null : category.id,
          )
        }
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : loading ? (
        <RestaurantCardSkeleton />
      ) : restaurants.length > 0 ? (
        <section className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {restaurants.map((restaurant) => (
            <RestaurantCompactCard
              key={restaurant.id}
              restaurant={restaurant}
            />
          ))}
        </section>
      ) : (
        <EmptyState />
      )}
    </main>
  );
}
