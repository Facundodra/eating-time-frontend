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
  InformationCircleIcon,
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

type RestaurantSort = "calificacion-desc" | "calificacion-asc";
type RestaurantStatusFilter = "all" | "open" | "closed";
type DishSort =
  | ""
  | "precio-asc"
  | "precio-desc"
  | "ventas-desc"
  | "ventas-asc";

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

function parseOptionalNumber(value: string) {
  const parsed = Number(value);
  return value !== "" && !isNaN(parsed) ? parsed : undefined;
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

function getResultErrorMessage(result: PromiseSettledResult<unknown>) {
  if (result.status === "fulfilled") return null;

  return result.reason instanceof Error
    ? result.reason.message
    : "No se pudo cargar la busqueda.";
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
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-24 bg-gray-100 dark:bg-slate-800 sm:h-28 lg:h-36 xl:h-40" />
          <div className="space-y-2 p-2.5 sm:p-3 lg:p-4">
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
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
    >
      <div className="relative flex h-28 items-center justify-center bg-gray-50 dark:bg-slate-950">
        {restaurant.coverPhotoUrl ? (
          <Image
            alt={restaurant.name}
            src={restaurant.coverPhotoUrl}
            fill
            unoptimized
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <BuildingStorefrontIcon className="h-12 w-12 text-gray-300 dark:text-slate-700" />
        )}
        <span
          aria-label={restaurant.state ? "Abierto" : "Cerrado"}
          title={restaurant.state ? "Abierto" : "Cerrado"}
          className={clsx(
            "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
            restaurant.state
              ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
              : "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
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
      <div className="p-3">
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
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
    >
      <div className="relative flex h-24 items-center justify-center bg-orange-50 dark:bg-orange-500/10 sm:h-28 lg:h-36 xl:h-40">
        {discount ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm sm:left-3 sm:top-3 sm:text-xs lg:px-2.5 lg:py-1">
            <TagIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            -{discount.porcentaje}%
          </span>
        ) : null}
        <span
          title="Ver descripcion"
          className="absolute right-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm ring-1 ring-slate-200 transition group-hover:text-orange-700 dark:bg-slate-950/90 dark:text-slate-200 dark:ring-slate-700 dark:group-hover:text-orange-300 sm:right-3 sm:top-3 sm:h-7 sm:w-7 lg:h-8 lg:w-8"
        >
          <InformationCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="sr-only">Ver descripcion</span>
        </span>
        {dish.imageUrl ? (
          <Image
            alt={dish.name}
            src={dish.imageUrl}
            fill
            unoptimized
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <ShoppingBagIcon className="h-10 w-10 text-orange-300 dark:text-orange-500/50 sm:h-12 sm:w-12" />
        )}
      </div>
      <div className="p-2.5 sm:p-3 lg:p-4">
        <h3 className="line-clamp-1 text-xs font-bold text-slate-900 group-hover:text-orange-700 dark:text-slate-50 dark:group-hover:text-orange-400 sm:text-sm lg:line-clamp-2 lg:text-base">
          {dish.name}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 lg:mt-2">
          {discountedPrice != null ? (
            <>
              <span className="text-xs font-bold text-orange-700 dark:text-orange-400 sm:text-sm lg:text-base">
                {formatPrice(discountedPrice)}
              </span>
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(dish.price)}
              </span>
            </>
          ) : (
            <span className="text-xs font-bold text-orange-700 dark:text-orange-400 sm:text-sm lg:text-base">
              {formatPrice(dish.price)}
            </span>
          )}
        </div>
        {categoryNames.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5 lg:mt-3">
            {categoryNames.slice(0, 1).map((categoryName) => (
              <span
                key={`${dish.id}-${categoryName}`}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
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
      className="group block text-center"
    >
      <div className="relative mx-auto flex h-[64px] w-[88px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 sm:h-[72px] sm:w-[96px]">
        {category.imageUrl ? (
          <Image
            alt={category.name}
            src={category.imageUrl}
            fill
            unoptimized
            sizes="(min-width: 640px) 96px, 88px"
            className="scale-110 object-cover transition duration-200 group-hover:scale-125"
          />
        ) : (
          <Squares2X2Icon className="h-8 w-8 text-orange-300 dark:text-orange-500/50" />
        )}
      </div>
      <div className="mt-2">
        <h3 className="line-clamp-2 text-xs font-bold leading-snug text-slate-950 group-hover:text-orange-700 dark:text-slate-50 dark:group-hover:text-orange-400">
          {category.name}
        </h3>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
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
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
        selected
          ? "border-orange-600 bg-orange-600 text-white shadow-sm"
          : "border-gray-200 bg-white text-slate-700 shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-500 dark:hover:bg-orange-500/10 dark:hover:text-orange-400",
      )}
    >
      {category.imageUrl ? (
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <Image
            alt=""
            src={category.imageUrl}
            fill
            unoptimized
            sizes="32px"
            className="object-cover"
          />
        </span>
      ) : (
        <Squares2X2Icon className="h-4 w-4" />
      )}
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
  const [restaurantSort, setRestaurantSort] =
    useState<RestaurantSort>("calificacion-desc");
  const [restaurantStatus, setRestaurantStatus] =
    useState<RestaurantStatusFilter>("all");
  const [restaurantRatingMin, setRestaurantRatingMin] = useState("");
  const [restaurantRatingMax, setRestaurantRatingMax] = useState("");
  const [dishSort, setDishSort] = useState<DishSort>("");
  const [dishPriceMin, setDishPriceMin] = useState("");
  const [dishPriceMax, setDishPriceMax] = useState("");
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
        const restaurantDirection = restaurantSort.endsWith("asc")
          ? "asc"
          : "desc";
        const restaurantService =
          restaurantStatus === "open"
            ? "ACTIVO"
            : restaurantStatus === "closed"
              ? "INACTIVO"
              : undefined;
        const [dishOrder, dishDirection] = dishSort
          ? (dishSort.split("-") as ["precio" | "ventas", "asc" | "desc"])
          : [undefined, undefined];
        const [
          categoriesResult,
          restaurantResult,
          dishesResult,
          discountedIdsResult,
        ] = await Promise.allSettled([
          getClientDishCategorySummaries(),
          getRestaurants({
            nombre: appliedQuery.trim() || undefined,
            servicio: restaurantService,
            calificacionMin: parseOptionalNumber(restaurantRatingMin),
            calificacionMax: parseOptionalNumber(restaurantRatingMax),
            ordenarPor: "calificacion",
            direccion: restaurantDirection,
            page: 0,
            size: RESTAURANT_PAGE_SIZE,
          }),
          getDishes({
            categoriaId: selectedCategoryId ?? undefined,
            precioMin: parseOptionalNumber(dishPriceMin),
            precioMax: parseOptionalNumber(dishPriceMax),
            conDescuento: onlyDiscounted ? true : undefined,
            orden: dishOrder,
            sentido: dishDirection,
            tamano: DISH_FETCH_SIZE,
          }),
          getDiscountedDishIds(),
        ]);

        if (cancelled) return;

        const categories =
          categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
        const restaurants =
          restaurantResult.status === "fulfilled"
            ? restaurantResult.value.restaurants
            : [];
        const dishes =
          dishesResult.status === "fulfilled" ? dishesResult.value : [];
        const discountedIds =
          discountedIdsResult.status === "fulfilled"
            ? discountedIdsResult.value
            : new Set<number>();
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
          restaurants,
          dishes: filteredDishes,
          categories,
          discounts,
        });
        setError(
          categoriesResult.status === "rejected" &&
            restaurantResult.status === "rejected" &&
            dishesResult.status === "rejected"
            ? getResultErrorMessage(categoriesResult)
            : null,
        );
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
  }, [
    appliedQuery,
    dishPriceMax,
    dishPriceMin,
    dishSort,
    normalizedQuery,
    onlyDiscounted,
    restaurantRatingMax,
    restaurantRatingMin,
    restaurantSort,
    restaurantStatus,
    selectedCategoryId,
  ]);

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
  const exactQueryCategory = useMemo(
    () =>
      normalizedQuery
        ? searchData.categories.find(
            (category) => normalizeSearchText(category.name) === normalizedQuery,
          ) ?? null
        : null,
    [normalizedQuery, searchData.categories],
  );
  const selectedCategory = selectedCategoryId != null
    ? categoriesById.get(selectedCategoryId)
    : null;
  const selectedCategoryName = selectedCategory ?? exactQueryCategory?.name ?? null;
  const isCategorySearch = selectedCategoryId != null || exactQueryCategory != null;
  const resultCategories = isCategorySearch ? [] : matchedCategories;
  const totalResults =
    searchData.restaurants.length +
    searchData.dishes.length +
    resultCategories.length;
  const tabs: Array<{ id: SearchTab; label: string; count: number }> = [
    { id: "all", label: "Todo", count: totalResults },
    { id: "restaurants", label: "Locales", count: searchData.restaurants.length },
    { id: "dishes", label: "Platos", count: searchData.dishes.length },
    { id: "categories", label: "Categorías", count: resultCategories.length },
  ];
  const visibleTabs = isCategorySearch
    ? tabs.filter((tab) => tab.id !== "categories")
    : tabs;
  const shouldShowRestaurantsSection =
    activeTab === "restaurants" ||
    (activeTab === "all" &&
      (!isCategorySearch || searchData.restaurants.length > 0));
  const visibleCategories =
    activeTab === "categories" ? matchedCategories : resultCategories;
  const shouldShowCategoriesSection =
    activeTab === "categories" ||
    (activeTab === "all" && visibleCategories.length > 0);
  const hasActiveFilters =
    Boolean(appliedQuery) ||
    selectedCategoryId != null ||
    restaurantSort !== "calificacion-desc" ||
    restaurantStatus !== "all" ||
    restaurantRatingMin !== "" ||
    restaurantRatingMax !== "" ||
    dishSort !== "" ||
    dishPriceMin !== "" ||
    dishPriceMax !== "" ||
    onlyDiscounted;

  function updateUrl(nextQuery: string, nextTab: SearchTab = activeTab) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextTab !== "all") params.set("tab", nextTab);
    router.push(`/client/search${params.toString() ? `?${params}` : ""}`);
  }

  function changeTab(tab: SearchTab) {
    setActiveTab(tab);
    updateUrl(appliedQuery, tab);
  }

  function clearSearch() {
    setAppliedQuery("");
    setSelectedCategoryId(null);
    setRestaurantSort("calificacion-desc");
    setRestaurantStatus("all");
    setRestaurantRatingMin("");
    setRestaurantRatingMax("");
    setDishSort("");
    setDishPriceMin("");
    setDishPriceMax("");
    setOnlyDiscounted(false);
    setActiveTab("all");
    updateUrl("", "all");
  }

  function clearSelectedCategory() {
    setSelectedCategoryId(null);

    if (exactQueryCategory) {
      setAppliedQuery("");
      updateUrl("", activeTab);
    }
  }

  function resetCategoriesView() {
    setAppliedQuery("");
    setSelectedCategoryId(null);
    setRestaurantSort("calificacion-desc");
    setRestaurantStatus("all");
    setRestaurantRatingMin("");
    setRestaurantRatingMax("");
    setDishSort("");
    setDishPriceMin("");
    setDishPriceMax("");
    setOnlyDiscounted(false);
    setActiveTab("categories");
    updateUrl("", "categories");
  }

  function selectCategory(categoryId: number) {
    setSelectedCategoryId((current) =>
      current === categoryId ? null : categoryId,
    );
    setActiveTab("dishes");
    updateUrl(appliedQuery, "dishes");
  }

  function backToAllResults() {
    setActiveTab("all");
    updateUrl(appliedQuery, "all");
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      {activeTab !== "categories" ? (
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
                ? "max-h-[760px] opacity-100"
                : "max-h-0 border-transparent opacity-0",
            )}
          >
            <div className="space-y-5 p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    <BuildingStorefrontIcon className="h-4 w-4" />
                    Locales
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={restaurantSort}
                      onChange={(event) =>
                        setRestaurantSort(event.target.value as RestaurantSort)
                      }
                      className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-orange-300 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="calificacion-desc">Mejor calificacion</option>
                      <option value="calificacion-asc">Menor calificacion</option>
                    </select>
                    <select
                      value={restaurantStatus}
                      onChange={(event) =>
                        setRestaurantStatus(
                          event.target.value as RestaurantStatusFilter,
                        )
                      }
                      className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-orange-300 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="all">Todos</option>
                      <option value="open">Abiertos</option>
                      <option value="closed">Cerrados</option>
                    </select>
                    <div className="flex items-center gap-1.5">
                      <StarIcon className="h-4 w-4 text-orange-500" />
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={restaurantRatingMin}
                        onChange={(event) =>
                          setRestaurantRatingMin(event.target.value)
                        }
                        placeholder="min"
                        className="w-20 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-orange-300 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={restaurantRatingMax}
                        onChange={(event) =>
                          setRestaurantRatingMax(event.target.value)
                        }
                        placeholder="max"
                        className="w-20 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-orange-300 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    <ShoppingBagIcon className="h-4 w-4" />
                    Platos
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={dishSort}
                      onChange={(event) =>
                        setDishSort(event.target.value as DishSort)
                      }
                      className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-orange-300 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="">Por defecto</option>
                      <option value="precio-asc">Precio menor</option>
                      <option value="precio-desc">Precio mayor</option>
                      <option value="ventas-desc">Mas vendidos</option>
                      <option value="ventas-asc">Menos vendidos</option>
                    </select>
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
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={dishPriceMin}
                        onChange={(event) => setDishPriceMin(event.target.value)}
                        placeholder="min"
                        className="w-20 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-orange-300 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        min={0}
                        value={dishPriceMax}
                        onChange={(event) => setDishPriceMax(event.target.value)}
                        placeholder="max"
                        className="w-20 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-orange-300 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                    {selectedCategoryName ? (
                      <button
                        type="button"
                        onClick={clearSelectedCategory}
                        className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm transition hover:border-orange-400 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"
                      >
                        {selectedCategoryName}
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Limpiar
                </button>
              ) : null}

              <div className="flex gap-2 overflow-x-auto pb-1">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => changeTab(tab.id)}
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
                      selected={
                        selectedCategoryId === category.id ||
                        exactQueryCategory?.id === category.id
                      }
                      onClick={() => selectCategory(category.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <EmptyState message={error} />
      ) : loading ? (
        <SearchCardSkeleton />
      ) : totalResults === 0 ? (
        <EmptyState message="No hay resultados para esta búsqueda." />
      ) : (
        <div className="space-y-10">
          {activeTab !== "all" && activeTab !== "categories" ? (
            <button
              type="button"
              onClick={backToAllResults}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver a todo
            </button>
          ) : null}

          {shouldShowRestaurantsSection && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Locales
                </h2>
                {activeTab === "all" && searchData.restaurants.length > 8 ? (
                  <button
                    type="button"
                    onClick={() => changeTab("restaurants")}
                    className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50 dark:border-orange-500/30 dark:bg-slate-900 dark:text-orange-400 dark:hover:bg-orange-500/10"
                  >
                    Ver todos
                  </button>
                ) : null}
              </div>
              {searchData.restaurants.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
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
                {activeTab === "all" && searchData.dishes.length > 8 ? (
                  <button
                    type="button"
                    onClick={() => changeTab("dishes")}
                    className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50 dark:border-orange-500/30 dark:bg-slate-900 dark:text-orange-400 dark:hover:bg-orange-500/10"
                  >
                    Ver todos
                  </button>
                ) : null}
              </div>
              {searchData.dishes.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5">
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

          {shouldShowCategoriesSection && (
            <section
              className={clsx(
                "space-y-5",
                activeTab === "categories" && "-mt-2",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  className={clsx(
                    "font-black text-slate-950 dark:text-white",
                    activeTab === "categories" ? "text-2xl" : "text-lg",
                  )}
                >
                  {activeTab === "categories" ? "Comidas" : "Categorías"}
                </h2>
                {activeTab === "categories" && hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetCategoriesView}
                    className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-900 transition hover:bg-orange-100 hover:text-orange-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
                  >
                    Restablecer
                  </button>
                ) : null}
              </div>
              {visibleCategories.length > 0 ? (
                <div className="grid grid-cols-3 gap-x-3 gap-y-5 min-[420px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                  {visibleCategories.map((category) => (
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
