"use client";

import clsx from "clsx";
import {
  ArrowLeftIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  ShoppingBagIcon,
  StarIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  ClientDish,
  ClientDishCategorySummary,
  Discount,
  RestaurantList,
} from "@/lib/client/types";
import {
  getAllDishes,
  getAllRestaurants,
  getClientDishCategorySummaries,
  getDishDiscount,
  getDiscountedDishIds,
} from "@/services/client/client-service";
import CategoryCarousel from "@/ui/client/categories/category-carousel";

const FETCH_SIZE = 120;

type DishSort = "ventas-desc" | "precio-asc" | "precio-desc" | "nombre-asc";
type RestaurantStatusFilter = "all" | "open" | "closed";

function parseOptionalNumber(value: string) {
  const parsed = Number(value);
  return value !== "" && !isNaN(parsed) ? parsed : undefined;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(value);
}

function getDiscountedPrice(price: number, discount?: Discount) {
  if (!discount) return null;
  return Math.round(price * (1 - discount.porcentaje / 100));
}

function formatRating(value: number) {
  return value > 0 ? value.toFixed(1) : "-";
}

function getRestaurantCoverUrl(restaurant: RestaurantList) {
  return (
    restaurant.coverPhotoDesktopUrl ||
    restaurant.coverPhotoUrl ||
    restaurant.coverPhotoMobileUrl
  );
}

function getDishSortParams(sort: DishSort) {
  if (sort === "nombre-asc") return {};
  const [order, direction] = sort.split("-") as [
    "ventas" | "precio",
    "asc" | "desc",
  ];

  return { orden: order, sentido: direction };
}

function sortDishes(dishes: ClientDish[], sort: DishSort) {
  if (sort === "precio-asc") {
    return [...dishes].sort((left, right) => {
      const comparison = left.price - right.price;
      return comparison !== 0 ? comparison : left.name.localeCompare(right.name, "es");
    });
  }

  if (sort === "precio-desc") {
    return [...dishes].sort((left, right) => {
      const comparison = right.price - left.price;
      return comparison !== 0 ? comparison : left.name.localeCompare(right.name, "es");
    });
  }

  if (sort !== "nombre-asc") return dishes;

  return [...dishes].sort((left, right) => left.name.localeCompare(right.name, "es"));
}

function sortRestaurantsByDishes(
  restaurants: RestaurantList[],
  dishesByRestaurantId: Map<number, ClientDish[]>,
  sort: DishSort,
) {
  return [...restaurants].sort((left, right) => {
    if (sort === "nombre-asc") {
      return left.name.localeCompare(right.name, "es");
    }

    if (sort === "precio-asc" || sort === "precio-desc") {
      const leftPrice = dishesByRestaurantId.get(left.id)?.[0]?.price ?? 0;
      const rightPrice = dishesByRestaurantId.get(right.id)?.[0]?.price ?? 0;
      const comparison =
        sort === "precio-asc" ? leftPrice - rightPrice : rightPrice - leftPrice;

      if (comparison !== 0) return comparison;
      return left.name.localeCompare(right.name, "es");
    }

    return 0;
  });
}

function PageSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, rowIndex) => (
        <section key={rowIndex} className="animate-pulse space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-52 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, dishIndex) => (
              <div
                key={dishIndex}
                className="h-36 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        No hay platos para estos filtros.
      </p>
    </div>
  );
}

function RestaurantAvatar({ restaurant }: { restaurant: RestaurantList }) {
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-orange-100 bg-orange-50 text-sm font-black text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
      {restaurant.profilePhotoUrl ? (
        <Image
          alt={`Perfil de ${restaurant.name}`}
          src={restaurant.profilePhotoUrl}
          fill
          unoptimized
          sizes="44px"
          className="object-cover"
        />
      ) : (
        restaurant.name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function DishResultCard({
  dish,
  discount,
}: {
  dish: ClientDish;
  discount?: Discount;
}) {
  const discountedPrice = getDiscountedPrice(dish.price, discount);

  return (
    <Link
      href={`/client/restaurant/${dish.localId}?dishId=${dish.id}`}
      className="group flex min-h-36 gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-orange-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
    >
      <div className="relative flex h-28 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-50 dark:bg-orange-500/10">
        {discount ? (
          <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs font-black text-white shadow-sm">
            <TagIcon className="h-3 w-3" />
            -{discount.porcentaje}%
          </span>
        ) : null}
        {dish.imageUrl ? (
          <Image
            alt={dish.name}
            src={dish.imageUrl}
            fill
            unoptimized
            sizes="128px"
            className="object-cover transition duration-200 group-hover:scale-105"
          />
        ) : (
          <ShoppingBagIcon className="h-10 w-10 text-orange-300 dark:text-orange-500/60" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-orange-700 dark:text-slate-50 dark:group-hover:text-orange-300">
            {dish.name}
          </h3>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-black text-orange-700 dark:text-orange-300">
            {formatPrice(discountedPrice ?? dish.price)}
          </span>
          {discountedPrice != null ? (
            <span className="text-sm font-bold text-slate-400 line-through dark:text-slate-500">
              {formatPrice(dish.price)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function RestaurantDishRow({
  restaurant,
  dishes,
  discounts,
}: {
  restaurant: RestaurantList;
  dishes: ClientDish[];
  discounts: Map<number, Discount>;
}) {
  const coverPhotoUrl = getRestaurantCoverUrl(restaurant);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const carousel = carouselRef.current;
    if (!carousel) return;

    setCanScrollLeft(carousel.scrollLeft > 0);
    setCanScrollRight(
      carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 1,
    );
  }

  useEffect(() => {
    updateScrollState();
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      carousel.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [dishes]);

  function scrollCarousel(direction: "left" | "right") {
    carouselRef.current?.scrollBy({
      left: direction === "left" ? -520 : 520,
      behavior: "smooth",
    });
  }

  return (
    <section className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/client/restaurant/${restaurant.id}`}
          className="group flex min-w-0 items-center gap-3"
        >
          <RestaurantAvatar restaurant={restaurant} />
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-slate-950 group-hover:text-orange-700 dark:text-white dark:group-hover:text-orange-300">
              {restaurant.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black",
                  restaurant.state
                    ? "bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-200"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {restaurant.state ? (
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                ) : (
                  <MoonIcon className="h-3.5 w-3.5" />
                )}
                {restaurant.state ? "Abierto" : "Cerrado"}
              </span>
              <span className="inline-flex items-center gap-1">
                <StarIcon className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                {formatRating(restaurant.stars)}
              </span>
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-4">
          <Link
            href={`/client/restaurant/${restaurant.id}`}
            className="hidden text-sm font-black text-orange-700 transition hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200 sm:inline"
          >
            Ir a la tienda
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Ver platos anteriores"
              disabled={!canScrollLeft}
              onClick={() => scrollCarousel("left")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:disabled:text-slate-700"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Ver más platos"
              disabled={!canScrollRight}
              onClick={() => scrollCarousel("right")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:disabled:text-slate-700"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {coverPhotoUrl ? null : (
        <div className="sr-only">Local sin portada disponible</div>
      )}

      <div
        ref={carouselRef}
        className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
      >
        {dishes.slice(0, 6).map((dish) => (
          <div key={dish.id} className="w-[30rem] max-w-[82vw] shrink-0 snap-start">
            <DishResultCard dish={dish} discount={discounts.get(dish.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}

type ClientDishesByRestaurantPageProps = {
  initialCategoryId?: number | null;
  initialQuery?: string;
};

export default function ClientDishesByRestaurantPage({
  initialCategoryId = null,
  initialQuery = "",
}: ClientDishesByRestaurantPageProps) {
  const [restaurants, setRestaurants] = useState<RestaurantList[]>([]);
  const [categories, setCategories] = useState<ClientDishCategorySummary[]>([]);
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [discounts, setDiscounts] = useState<Map<number, Discount>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<DishSort>("ventas-desc");
  const [status, setStatus] = useState<RestaurantStatusFilter>("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategoryId,
  );
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const hasActiveFilters =
    Boolean(query) ||
    status !== "all" ||
    priceMin !== "" ||
    priceMax !== "" ||
    discountOnly ||
    selectedCategoryId != null;

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setPriceMin("");
    setPriceMax("");
    setDiscountOnly(false);
    setSelectedCategoryId(null);
  }

  useEffect(() => {
    setSelectedCategoryId(initialCategoryId);
  }, [initialCategoryId]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const dishSortParams = getDishSortParams(sort);
        const [restaurantsData, dishesData, discountedIds] = await Promise.all([
          getAllRestaurants({}, FETCH_SIZE),
          getAllDishes(
            {
              categoriaId: selectedCategoryId ?? undefined,
              precioMin: parseOptionalNumber(priceMin),
              precioMax: parseOptionalNumber(priceMax),
              ...dishSortParams,
            },
            FETCH_SIZE,
          ),
          getDiscountedDishIds(),
        ]);

        if (cancelled) return;

        const normalizedQuery = normalizeSearchText(query);
        const restaurantsById = new Map(
          restaurantsData.map((restaurant) => [restaurant.id, restaurant]),
        );
        const candidateDishes = sortDishes(dishesData, sort).filter((dish) => {
          const restaurant = restaurantsById.get(dish.localId);
          if (!restaurant) return false;
          if (status === "open" && !restaurant.state) return false;
          if (status === "closed" && restaurant.state) return false;
          if (!normalizedQuery) return true;

          return normalizeSearchText(`${dish.name} ${restaurant.name}`).includes(
            normalizedQuery,
          );
        });
        const discountIdsToFetch = candidateDishes
          .map((dish) => dish.id)
          .filter((dishId) => discountedIds.has(dishId));
        const discountResults = await Promise.allSettled(
          discountIdsToFetch.map(getDishDiscount),
        );

        if (cancelled) return;

        const nextDiscounts = new Map<number, Discount>();
        discountResults.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            nextDiscounts.set(discountIdsToFetch[index], result.value);
          }
        });
        const filteredDishes = discountOnly
          ? candidateDishes.filter((dish) => nextDiscounts.has(dish.id))
          : candidateDishes;
        const restaurantIdsWithDishes = new Set(
          filteredDishes.map((dish) => dish.localId),
        );

        setRestaurants(
          restaurantsData.filter((restaurant) =>
            restaurantIdsWithDishes.has(restaurant.id),
          ),
        );
        setDishes(filteredDishes);
        setDiscounts(nextDiscounts);
      } catch (err) {
        if (!cancelled) {
          setRestaurants([]);
          setDishes([]);
          setDiscounts(new Map());
          setError(
            err instanceof Error ? err.message : "No se pudieron cargar los platos.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [discountOnly, priceMax, priceMin, query, selectedCategoryId, sort, status]);

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

  const dishesByRestaurantId = useMemo(() => {
    const next = new Map<number, ClientDish[]>();

    dishes.forEach((dish) => {
      const restaurantDishes = next.get(dish.localId) ?? [];
      restaurantDishes.push(dish);
      next.set(dish.localId, restaurantDishes);
    });

    return next;
  }, [dishes]);
  const orderedRestaurants = useMemo(
    () => sortRestaurantsByDishes(restaurants, dishesByRestaurantId, sort),
    [dishesByRestaurantId, restaurants, sort],
  );

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
              <label htmlFor="client-dishes-sort-mobile" className="sr-only">
                Orden
              </label>
              <select
                id="client-dishes-sort-mobile"
                value={sort}
                onChange={(event) => setSort(event.target.value as DishSort)}
                className="h-11 w-[125px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="ventas-desc">Más vendidos</option>
                <option value="precio-asc">Precio menor</option>
                <option value="precio-desc">Precio mayor</option>
                <option value="nombre-asc">A-Z</option>
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
                      Ajusta el listado de platos visible.
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
                  <label htmlFor="client-dishes-search-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Nombre
                    </span>
                    <input
                      id="client-dishes-search-mobile"
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar plato o local"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                    />
                  </label>

                  <label htmlFor="client-dishes-status-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Disponibilidad
                    </span>
                    <select
                      id="client-dishes-status-mobile"
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

                  <button
                    type="button"
                    onClick={() => setDiscountOnly((current) => !current)}
                    aria-pressed={discountOnly}
                    className={clsx(
                      "flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold transition",
                      discountOnly
                        ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-500/60 dark:bg-orange-500/15 dark:text-orange-300"
                        : "border-gray-200 bg-white text-slate-600 hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-orange-500/30 dark:hover:text-orange-400",
                    )}
                  >
                    <TagIcon className="h-4 w-4" />
                    Con descuento
                  </button>
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

        <div className="hidden gap-5 xl:grid xl:grid-cols-[minmax(16rem,1fr)_auto_auto_auto_auto] xl:items-center">
          <label className="relative min-w-0">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar plato o local"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>

          <div className="flex min-w-0 items-center gap-2">
            <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <select
              aria-label="Ordenar platos"
              value={sort}
              onChange={(event) => setSort(event.target.value as DishSort)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="ventas-desc">Más vendidos</option>
              <option value="precio-asc">Precio menor</option>
              <option value="precio-desc">Precio mayor</option>
              <option value="nombre-asc">A-Z</option>
            </select>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <select
              aria-label="Filtrar por disponibilidad del local"
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

          <button
            type="button"
            onClick={() => setDiscountOnly((current) => !current)}
            aria-pressed={discountOnly}
            className={clsx(
              "flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-extrabold transition",
              discountOnly
                ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-500/60 dark:bg-orange-500/15 dark:text-orange-300"
                : "border-gray-200 bg-white text-slate-600 hover:border-orange-200 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-500/30 dark:hover:text-orange-400",
            )}
          >
            <TagIcon className="h-4 w-4" />
            Con descuento
          </button>
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
        <PageSkeleton />
      ) : orderedRestaurants.length > 0 ? (
        <div className="space-y-8">
          {orderedRestaurants.map((restaurant) => (
            <RestaurantDishRow
              key={restaurant.id}
              restaurant={restaurant}
              dishes={dishesByRestaurantId.get(restaurant.id) ?? []}
              discounts={discounts}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </main>
  );
}
