"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
  MoonIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  StarIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

import {
  getClientDishCategorySummaries,
  getDishDiscount,
  getDishes,
  getDiscountedDishIds,
  getRestaurants,
} from "@/services/client/client-service";
import type {
  ClientDish,
  ClientDishCategorySummary,
  Discount,
  RestaurantList,
} from "@/lib/client/types";

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

function CategoryCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-slate-800" />
      <div className="mt-4 h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
      <div className="mt-3 h-3 w-1/3 rounded bg-gray-100 dark:bg-slate-800" />
    </div>
  );
}

function formatDishCount(count: number) {
  if (count === 0) return "Sin platos";
  if (count === 1) return "1 plato";
  return `${count} platos`;
}

export default function ClientHomePage() {
  const [restaurants, setRestaurants] = useState<RestaurantList[]>([]);
  const [categories, setCategories] = useState<ClientDishCategorySummary[]>([]);
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [discounts, setDiscounts] = useState<Map<number, Discount>>(new Map());
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(true);

  useEffect(() => {
    getRestaurants({ ordenarPor: "calificacion", direccion: "desc", size: 8 })
      .then(({ restaurants }) => setRestaurants(restaurants))
      .catch(() => setRestaurants([]))
      .finally(() => setLoadingRestaurants(false));
  }, []);

  useEffect(() => {
    getClientDishCategorySummaries()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getDishes({ tamano: 8 }), getDiscountedDishIds()])
      .then(async ([dishesData, discountedIds]) => {
        if (cancelled) return;
        setDishes(dishesData);

        const idsToFetch = dishesData
          .map((dish) => dish.id)
          .filter((id) => discountedIds.has(id));

        if (idsToFetch.length === 0) return;

        const results = await Promise.allSettled(
          idsToFetch.map(getDishDiscount),
        );

        if (cancelled) return;

        const map = new Map<number, Discount>();
        results.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value != null) {
            map.set(idsToFetch[index], result.value);
          }
        });
        setDiscounts(map);
      })
      .catch(() => setDishes([]))
      .finally(() => {
        if (!cancelled) setLoadingDishes(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 px-4 py-6">
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
          Mejores locales
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {loadingRestaurants
            ? Array.from({ length: 8 }).map((_, index) => (
                <RestaurantCardSkeleton key={index} />
              ))
            : restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/client/restaurant/${restaurant.id}`}
                  className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
                >
                  <div className="relative h-[125px] bg-gray-50 dark:bg-slate-950">
                    {restaurant.url_photo ? (
                      <Image
                        alt={restaurant.name}
                        src={restaurant.url_photo}
                        width={120}
                        height={125}
                        className="mx-auto h-full w-[120px] object-contain p-3"
                      />
                    ) : (
                      <div className="mx-auto flex h-full w-[120px] items-center justify-center text-gray-300 dark:text-slate-700">
                        <BuildingStorefrontIcon className="h-12 w-12" />
                      </div>
                    )}
                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-sm ${
                        restaurant.state
                          ? "bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-300"
                          : "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
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
                    <div className="flex items-center gap-2">
                      <div className="h-[45px] w-[45px] shrink-0 rounded-full border border-gray-200 p-2 dark:border-slate-700 dark:bg-slate-950">
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
                      <span className="text-sm font-bold text-gray-800 dark:text-slate-100">
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Categorías
          </h2>
          <Link
            href="/client/search"
            className="text-sm font-bold text-orange-700 transition hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
          >
            Ver todas
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {loadingCategories
            ? Array.from({ length: 8 }).map((_, index) => (
                <CategoryCardSkeleton key={index} />
              ))
            : categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/client/search?q=${encodeURIComponent(category.name)}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
                >
                  <div className="relative flex h-24 items-center justify-center bg-orange-50 dark:bg-orange-500/10">
                    {category.imageUrl ? (
                      <Image
                        alt={category.name}
                        src={category.imageUrl}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <Squares2X2Icon className="h-9 w-9 text-orange-300 dark:text-orange-500/60" />
                    )}
                  </div>
                  <div className="p-4">
                    <span className="block truncate text-sm font-bold text-gray-800 dark:text-slate-100">
                      {category.name}
                    </span>
                    <span className="mt-1 block text-xs font-medium text-gray-400 dark:text-slate-500">
                      {formatDishCount(category.dishCount)}
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
          Platos destacados
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {loadingDishes
            ? Array.from({ length: 8 }).map((_, index) => (
                <DishCardSkeleton key={index} />
              ))
            : dishes.map((dish) => {
                const discount = discounts.get(dish.id);
                const discountedPrice = discount
                  ? Math.round(
                      dish.price * (1 - discount.porcentaje / 100) * 100,
                    ) / 100
                  : null;

                return (
                  <Link
                    key={dish.id}
                    href={`/client/platos/${dish.id}`}
                    className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
                  >
                    <div className="relative flex h-[150px] items-center justify-center bg-orange-50 dark:bg-orange-500/10">
                      {discount ? (
                        <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                          <TagIcon className="h-3 w-3" />
                          -{discount.porcentaje}%
                        </span>
                      ) : null}
                      {dish.imageUrl ? (
                        <Image
                          alt={dish.name}
                          src={dish.imageUrl}
                          width={320}
                          height={180}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm dark:bg-slate-950 dark:text-orange-300">
                          <ShoppingBagIcon className="h-8 w-8" />
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="block font-bold text-gray-800 dark:text-slate-100">
                        {dish.name}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        {discountedPrice != null ? (
                          <>
                            <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                              ${discountedPrice}
                            </span>
                            <span className="text-xs text-gray-400 line-through dark:text-slate-500">
                              ${dish.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                            ${dish.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </section>
    </div>
  );
}
