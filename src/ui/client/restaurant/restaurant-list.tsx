"use client";

import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoonIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { RestaurantList as RestaurantListItem } from "@/lib/client/types";
import { getRestaurants } from "@/services/client/client-service";

const PAGE_SIZE = 12;

type SortKey = "calificacion_desc" | "calificacion_asc" | "nombre_asc" | "nombre_desc";

const sortMap: Record<
  SortKey,
  { ordenarPor: "calificacion" | "nombre"; direccion: "asc" | "desc" }
> = {
  calificacion_desc: { ordenarPor: "calificacion", direccion: "desc" },
  calificacion_asc: { ordenarPor: "calificacion", direccion: "asc" },
  nombre_asc: { ordenarPor: "nombre", direccion: "asc" },
  nombre_desc: { ordenarPor: "nombre", direccion: "desc" },
};

function RestaurantSkeleton() {
  return (
    <div className="locales-list mx-auto flex max-w-[1440px] flex-wrap">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="local w-1/2 px-2 py-2 md:w-1/3 lg:w-1/4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900">
            <div className="h-[125px] bg-gray-100 dark:bg-slate-800" />
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <div className="h-[45px] w-[45px] shrink-0 rounded-full bg-gray-200 dark:bg-slate-700" />
                <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-3 w-1/4 rounded bg-gray-100 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>("calificacion_desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStars, setFilterStars] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getRestaurants({
      ...sortMap[sort],
      ...(filterOpen && { servicio: "ACTIVO" as const }),
      ...(filterStars && { calificacionMin: 4 }),
      page: page - 1,
      size: PAGE_SIZE,
    })
      .then(({ restaurants, totalPages }) => {
        if (cancelled) return;
        setRestaurants(restaurants);
        setTotalPages(totalPages);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Error al cargar");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sort, filterOpen, filterStars, page]);

  function setLoadingPage(nextPage: number | ((page: number) => number)) {
    setLoading(true);
    setError(null);
    setPage(nextPage);
  }

  function applySort(value: SortKey) {
    setLoading(true);
    setError(null);
    setSort(value);
    setPage(1);
  }

  function toggleOpen() {
    setLoading(true);
    setError(null);
    setFilterOpen((v) => !v);
    setPage(1);
  }

  function toggleStars() {
    setLoading(true);
    setError(null);
    setFilterStars((v) => !v);
    setPage(1);
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
        {error}
      </p>
    );
  }

  if (loading) {
    return <RestaurantSkeleton />;
  }

  if (restaurants.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        No hay locales que coincidan con su busqueda.
      </p>
    );
  }

  return (
    <div>
      <div className="mx-auto mb-4 flex max-w-[1440px] items-center gap-6 overflow-auto rounded-xl bg-white p-4 text-sm text-gray-600 dark:bg-slate-900 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700 dark:text-slate-200">Ordenar:</span>
          <select
            value={sort}
            onChange={(e) => applySort(e.target.value as SortKey)}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:border-orange-700 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="calificacion_desc">Mejor calificacion</option>
            <option value="calificacion_asc">Menor calificacion</option>
            <option value="nombre_asc">A-Z</option>
            <option value="nombre_desc">Z-A</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700 dark:text-slate-200">Filtrar:</span>

          <button
            type="button"
            onClick={toggleOpen}
            className={clsx(
              "flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
              filterOpen
                ? "border-orange-700 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
                : "border-gray-200 text-gray-600 hover:border-orange-700 dark:border-slate-800 dark:text-slate-300",
            )}
          >
            <CheckCircleIcon className="h-4 w-4" />
            Abiertos
          </button>

          <button
            type="button"
            onClick={toggleStars}
            className={clsx(
              "flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
              filterStars
                ? "border-orange-700 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
                : "border-gray-200 text-gray-600 hover:border-orange-700 dark:border-slate-800 dark:text-slate-300",
            )}
          >
            <StarIcon className="h-4 w-4" />
            4+ estrellas
          </button>
        </div>
      </div>

      <div className="locales-list mx-auto flex max-w-[1440px] flex-wrap">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="local w-1/2 px-2 py-2 md:w-1/3 lg:w-1/4"
          >
            <Link
              href={`/client/local/${restaurant.id}`}
              className="local-wrapper block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
            >
              <div className="local-img relative h-[125px] bg-gray-50 dark:bg-slate-950">
                {restaurant.url_photo ? (
                  <Image
                    alt={restaurant.name}
                    src={restaurant.url_photo}
                    width="100"
                    height="100"
                    className="mx-auto h-full w-[120px] object-contain p-3"
                  />
                ) : (
                  <div className="mx-auto flex h-full w-[120px] items-center justify-center text-4xl text-gray-300 dark:text-slate-600">
                    ET
                  </div>
                )}
                <span
                  className={clsx(
                    "local-estado absolute right-3 top-3 rounded-full px-3 py-1 text-sm",
                    {
                      "bg-green-100 text-green-900 dark:bg-emerald-500/10 dark:text-emerald-300":
                        restaurant.state,
                      "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-300":
                        !restaurant.state,
                    },
                  )}
                >
                  {restaurant.state ? (
                    <>
                      <CheckCircleIcon className="relative bottom-[2px] mr-1 inline h-4 w-4" />
                      Abierto
                    </>
                  ) : (
                    <>
                      <MoonIcon className="relative bottom-[2px] mr-1 inline h-4 w-4" />
                      Cerrado
                    </>
                  )}
                </span>
              </div>

              <div className="local-info p-4">
                <div className="local-nombre">
                  <div className="img mr-2 inline-block h-[45px] w-[45px] rounded-full border border-gray-200 p-2 align-middle dark:border-slate-800">
                    {restaurant.url_photo ? (
                      <Image
                        alt={restaurant.name}
                        src={restaurant.url_photo}
                        width="45"
                        height="45"
                        className="h-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-gray-100 dark:bg-slate-800" />
                    )}
                  </div>
                  <span className="inline-block align-middle font-bold text-gray-800 dark:text-white">
                    {restaurant.name}
                  </span>
                </div>
                <div className="local-calificacion mt-2 flex items-center gap-2">
                  <StarIcon className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-gray-400 dark:text-slate-400">
                    {restaurant.stars} (384)
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setLoadingPage((p) => p - 1)}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 p-2 transition-colors hover:border-orange-700 disabled:opacity-40 dark:border-slate-800 dark:text-slate-200"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setLoadingPage(n)}
              className={clsx(
                "h-9 w-9 rounded-lg border text-sm font-medium transition-colors",
                n === page
                  ? "border-orange-700 bg-orange-700 text-white"
                  : "border-gray-200 text-gray-600 hover:border-orange-700 dark:border-slate-800 dark:text-slate-300",
              )}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setLoadingPage((p) => p + 1)}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 p-2 transition-colors hover:border-orange-700 disabled:opacity-40 dark:border-slate-800 dark:text-slate-200"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
