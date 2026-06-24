"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  MoonIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  StarIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

import {
  getDishDiscount,
  getDishes,
  getDiscountedDishIds,
  getRestaurants,
  getClientDishCategorySummaries,
} from "@/services/client/client-service";
import type {
  ClientDish,
  ClientDishCategorySummary,
  Discount,
  RestaurantList,
} from "@/lib/client/types";

const CATEGORY_SKELETON_COUNT = 8;
const CATEGORY_SLIDE_STEP = 260;
const CATEGORY_HOLD_DELAY_MS = 100;
const CATEGORY_HOLD_SCROLL_SPEED = 760;

function RestaurantCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="h-[92px] bg-gray-100 dark:bg-slate-800" />
      <div className="space-y-2 p-2.5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 dark:bg-slate-700" />
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
      <div className="h-[108px] bg-gray-100 dark:bg-slate-800" />
      <div className="space-y-2 p-2.5">
        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-3 w-1/4 rounded bg-gray-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="w-24 shrink-0 snap-start animate-pulse sm:w-28">
      <div className="h-[72px] rounded-3xl bg-gray-100 dark:bg-slate-800 sm:h-20" />
      <div className="mt-2 space-y-2">
        <div className="mx-auto h-4 w-20 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="mx-auto h-3 w-12 rounded bg-gray-100 dark:bg-slate-800" />
      </div>
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
  const categoriesSliderRef = useRef<HTMLDivElement | null>(null);
  const categoryHoldDelayRef = useRef<number | null>(null);
  const categoryHoldFrameRef = useRef<number | null>(null);
  const categoryHoldLastFrameRef = useRef<number | null>(null);
  const categoryHoldScrolledRef = useRef(false);

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

  useEffect(() => {
    return () => {
      if (categoryHoldDelayRef.current != null) {
        window.clearTimeout(categoryHoldDelayRef.current);
      }
      if (categoryHoldFrameRef.current != null) {
        window.cancelAnimationFrame(categoryHoldFrameRef.current);
      }
    };
  }, []);

  function scrollCategories(
    direction: -1 | 1,
    behavior: ScrollBehavior = "smooth",
    distance = CATEGORY_SLIDE_STEP,
  ) {
    categoriesSliderRef.current?.scrollBy({
      left: direction * distance,
      behavior,
    });
  }

  function stopCategoryHoldScroll() {
    if (categoryHoldDelayRef.current != null) {
      window.clearTimeout(categoryHoldDelayRef.current);
      categoryHoldDelayRef.current = null;
    }
    if (categoryHoldFrameRef.current != null) {
      window.cancelAnimationFrame(categoryHoldFrameRef.current);
      categoryHoldFrameRef.current = null;
    }
    categoryHoldLastFrameRef.current = null;
  }

  function animateCategoryHoldScroll(direction: -1 | 1, timestamp: number) {
    const slider = categoriesSliderRef.current;
    if (!slider) {
      stopCategoryHoldScroll();
      return;
    }

    const lastFrame = categoryHoldLastFrameRef.current ?? timestamp;
    const elapsedSeconds = (timestamp - lastFrame) / 1000;
    const maxScrollLeft = Math.max(slider.scrollWidth - slider.clientWidth, 0);
    const nextScrollLeft =
      slider.scrollLeft + direction * CATEGORY_HOLD_SCROLL_SPEED * elapsedSeconds;

    categoryHoldLastFrameRef.current = timestamp;
    categoryHoldScrolledRef.current = true;
    slider.scrollLeft = Math.min(Math.max(nextScrollLeft, 0), maxScrollLeft);

    const reachedStart = direction < 0 && slider.scrollLeft <= 0;
    const reachedEnd = direction > 0 && slider.scrollLeft >= maxScrollLeft;
    if (reachedStart || reachedEnd) {
      stopCategoryHoldScroll();
      return;
    }

    categoryHoldFrameRef.current = window.requestAnimationFrame((nextTimestamp) =>
      animateCategoryHoldScroll(direction, nextTimestamp),
    );
  }

  function startCategoryHoldScroll(direction: -1 | 1) {
    stopCategoryHoldScroll();
    categoryHoldScrolledRef.current = false;
    categoryHoldDelayRef.current = window.setTimeout(() => {
      categoryHoldLastFrameRef.current = null;
      categoryHoldFrameRef.current = window.requestAnimationFrame((timestamp) =>
        animateCategoryHoldScroll(direction, timestamp),
      );
    }, CATEGORY_HOLD_DELAY_MS);
  }

  function handleCategoryArrowPressStart(direction: -1 | 1) {
    startCategoryHoldScroll(direction);
  }

  function handleCategoryArrowPressEnd() {
    stopCategoryHoldScroll();
  }

  function handleCategoryArrowClick(direction: -1 | 1) {
    if (categoryHoldScrolledRef.current) {
      categoryHoldScrolledRef.current = false;
      return;
    }

    scrollCategories(direction);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 px-0 py-4 sm:px-4 sm:py-5">
      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Categorías
          </h2>
          <Link
            href="/client/search?tab=categories"
            className="text-sm font-bold text-orange-700 transition hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
          >
            Ver todas
          </Link>
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Ver categorias anteriores"
            onMouseDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              handleCategoryArrowPressStart(-1);
            }}
            onMouseUp={handleCategoryArrowPressEnd}
            onMouseLeave={handleCategoryArrowPressEnd}
            onTouchStart={() => handleCategoryArrowPressStart(-1)}
            onTouchEnd={handleCategoryArrowPressEnd}
            onTouchCancel={handleCategoryArrowPressEnd}
            onClick={() => handleCategoryArrowClick(-1)}
            className="absolute left-0 top-10 z-10 hidden h-9 w-9 -translate-y-1/2 select-none items-center justify-center rounded-full border border-slate-700/70 bg-slate-950/80 text-slate-100 shadow-lg transition hover:border-orange-400 hover:text-orange-300 lg:flex"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div
            ref={categoriesSliderRef}
            className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 lg:px-11"
          >
            {loadingCategories
              ? Array.from({ length: CATEGORY_SKELETON_COUNT }).map(
                  (_, index) => <CategoryCardSkeleton key={index} />,
                )
              : categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/client/search?q=${encodeURIComponent(category.name)}`}
                    className="group w-24 shrink-0 snap-start sm:w-28"
                  >
                    <div className="relative flex h-[72px] items-center justify-center overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800 sm:h-20">
                      {category.imageUrl ? (
                        <Image
                          alt={category.name}
                          src={category.imageUrl}
                          fill
                          unoptimized
                          sizes="(min-width: 640px) 112px, 96px"
                          className="scale-110 object-cover transition duration-200 group-hover:scale-125"
                        />
                      ) : (
                        <Squares2X2Icon className="h-9 w-9 text-orange-300 dark:text-orange-500/60" />
                      )}
                    </div>
                    <div className="mt-2 min-w-0 text-center">
                      <span className="block truncate text-sm font-bold text-gray-800 dark:text-slate-100">
                        {category.name}
                      </span>
                      <span className="mt-0.5 block text-xs font-medium text-gray-400 dark:text-slate-500">
                        {formatDishCount(category.dishCount)}
                      </span>
                    </div>
                  </Link>
                ))}
          </div>
          <button
            type="button"
            aria-label="Ver mas categorias"
            onMouseDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              handleCategoryArrowPressStart(1);
            }}
            onMouseUp={handleCategoryArrowPressEnd}
            onMouseLeave={handleCategoryArrowPressEnd}
            onTouchStart={() => handleCategoryArrowPressStart(1)}
            onTouchEnd={handleCategoryArrowPressEnd}
            onTouchCancel={handleCategoryArrowPressEnd}
            onClick={() => handleCategoryArrowClick(1)}
            className="absolute right-0 top-10 z-10 hidden h-9 w-9 -translate-y-1/2 select-none items-center justify-center rounded-full border border-slate-700/70 bg-slate-950/80 text-slate-100 shadow-lg transition hover:border-orange-400 hover:text-orange-300 lg:flex"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
          Mejores locales
        </h2>
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4">
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
                  <div className="relative h-[92px] bg-gray-50 dark:bg-slate-950">
                    {restaurant.coverPhotoUrl ? (
                      <Image
                        alt={restaurant.name}
                        src={restaurant.coverPhotoUrl}
                        fill
                        unoptimized
                        sizes="(min-width: 1536px) 18vw, (min-width: 1280px) 24vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="mx-auto flex h-full w-[120px] items-center justify-center text-gray-300 dark:text-slate-700">
                        <BuildingStorefrontIcon className="h-12 w-12" />
                      </div>
                    )}
                    <span
                      aria-label={restaurant.state ? "Abierto" : "Cerrado"}
                      title={restaurant.state ? "Abierto" : "Cerrado"}
                      className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
                        restaurant.state
                          ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {restaurant.state ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <MoonIcon className="h-4 w-4" />
                      )}
                      {restaurant.state ? "Abierto" : "Cerrado"}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-100 bg-orange-50 text-sm font-black text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
                        {restaurant.profilePhotoUrl ? (
                          <Image
                            alt={`Perfil de ${restaurant.name}`}
                            src={restaurant.profilePhotoUrl}
                            fill
                            unoptimized
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          restaurant.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="truncate text-sm font-bold text-gray-800 dark:text-slate-100">
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
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
          Platos destacados
        </h2>
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4">
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
                    <div className="relative flex h-[108px] items-center justify-center bg-orange-50 dark:bg-orange-500/10">
                      {discount ? (
                        <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                          <TagIcon className="h-3 w-3" />
                          -{discount.porcentaje}%
                        </span>
                      ) : null}
                      <span
                        title="Ver descripcion"
                        className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm ring-1 ring-slate-200 transition dark:bg-slate-950/90 dark:text-slate-200 dark:ring-slate-700"
                      >
                        <InformationCircleIcon className="h-4 w-4" />
                        <span className="sr-only">Ver descripcion</span>
                      </span>
                      {dish.imageUrl ? (
                        <Image
                          alt={dish.name}
                          src={dish.imageUrl}
                          width={320}
                          height={180}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm dark:bg-slate-950 dark:text-orange-300">
                          <ShoppingBagIcon className="h-8 w-8" />
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <span className="block truncate text-sm font-bold text-gray-800 dark:text-slate-100">
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
