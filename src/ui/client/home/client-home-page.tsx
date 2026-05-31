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
  );
}

function DishCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="bg-gray-100 h-[150px]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
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
        <h2 className="text-lg font-bold text-gray-800 mb-4">Mejores locales</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingRestaurants
            ? Array.from({ length: 8 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))
            : restaurants.map((r) => (
                <Link
                  key={r.id}
                  href={`/client/local/${r.id}`}
                  className="block rounded-xl border border-gray-200 hover:border-orange-700 transition-all duration-200 bg-white overflow-hidden"
                >
                  <div className="local-img bg-gray-50 h-[125px] relative">
                    {r.url_photo ? (
                      <Image
                        alt={r.name}
                        src={r.url_photo}
                        width={120}
                        height={125}
                        className="object-contain mx-auto p-3 w-[120px] h-full"
                      />
                    ) : (
                      <div className="w-[120px] h-full mx-auto flex items-center justify-center text-gray-300 text-4xl">
                        🍽
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 py-1 px-3 rounded-full text-sm ${
                        r.state
                          ? "bg-green-100 text-green-900"
                          : "bg-gray-200 text-gray-500"
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
                      <div className="border border-gray-200 p-2 rounded-full w-[45px] h-[45px] shrink-0">
                        {r.url_photo ? (
                          <Image
                            alt={r.name}
                            src={r.url_photo}
                            width={45}
                            height={45}
                            className="h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-full" />
                        )}
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <StarIcon className="text-orange-400 w-4 h-4" />
                      <span className="text-xs text-gray-400">{r.stars}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Platos destacados */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Platos destacados</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingDishes
            ? Array.from({ length: 8 }).map((_, i) => (
                <DishCardSkeleton key={i} />
              ))
            : dishes.map((d) => (
                <Link
                  key={d.id}
                  href={`/client/platos/${d.id}`}
                  className="block rounded-xl border border-gray-200 hover:border-orange-700 transition-all duration-200 bg-white overflow-hidden"
                >
                  <div className="flex items-center justify-center bg-orange-50 h-[150px]">
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
                    <span className="font-bold text-gray-800 block">{d.name}</span>
                    <span className="text-orange-700 font-bold text-sm mt-1 block">
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
