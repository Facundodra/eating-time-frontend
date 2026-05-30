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
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
            <div className="bg-gray-100 h-[125px]" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-[45px] h-[45px] rounded-full bg-gray-200 shrink-0" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
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

    setLoading(true);
    setError(null);
    getRestaurants({
      ...sortMap[sort],
      ...(filterOpen  && { servicio: 'ACTIVO' as const }),
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

    return () => { cancelled = true; };
  }, [sort, filterOpen, filterStars, page]);

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
        {error}
      </p>
    );
  }

  if (loading) {
    return <RestaurantSkeleton />;
  }

  if (restaurant.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No hay locales que coincidan con su busqueda.
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

  // Filtro calificacion
  function toggleStars() {
    setFilterStars((v) => !v);
    setPage(1);
  }

  return (
    <div>
      {/* Barra de filtros */}
      <div className="bg-white flex items-center gap-6 mb-4 text-sm text-gray-600 max-w-[1440px] mx-auto p-4 rounded-xl overflow-auto">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Ordenar:</span>
          <select
            value={sort}
            onChange={(e) => applySort(e.target.value as SortKey)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:border-orange-700 cursor-pointer"
          >
            <option value="calificacion_desc">Mejor calificación</option>
            <option value="calificacion_asc">Menor calificación</option>
            <option value="nombre_asc">A-Z</option>
            <option value="nombre_desc">Z-A</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Filtrar:</span>

          <button
            onClick={toggleOpen}
            className={clsx(
              "flex items-center gap-1 px-3 py-1 rounded-full border text-sm transition-colors",
              filterOpen
                ? "border-orange-700 bg-orange-50 text-orange-700"
                : "border-gray-200 text-gray-600 hover:border-orange-700",
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
                ? "border-orange-700 bg-orange-50 text-orange-700"
                : "border-gray-200 text-gray-600 hover:border-orange-700",
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
            <Link href={`/client/local/${restaurant.id}`} className="block local-wrapper rounded-xl border border-gray-200 hover:border-orange-700 transition-all duration-200 bg-white overflow-hidden">
              <div className="local-img bg-gray-50 h-[125px] relative">
                {restaurant.url_photo ? (
                  <Image
                    alt={restaurant.name}
                    src={restaurant.url_photo}
                    width="100"
                    height="100"
                    className="object-contain mx-auto p-3 w-[120px] h-full"
                  />
                ) : (
                  <div className="w-[120px] h-full mx-auto flex items-center justify-center text-gray-300 text-4xl">
                    🍽
                  </div>
                )}
                <span
                  className={clsx(
                    "local-estado absolute top-3 py-1 px-3 rounded-full right-3 text-sm",
                    {
                      "bg-green-100 text-green-900": restaurant.state,
                      "bg-gray-200 text-gray-500": !restaurant.state,
                    },
                  )}
                >
                  {restaurant.state ? (
                    <>
                      <CheckCircleIcon className="inline relative bottom-[2px] w-4 h-4 mr-1" />
                      Abierto
                    </>
                  ) : (
                    <>
                      <MoonIcon className="inline relative bottom-[2px] w-4 h-4 mr-1" />
                      Cerrado
                    </>
                  )}
                </span>
              </div>

              <div className="local-info p-4">
                <div className="local-nombre">
                  <div className="img inline-block align-middle mr-2 border border-gray-200 p-2 rounded-full w-[45px] h-[45px]">
                    {restaurant.url_photo ? (
                      <Image
                        alt={restaurant.name}
                        src={restaurant.url_photo}
                        width="45"
                        height="45"
                        className="h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-full" />
                    )}
                  </div>
                  <span className="inline-block align-middle font-bold text-gray-800">
                    {restaurant.name}
                  </span>
                </div>
                <div className="local-calificacion flex items-center gap-2 mt-2">
                  <StarIcon className="text-orange-400 w-4 h-4" />
                  <span className="text-xs text-gray-400">
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
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-orange-700 transition-colors"
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
                  : "border-gray-200 text-gray-600 hover:border-orange-700",
              )}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-orange-700 transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
