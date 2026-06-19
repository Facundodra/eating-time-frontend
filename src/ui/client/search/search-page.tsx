"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  StarIcon,
  TagIcon,
  XMarkIcon,
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
  ClientDishCategory,
  ClientDishCategorySummary,
  Discount,
  RestaurantList,
} from "@/lib/client/types";

const RESTAURANT_PAGE_SIZE = 24;
const DISH_FETCH_SIZE = 100;
const DISH_RESULT_LIMIT = 24;

type SearchTab = "all" | "restaurants" | "dishes" | "categories";

type SearchPageProps = {
  initialQuery?: string;
  initialTab?: SearchTab;
};

type SearchData = {
  restaurants: RestaurantList[];
  dishes: ClientDish[];
  categories: ClientDishCategorySummary[];
  discounts: Map<number, Discount>;
};

const emptySearchData: SearchData = {
  restaurants: [],
  dishes: [],
  categories: [],
  discounts: new Map(),
};

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

function formatDishCount(count: number) {
  if (count === 0) return "Sin platos";
  if (count === 1) return "1 plato";
  return `${count} platos`;
}

function doesDishMatchQuery(
  dish: ClientDish,
  query: string,
  categoriesById: Map<number, string>,
) {
  if (!query) return true;

  const categoryText = dish.categories
    .map((categoryId) => categoriesById.get(categoryId) ?? "")
    .join(" ");
  const searchableText = `${dish.name} ${dish.description} ${categoryText}`;

  return normalizeSearchText(searchableText).includes(query);
}

function SearchCardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-36 bg-gray-100 dark:bg-slate-800" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
            <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        {message}
      </p>
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: RestaurantList }) {
  return (
    <Link
      href={`/client/restaurant/${restaurant.id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
    >
      <div className="relative flex h-36 items-center justify-center bg-gray-50 dark:bg-slate-950">
        {restaurant.coverPhotoUrl ? (
          <Image
            alt={restaurant.name}
            src={restaurant.coverPhotoUrl}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <BuildingStorefrontIcon className="h-12 w-12 text-gray-300 dark:text-slate-700" />
        )}
        <span
          className={clsx(
            "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
            restaurant.state
              ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
              : "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
          )}
        >
          {restaurant.state ? (
            <>
              <CheckCircleIcon className="h-4 w-4" />
              Abierto
            </>
          ) : (
            <>
              <MoonIcon className="h-4 w-4" />
              Cerrado
            </>
          )}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-100 bg-orange-50 text-sm font-black text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
            {restaurant.profilePhotoUrl ? (
              <Image
                alt={`Perfil de ${restaurant.name}`}
                src={restaurant.profilePhotoUrl}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              restaurant.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-orange-700 dark:text-slate-50 dark:group-hover:text-orange-400">
              {restaurant.name}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <StarIcon className="h-4 w-4 text-orange-400" />
              <span>{restaurant.stars || "Sin calificación"}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DishCard({
  dish,
  categoriesById,
  discount,
}: {
  dish: ClientDish;
  categoriesById: Map<number, string>;
  discount?: Discount;
}) {
  const categoryNames = dish.categories
    .map((categoryId) => categoriesById.get(categoryId))
    .filter((categoryName): categoryName is string => Boolean(categoryName));
  const discountedPrice = getDiscountedPrice(dish.price, discount);

  return (
    <Link
      href={`/client/platos/${dish.id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
    >
      <div className="relative flex h-36 items-center justify-center bg-orange-50 dark:bg-orange-500/10">
        {discount ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <TagIcon className="h-3.5 w-3.5" />
            -{discount.porcentaje}%
          </span>
        ) : null}
        {dish.imageUrl ? (
          <img
            alt={dish.name}
            src={dish.imageUrl}
            className="h-full w-full object-cover"
          />
        ) : (
          <ShoppingBagIcon className="h-12 w-12 text-orange-300 dark:text-orange-500/50" />
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-orange-700 dark:text-slate-50 dark:group-hover:text-orange-400">
          {dish.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          {discountedPrice != null ? (
            <>
              <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                {formatPrice(discountedPrice)}
              </span>
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(dish.price)}
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
              {formatPrice(dish.price)}
            </span>
          )}
        </div>
        {categoryNames.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categoryNames.slice(0, 2).map((categoryName) => (
              <span
                key={`${dish.id}-${categoryName}`}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              >
                {categoryName}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function CategoryCard({ category }: { category: ClientDishCategorySummary }) {
  return (
    <Link
      href={`/client/search?q=${encodeURIComponent(category.name)}&tab=dishes`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
    >
      <div className="relative flex h-36 items-center justify-center bg-orange-50 dark:bg-orange-500/10">
        {category.imageUrl ? (
          <Image
            alt={category.name}
            src={category.imageUrl}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-200 group-hover:scale-105"
          />
        ) : (
          <Squares2X2Icon className="h-12 w-12 text-orange-300 dark:text-orange-500/50" />
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-orange-700 dark:text-slate-50 dark:group-hover:text-orange-400">
          {category.name}
        </h3>
        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {formatDishCount(category.dishCount)}
        </p>
      </div>
    </Link>
  );
}

function CategoryButton({
  category,
  selected,
  onClick,
}: {
  category: ClientDishCategory;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
        selected
          ? "border-orange-600 bg-orange-600 text-white shadow-sm"
          : "border-gray-200 bg-white text-slate-700 shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-500 dark:hover:bg-orange-500/10 dark:hover:text-orange-400",
      )}
    >
      <Squares2X2Icon className="h-4 w-4" />
      {category.name}
    </button>
  );
}

export default function SearchPage({
  initialQuery = "",
  initialTab = "all",
}: SearchPageProps) {
  const router = useRouter();
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(true);
  const [searchData, setSearchData] = useState<SearchData>(emptySearchData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAppliedQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    function handleFiltersToggle() {
      setFiltersPanelOpen((value) => !value);
    }

    window.addEventListener("client-search-filters-toggle", handleFiltersToggle);

    return () => {
      window.removeEventListener(
        "client-search-filters-toggle",
        handleFiltersToggle,
      );
    };
  }, []);

  const normalizedQuery = normalizeSearchText(appliedQuery);

  useEffect(() => {
    let cancelled = false;

    async function loadSearchData() {
      setLoading(true);
      setError(null);

      try {
        const [categories, restaurantResult, dishes, discountedIds] =
          await Promise.all([
            getClientDishCategorySummaries(),
            getRestaurants({
              nombre: appliedQuery.trim() || undefined,
              servicio: onlyOpen ? "ACTIVO" : undefined,
              ordenarPor: "calificacion",
              direccion: "desc",
              page: 0,
              size: RESTAURANT_PAGE_SIZE,
            }),
            getDishes({
              conDescuento: onlyDiscounted ? true : undefined,
              tamano: DISH_FETCH_SIZE,
            }),
            getDiscountedDishIds(),
          ]);

        if (cancelled) return;

        const categoriesById = new Map(
          categories.map((category) => [category.id, category.name]),
        );
        const filteredDishes = dishes
          .filter((dish) =>
            doesDishMatchQuery(dish, normalizedQuery, categoriesById),
          )
          .filter((dish) =>
            selectedCategoryId == null
              ? true
              : dish.categories.includes(selectedCategoryId),
          )
          .slice(0, DISH_RESULT_LIMIT);
        const discountIdsToFetch = filteredDishes
          .map((dish) => dish.id)
          .filter((dishId) => discountedIds.has(dishId));
        const discountResults = await Promise.allSettled(
          discountIdsToFetch.map(getDishDiscount),
        );

        if (cancelled) return;

        const discounts = new Map<number, Discount>();
        discountResults.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            discounts.set(discountIdsToFetch[index], result.value);
          }
        });

        setSearchData({
          restaurants: restaurantResult.restaurants,
          dishes: filteredDishes,
          categories,
          discounts,
        });
      } catch (err) {
        if (cancelled) return;
        setSearchData(emptySearchData);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la búsqueda.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSearchData();

    return () => {
      cancelled = true;
    };
  }, [appliedQuery, normalizedQuery, onlyDiscounted, onlyOpen, selectedCategoryId]);

  const categoriesById = useMemo(
    () =>
      new Map(
        searchData.categories.map((category) => [category.id, category.name]),
      ),
    [searchData.categories],
  );
  const matchedCategories = useMemo(
    () =>
      searchData.categories.filter((category) =>
        normalizedQuery
          ? normalizeSearchText(category.name).includes(normalizedQuery)
          : true,
      ),
    [normalizedQuery, searchData.categories],
  );
  const selectedCategory = selectedCategoryId
    ? categoriesById.get(selectedCategoryId)
    : null;
  const totalResults =
    searchData.restaurants.length +
    searchData.dishes.length +
    matchedCategories.length;
  const tabs: Array<{ id: SearchTab; label: string; count: number }> = [
    { id: "all", label: "Todo", count: totalResults },
    { id: "restaurants", label: "Locales", count: searchData.restaurants.length },
    { id: "dishes", label: "Platos", count: searchData.dishes.length },
    { id: "categories", label: "Categorías", count: matchedCategories.length },
  ];

  function updateUrl(nextQuery: string) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    router.push(`/client/search${params.toString() ? `?${params}` : ""}`);
  }

  function clearSearch() {
    setAppliedQuery("");
    setSelectedCategoryId(null);
    setOnlyOpen(false);
    setOnlyDiscounted(false);
    setActiveTab("all");
    updateUrl("");
  }

  function selectCategory(categoryId: number) {
    setSelectedCategoryId((current) =>
      current === categoryId ? null : categoryId,
    );
    setActiveTab("dishes");
  }

  function backToAllResults() {
    setActiveTab("all");
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      <section className="space-y-4">
        <button
          type="button"
          aria-expanded={filtersPanelOpen}
          onClick={() => setFiltersPanelOpen((value) => !value)}
          className="mx-auto flex items-center gap-3 rounded-full px-4 py-1 text-xs font-bold text-slate-500 transition hover:text-orange-700 dark:text-slate-400 dark:hover:text-orange-400 md:hidden"
        >
          Filtros de búsqueda
          <AdjustmentsHorizontalIcon className="h-6 w-6" />
        </button>

        <div
          className={clsx(
            "overflow-hidden rounded-xl border border-orange-100 bg-orange-50/40 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/80",
            filtersPanelOpen
              ? "max-h-[420px] opacity-100"
              : "max-h-0 border-transparent opacity-0",
          )}
        >
          <div className="space-y-5 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyOpen((value) => !value)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  onlyOpen
                    ? "border-green-600 bg-green-600 text-white shadow-sm"
                    : "border-gray-200 bg-white text-slate-700 shadow-sm hover:border-green-300 hover:bg-green-50 hover:text-green-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-green-500/10",
                )}
              >
                <CheckCircleIcon className="h-4 w-4" />
                Abiertos
              </button>
              <button
                type="button"
                onClick={() => setOnlyDiscounted((value) => !value)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  onlyDiscounted
                    ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                    : "border-gray-200 bg-white text-slate-700 shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-orange-500/10",
                )}
              >
                <TagIcon className="h-4 w-4" />
                Con descuento
              </button>
              {selectedCategory ? (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm transition hover:border-orange-400 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"
                >
                  {selectedCategory}
                  <XMarkIcon className="h-4 w-4" />
                </button>
              ) : null}
              {appliedQuery || selectedCategoryId || onlyOpen || onlyDiscounted ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Limpiar
                </button>
              ) : null}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition",
                    activeTab === tab.id
                      ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                      : "border-gray-200 bg-white text-slate-600 shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-orange-500/10",
                  )}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {matchedCategories.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {matchedCategories.map((category) => (
                  <CategoryButton
                    key={category.id}
                    category={category}
                    selected={selectedCategoryId === category.id}
                    onClick={() => selectCategory(category.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {error ? (
        <EmptyState message={error} />
      ) : loading ? (
        <SearchCardSkeleton />
      ) : totalResults === 0 ? (
        <EmptyState message="No hay resultados para esta búsqueda." />
      ) : (
        <div className="space-y-10">
          {activeTab !== "all" ? (
            <button
              type="button"
              onClick={backToAllResults}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver a todo
            </button>
          ) : null}

          {(activeTab === "all" || activeTab === "restaurants") && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Locales
                </h2>
                {activeTab === "all" && searchData.restaurants.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("restaurants")}
                    className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50 dark:border-orange-500/30 dark:bg-slate-900 dark:text-orange-400 dark:hover:bg-orange-500/10"
                  >
                    Ver todos
                  </button>
                ) : null}
              </div>
              {searchData.restaurants.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {searchData.restaurants
                    .slice(0, activeTab === "all" ? 8 : RESTAURANT_PAGE_SIZE)
                    .map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                      />
                    ))}
                </div>
              ) : (
                <EmptyState message="No hay locales para estos filtros." />
              )}
            </section>
          )}

          {(activeTab === "all" || activeTab === "dishes") && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Platos
                </h2>
                {activeTab === "all" && searchData.dishes.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("dishes")}
                    className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50 dark:border-orange-500/30 dark:bg-slate-900 dark:text-orange-400 dark:hover:bg-orange-500/10"
                  >
                    Ver todos
                  </button>
                ) : null}
              </div>
              {searchData.dishes.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {searchData.dishes
                    .slice(0, activeTab === "all" ? 8 : DISH_RESULT_LIMIT)
                    .map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        categoriesById={categoriesById}
                        discount={searchData.discounts.get(dish.id)}
                      />
                    ))}
                </div>
              ) : (
                <EmptyState message="No hay platos para estos filtros." />
              )}
            </section>
          )}

          {(activeTab === "all" || activeTab === "categories") && (
            <section className="space-y-4">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Categorías
              </h2>
              {matchedCategories.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {matchedCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No hay categorías para esta búsqueda." />
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
