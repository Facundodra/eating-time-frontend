"use client";

import { useEffect, useState } from "react";

import { getRestaurants } from "@/services/client/client-service";
import type { RestaurantList} from "@/lib/client/types";

import Image from "next/image";
import clsx from "clsx";
import Link from "next/link";

import {
    CheckCircleIcon,
    MoonIcon,
    StarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";


function RestaurantSkeleton() {
  return (
    <div className="locales-list flex flex-wrap max-w-[1440px] mx-auto">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="local px-2 py-2 w-1/2 md:w-1/3 lg:w-1/4">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse dark:border-slate-800 dark:bg-slate-900">
            <div className="bg-gray-100 h-[125px] dark:bg-slate-800" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-[45px] h-[45px] rounded-full bg-gray-200 shrink-0 dark:bg-slate-700" />
                <div className="h-4 bg-gray-200 rounded w-2/3 dark:bg-slate-700" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-3 bg-gray-100 rounded w-1/4 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


const PAGE_SIZE = 12;

type SortKey = "calificacion_desc" | "calificacion_asc" | "nombre_asc" | "nombre_desc";

const sortMap: Record<SortKey, { ordenarPor: 'calificacion' | 'nombre'; direccion: 'asc' | 'desc' }> = {
  calificacion_desc: { ordenarPor: 'calificacion', direccion: 'desc' },
  calificacion_asc:  { ordenarPor: 'calificacion', direccion: 'asc'  },
  nombre_asc:        { ordenarPor: 'nombre',        direccion: 'asc'  },
  nombre_desc:       { ordenarPor: 'nombre',        direccion: 'desc' },
};

export default function RestaurantList() {
  const [restaurant, setRestaurants] = useState<RestaurantList[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>("calificacion_desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStars, setFilterStars] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setLoading(true);
        setError(null);
        return getRestaurants({
          ...sortMap[sort],
          ...(filterOpen  && { servicio: 'ACTIVO' as const }),
          ...(filterStars && { calificacionMin: 4 }),
          page: page - 1,
          size: PAGE_SIZE,
        });
      })
      .then((result) => {
        if (cancelled || !result) return;
        const { restaurants, totalPages } = result;
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

    return () => { cancelled = true; };
  }, [sort, filterOpen, filterStars, page]);

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

  if (restaurant.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        No hay locales que coincidan con tu búsqueda.
      </p>
    );
  }

  // Orden
  function applySort(value: SortKey) {
    setSort(value);
    setPage(1);
  }

  // Abierto | Cerrado
  function toggleOpen() {
    setFilterOpen((v) => !v);
    setPage(1);
  }

  // Filtro calificación
  function toggleStars() {
    setFilterStars((v) => !v);
    setPage(1);
  }

  return (
    <div>
      {/* Barra de filtros */}
      <div className="bg-white flex items-center gap-6 mb-4 text-sm text-gray-600 max-w-[1440px] mx-auto p-4 rounded-xl overflow-auto dark:bg-slate-900 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700 dark:text-slate-200">Ordenar:</span>
          <select
            value={sort}
            onChange={(e) => applySort(e.target.value as SortKey)}
            className="border border-gray-200 rounded-lg bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:border-orange-700 cursor-pointer dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-orange-500"
          >
            <option value="calificacion_desc">Mejor calificación</option>
            <option value="calificacion_asc">Menor calificación</option>
            <option value="nombre_asc">A-Z</option>
            <option value="nombre_desc">Z-A</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700 dark:text-slate-200">Filtrar:</span>

          <button
            onClick={toggleOpen}
            className={clsx(
              "flex items-center gap-1 px-3 py-1 rounded-full border text-sm transition-colors",
              filterOpen
                ? "border-orange-700 bg-orange-50 text-orange-700 dark:border-orange-500 dark:bg-orange-500/10 dark:text-orange-300"
                : "border-gray-200 text-gray-600 hover:border-orange-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-500",
            )}
          >
            <CheckCircleIcon className="w-4 h-4" />
            Abiertos
          </button>

          <button
            onClick={toggleStars}
            className={clsx(
              "flex items-center gap-1 px-3 py-1 rounded-full border text-sm transition-colors",
              filterStars
                ? "border-orange-700 bg-orange-50 text-orange-700 dark:border-orange-500 dark:bg-orange-500/10 dark:text-orange-300"
                : "border-gray-200 text-gray-600 hover:border-orange-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-500",
            )}
          >
            <StarIcon className="w-4 h-4" />
            4+ estrellas
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="locales-list flex flex-wrap max-w-[1440px] mx-auto">
        {restaurant.map((restaurant) => (
          <div
            key={restaurant.id}
            className="local px-2 py-2 w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Link href={`/client/restaurant/${restaurant.id}`} className="block local-wrapper rounded-xl border border-gray-200 hover:border-orange-700 transition-all duration-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500">
              <div className="local-img bg-gray-50 h-[125px] relative dark:bg-slate-800">
                {restaurant.coverPhotoUrl ? (
                  <Image
                    alt={restaurant.name}
                    src={restaurant.coverPhotoUrl}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-[120px] h-full mx-auto flex items-center justify-center text-gray-300 text-4xl dark:text-slate-600">
                    🍽
                  </div>
                )}
                <span
                  aria-label={restaurant.state ? "Abierto" : "Cerrado"}
                  title={restaurant.state ? "Abierto" : "Cerrado"}
                  className={clsx(
                    "local-estado absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
                    {
                      "bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-200": restaurant.state,
                      "bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-300": !restaurant.state,
                    },
                  )}
                >
                  {restaurant.state ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <MoonIcon className="h-4 w-4" />
                  )}
                  {restaurant.state ? "Abierto" : "Cerrado"}
                </span>
              </div>

              <div className="local-info p-4">
                <div className="local-nombre">
                  <div className="relative mr-2 inline-flex h-[45px] w-[45px] items-center justify-center overflow-hidden rounded-full border border-orange-100 bg-orange-50 align-middle text-sm font-black text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
                    {restaurant.profilePhotoUrl ? (
                      <Image
                        alt={`Perfil de ${restaurant.name}`}
                        src={restaurant.profilePhotoUrl}
                        fill
                        sizes="45px"
                        className="object-cover"
                      />
                    ) : (
                      restaurant.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="inline-block align-middle font-bold text-gray-800 dark:text-slate-100">
                    {restaurant.name}
                  </span>
                </div>
                <div className="local-calificacion flex items-center gap-2 mt-2">
                  <StarIcon className="text-orange-400 w-4 h-4" />
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {restaurant.stars} (384)
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-40 hover:border-orange-700 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-500"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={clsx(
                "w-9 h-9 rounded-lg border text-sm font-medium transition-colors",
                n === page
                  ? "border-orange-700 bg-orange-700 text-white"
                  : "border-gray-200 text-gray-600 hover:border-orange-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-500",
              )}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-40 hover:border-orange-700 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-500"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
