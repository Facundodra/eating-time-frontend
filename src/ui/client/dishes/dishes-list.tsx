"use client";

import { TagIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import useDebounce from "@/hooks/use-debounce";

import type { ClientDish, DishFilter } from "@/lib/client/types";
import { getDishes } from "@/services/client/client-service";

type DishesListProps = {
  compact?: boolean;
};

type OrdenValue = "" | "precio-asc" | "precio-desc";

const PAGE_SIZE = 12;

export default function DishesList({ compact = false }: DishesListProps) {
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [filters, setFilters] = useState<Omit<DishFilter, "pagina" | "tamano">>({});
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const isFirstPage = page === 1;

    getDishes({ ...filters, pagina: page, tamano: compact ? 6 : PAGE_SIZE })
      .then((data) => {
        setDishes((current) => (isFirstPage ? data : [...current, ...data]));
        setHasMore(!compact && data.length === PAGE_SIZE);
      })
      .catch((error) =>
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudieron cargar los platos.",
        ),
      )
      .finally(() => {
        if (isFirstPage) setIsLoading(false);
        else setIsLoadingMore(false);
      });
  }, [compact, filters, page]);

  useEffect(() => {
    // when debounced search changes, update filters.q
    updateFilters({ q: debouncedSearch || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function updateFilters(patch: Partial<DishFilter>) {
    setIsLoading(true);
    setErrorMessage("");
    setPage(1);
    setFilters((current) => ({ ...current, ...patch }));
  }

  function handleOrden(value: OrdenValue) {
    if (!value) {
      updateFilters({ orden: undefined, sentido: undefined });
      return;
    }

    const [, sentido] = value.split("-") as ["precio", "asc" | "desc"];
    updateFilters({ orden: "precio", sentido });
  }

  if (isLoading) {
    return <DishSkeleton compact={compact} />;
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
      {!compact ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() =>
              updateFilters({
                conDescuento: filters.conDescuento ? undefined : true,
              })
            }
            className={clsx(
              "inline-flex h-10 w-fit items-center gap-2 rounded-xl border px-3 text-sm font-bold transition",
              filters.conDescuento
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
            )}
          >
            <TagIcon className="h-4 w-4" />
            Con descuento
          </button>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Ordenar
            <select
              value={
                filters.orden
                  ? (`precio-${filters.sentido ?? "asc"}` as OrdenValue)
                  : ""
              }
              onChange={(event) => handleOrden(event.target.value as OrdenValue)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">Por defecto</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
            </select>
          </label>
          <div className="mt-2 w-full sm:mt-0 sm:w-64">
            <input
              placeholder="Buscar platos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      ) : null}

      {dishes.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No se encontraron platos disponibles.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dishes.map((dish) => (
            <Link
              key={dish.id}
              href={`/client/platos/${dish.id}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500/50"
            >
              <div className="flex h-40 items-center justify-center bg-orange-50 dark:bg-orange-500/10">
                {dish.imageUrl ? (
                  <img
                    alt={dish.name}
                    src={dish.imageUrl}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-black text-orange-600 dark:text-orange-300">
                    {dish.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  {dish.name}
                </h3>
                <p className="mt-2 text-lg font-black text-orange-600 dark:text-orange-300">
                  ${dish.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center pt-3">
          <button
            type="button"
            onClick={() => {
              setIsLoadingMore(true);
              setErrorMessage("");
              setPage((current) => current + 1);
            }}
            disabled={isLoadingMore}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-orange-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {isLoadingMore ? "Cargando..." : "Cargar mas"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function DishSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: compact ? 3 : 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-40 animate-pulse bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
