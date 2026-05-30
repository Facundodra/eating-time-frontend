"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircleIcon,
  MoonIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

import { getRestaurants, getDishes } from "@/services/client/client-service";
import type { RestaurantList, ClientDish } from "@/lib/client/types";

function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900">
      <div className="h-[125px] bg-gray-100 dark:bg-slate-800" />
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
  );
}

function DishCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900">
      <div className="h-[150px] bg-gray-100 dark:bg-slate-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-2/3 dark:bg-slate-700" />
        <div className="h-3 bg-gray-100 rounded w-1/4 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function ClientHomePage() {
  const [restaurants, setRestaurants] = useState<RestaurantList[]>([]);
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(true);

  useEffect(() => {
    getRestaurants({ ordenarPor: "calificacion", direccion: "desc", size: 8 })
      .then(({ restaurants }) => setRestaurants(restaurants))
      .finally(() => setLoadingRestaurants(false));
  }, []);

  useEffect(() => {
    getDishes({ tamano: 8 })
      .then(setDishes)
      .finally(() => setLoadingDishes(false));
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 space-y-10">
      {/* Mejores locales */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 dark:text-white">Mejores locales</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingRestaurants
            ? Array.from({ length: 8 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))
            : restaurants.map((r) => (
                <Link
                  key={r.id}
                  href={`/client/local/${r.id}`}
                  className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
                >
                  <div className="local-img h-[125px] bg-gray-50 relative dark:bg-slate-950">
                    {r.url_photo ? (
                      <Image
                        alt={r.name}
                        src={r.url_photo}
                        width={120}
                        height={125}
                        className="object-contain mx-auto p-3 w-[120px] h-full"
                      />
                    ) : (
                      <div className="w-[120px] h-full mx-auto flex items-center justify-center text-gray-300 text-4xl dark:text-slate-600">
                        🍽
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 py-1 px-3 rounded-full text-sm ${
                        r.state
                          ? "bg-green-100 text-green-900 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {r.state ? (
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
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="border border-gray-200 p-2 rounded-full w-[45px] h-[45px] shrink-0 dark:border-slate-800">
                        {r.url_photo ? (
                          <Image
                            alt={r.name}
                            src={r.url_photo}
                            width={45}
                            height={45}
                            className="h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-full dark:bg-slate-800" />
                        )}
                      </div>
                      <span className="font-bold text-gray-800 text-sm dark:text-white">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <StarIcon className="text-orange-400 w-4 h-4" />
                      <span className="text-xs text-gray-400 dark:text-slate-400">{r.stars}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Platos destacados */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 dark:text-white">Platos destacados</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingDishes
            ? Array.from({ length: 8 }).map((_, i) => (
                <DishCardSkeleton key={i} />
              ))
            : dishes.map((d) => (
                <Link
                  key={d.id}
                  href={`/client/platos/${d.id}`}
                  className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
                >
                  <div className="flex items-center justify-center bg-orange-50 h-[150px] dark:bg-orange-500/10">
                    {d.imageUrl ? (
                      <img
                        alt={d.name}
                        src={d.imageUrl}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-4xl font-black text-orange-600">
                        {d.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="font-bold text-gray-800 block dark:text-white">{d.name}</span>
                    <span className="text-orange-700 font-bold text-sm mt-1 block dark:text-orange-300">
                      ${d.price}
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </section>
    </div>
  );
}
