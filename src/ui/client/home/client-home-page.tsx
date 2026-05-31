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
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
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
  );
}

function DishCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="h-[150px] bg-gray-100 dark:bg-slate-800" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-3 w-1/4 rounded bg-gray-100 dark:bg-slate-800" />
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
    <div className="mx-auto max-w-[1440px] space-y-10">
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-slate-100">
          Mejores locales
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {loadingRestaurants
            ? Array.from({ length: 8 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))
            : restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/client/local/${restaurant.id}`}
                  className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative h-[125px] bg-gray-50 dark:bg-slate-800">
                    {restaurant.url_photo ? (
                      <Image
                        alt={restaurant.name}
                        src={restaurant.url_photo}
                        width={120}
                        height={125}
                        className="mx-auto h-full w-[120px] object-contain p-3"
                      />
                    ) : (
                      <div className="mx-auto flex h-full w-[120px] items-center justify-center text-center text-xs font-bold uppercase tracking-wide text-gray-300 dark:text-slate-600">
                        Sin imagen
                      </div>
                    )}
                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold sm:text-sm ${
                        restaurant.state
                          ? "bg-green-100 text-green-900 dark:bg-green-500/10 dark:text-green-300"
                          : "bg-gray-200 text-gray-500 dark:bg-slate-900 dark:text-slate-400"
                      }`}
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
                  <div className="p-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="h-[45px] w-[45px] shrink-0 rounded-full border border-gray-200 p-2 dark:border-slate-700">
                        {restaurant.url_photo ? (
                          <Image
                            alt={restaurant.name}
                            src={restaurant.url_photo}
                            width={45}
                            height={45}
                            className="h-full object-contain"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-gray-100 dark:bg-slate-800" />
                        )}
                      </div>
                      <span className="min-w-0 text-sm font-bold text-gray-800 dark:text-slate-100">
                        {restaurant.name}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <StarIcon className="h-4 w-4 text-orange-400" />
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {restaurant.stars}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-slate-100">
          Platos destacados
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {loadingDishes
            ? Array.from({ length: 8 }).map((_, i) => (
                <DishCardSkeleton key={i} />
              ))
            : dishes.map((dish) => (
                <Link
                  key={dish.id}
                  href={`/client/platos/${dish.id}`}
                  className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative flex h-[150px] items-center justify-center bg-orange-50 dark:bg-orange-500/10">
                    {dish.imageUrl ? (
                      <Image
                        alt={dish.name}
                        src={dish.imageUrl}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-4xl font-black text-orange-600">
                        {dish.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="block font-bold text-gray-800 dark:text-slate-100">
                      {dish.name}
                    </span>
                    <span className="mt-1 block text-sm font-bold text-orange-700 dark:text-orange-300">
                      ${dish.price}
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </section>
    </div>
  );
}
