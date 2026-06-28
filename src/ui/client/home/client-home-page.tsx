"use client";

import {
  type ComponentType,
  type SVGProps,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  BuildingStorefrontIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

import {
  getAllDishes,
  getAllRestaurants,
  getClientDishCategorySummaries,
  getDiscountedDishIds,
} from "@/services/client/client-service";
import type {
  ClientDish,
  ClientDishCategorySummary,
  RestaurantList,
} from "@/lib/client/types";
import CategoryCarousel from "@/ui/client/categories/category-carousel";
import { RestaurantCompactCard } from "@/ui/client/restaurants/restaurant-compact-card";

const HOME_SECTION_ITEM_COUNT = 10;
const HOME_FETCH_SIZE = 100;

type HomeRestaurantRankings = {
  bestRated: RestaurantList[];
  popular: RestaurantList[];
  discounted: RestaurantList[];
  affordable: RestaurantList[];
  variety: RestaurantList[];
};

const emptyRestaurantRankings: HomeRestaurantRankings = {
  bestRated: [],
  popular: [],
  discounted: [],
  affordable: [],
  variety: [],
};

function RestaurantCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[1.86/1] rounded-xl bg-gray-100 dark:bg-slate-800" />
      <div className="mt-2.5 flex items-start gap-2">
        <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-slate-700" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

function getRestaurantCountMap(dishes: ClientDish[]) {
  return dishes.reduce((map, dish) => {
    map.set(dish.localId, (map.get(dish.localId) ?? 0) + 1);
    return map;
  }, new Map<number, number>());
}

function getRestaurantSalesMap(dishes: ClientDish[]) {
  return dishes.reduce((map, dish) => {
    map.set(dish.localId, (map.get(dish.localId) ?? 0) + dish.salesCount);
    return map;
  }, new Map<number, number>());
}

function getDiscountedDishCountMap(
  dishes: ClientDish[],
  discountedDishIds: Set<number>,
) {
  return dishes.reduce((map, dish) => {
    if (!discountedDishIds.has(dish.id)) return map;
    map.set(dish.localId, (map.get(dish.localId) ?? 0) + 1);
    return map;
  }, new Map<number, number>());
}

function getRestaurantMinPriceMap(dishes: ClientDish[]) {
  return dishes.reduce((map, dish) => {
    const currentPrice = map.get(dish.localId);
    if (currentPrice == null || dish.price < currentPrice) {
      map.set(dish.localId, dish.price);
    }
    return map;
  }, new Map<number, number>());
}

function compareByRating(left: RestaurantList, right: RestaurantList) {
  const ratingComparison = right.stars - left.stars;
  if (ratingComparison !== 0) return ratingComparison;
  return left.name.localeCompare(right.name, "es");
}

function getTopRestaurants(
  restaurants: RestaurantList[],
  compare: (left: RestaurantList, right: RestaurantList) => number,
) {
  return [...restaurants].sort(compare).slice(0, HOME_SECTION_ITEM_COUNT);
}

function buildRestaurantRankings(
  restaurants: RestaurantList[],
  dishes: ClientDish[],
  discountedDishIds: Set<number>,
): HomeRestaurantRankings {
  const salesByRestaurant = getRestaurantSalesMap(dishes);
  const dishesByRestaurant = getRestaurantCountMap(dishes);
  const minPriceByRestaurant = getRestaurantMinPriceMap(dishes);
  const discountedDishesByRestaurant = getDiscountedDishCountMap(
    dishes,
    discountedDishIds,
  );

  return {
    bestRated: getTopRestaurants(restaurants, compareByRating),
    popular: getTopRestaurants(
      restaurants.filter(
        (restaurant) => (salesByRestaurant.get(restaurant.id) ?? 0) > 0,
      ),
      (left, right) => {
        const salesComparison =
          (salesByRestaurant.get(right.id) ?? 0) -
          (salesByRestaurant.get(left.id) ?? 0);
        if (salesComparison !== 0) return salesComparison;
        return compareByRating(left, right);
      },
    ),
    discounted: getTopRestaurants(
      restaurants.filter((restaurant) =>
        discountedDishesByRestaurant.has(restaurant.id),
      ),
      (left, right) => {
        const discountComparison =
          (discountedDishesByRestaurant.get(right.id) ?? 0) -
          (discountedDishesByRestaurant.get(left.id) ?? 0);
        if (discountComparison !== 0) return discountComparison;
        return compareByRating(left, right);
      },
    ),
    affordable: getTopRestaurants(
      restaurants.filter((restaurant) => minPriceByRestaurant.has(restaurant.id)),
      (left, right) => {
        const priceComparison =
          (minPriceByRestaurant.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (minPriceByRestaurant.get(right.id) ?? Number.MAX_SAFE_INTEGER);
        if (priceComparison !== 0) return priceComparison;
        return compareByRating(left, right);
      },
    ),
    variety: getTopRestaurants(
      restaurants.filter(
        (restaurant) => (dishesByRestaurant.get(restaurant.id) ?? 0) > 0,
      ),
      (left, right) => {
        const varietyComparison =
          (dishesByRestaurant.get(right.id) ?? 0) -
          (dishesByRestaurant.get(left.id) ?? 0);
        if (varietyComparison !== 0) return varietyComparison;
        return compareByRating(left, right);
      },
    ),
  };
}

type QuickBrowseCardProps = {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
};

function QuickBrowseCard({
  href,
  icon: Icon,
  title,
  description,
}: QuickBrowseCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-orange-700 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700 transition-colors group-hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:group-hover:bg-orange-500/20">
        <Icon className="h-7 w-7" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-black text-gray-900 dark:text-white">
          {title}
        </span>
        <span className="mt-1 block text-sm font-medium leading-5 text-gray-500 dark:text-slate-400">
          {description}
        </span>
      </span>
    </Link>
  );
}

type RestaurantRankingSectionProps = {
  title: string;
  restaurants: RestaurantList[];
  loading: boolean;
};

function RestaurantRankingSection({
  title,
  restaurants,
  loading,
}: RestaurantRankingSectionProps) {
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
  }, [restaurants, loading]);

  function scrollCarousel(direction: "left" | "right") {
    carouselRef.current?.scrollBy({
      left: direction === "left" ? -580 : 580,
      behavior: "smooth",
    });
  }

  if (!loading && restaurants.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Ver locales anteriores"
            disabled={!canScrollLeft}
            onClick={() => scrollCarousel("left")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:disabled:text-slate-700"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Ver más locales"
            disabled={!canScrollRight}
            onClick={() => scrollCarousel("right")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:disabled:text-slate-700"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div
        ref={carouselRef}
        className="scrollbar-none flex gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading
          ? Array.from({ length: HOME_SECTION_ITEM_COUNT }).map((_, index) => (
              <div
                key={index}
                className="w-[220px] shrink-0 sm:w-[250px] lg:w-[270px]"
              >
                <RestaurantCardSkeleton />
              </div>
            ))
          : restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="w-[220px] shrink-0 sm:w-[250px] lg:w-[270px]"
              >
                <RestaurantCompactCard restaurant={restaurant} />
              </div>
            ))}
      </div>
    </section>
  );
}

export default function ClientHomePage() {
  const [restaurantRankings, setRestaurantRankings] =
    useState<HomeRestaurantRankings>(emptyRestaurantRankings);
  const [categories, setCategories] = useState<ClientDishCategorySummary[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllRestaurants({}, HOME_FETCH_SIZE),
      getAllDishes({}, HOME_FETCH_SIZE),
      getDiscountedDishIds(),
    ])
      .then(([restaurants, dishes, discountedDishIds]) =>
        setRestaurantRankings(
          buildRestaurantRankings(restaurants, dishes, discountedDishIds),
        ),
      )
      .catch(() => setRestaurantRankings(emptyRestaurantRankings))
      .finally(() => setLoadingRestaurants(false));
  }, []);

  useEffect(() => {
    getClientDishCategorySummaries()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 px-0 py-4 sm:px-4 sm:py-5">
      <section className="min-w-0">
        <CategoryCarousel
          categories={categories}
          loading={loadingCategories}
          hrefForCategory={(category) => `/client/dishes?categoryId=${category.id}`}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <QuickBrowseCard
          href="/client/restaurant"
          icon={BuildingStorefrontIcon}
          title="Explorar locales"
          description="Buscá restaurantes por categoría, precio y disponibilidad."
        />
        <QuickBrowseCard
          href="/client/dishes"
          icon={ShoppingBagIcon}
          title="Explorar platos"
          description="Compará opciones por local, categoría y precio."
        />
      </section>

      <RestaurantRankingSection
        title="Top 10 locales mejor calificados"
        restaurants={restaurantRankings.bestRated}
        loading={loadingRestaurants}
      />
      <RestaurantRankingSection
        title="Top 10 locales más populares"
        restaurants={restaurantRankings.popular}
        loading={loadingRestaurants}
      />
      <RestaurantRankingSection
        title="Top 10 locales con descuentos"
        restaurants={restaurantRankings.discounted}
        loading={loadingRestaurants}
      />
      <RestaurantRankingSection
        title="Top 10 locales con opciones más económicas"
        restaurants={restaurantRankings.affordable}
        loading={loadingRestaurants}
      />
      <RestaurantRankingSection
        title="Top 10 locales con más variedad"
        restaurants={restaurantRankings.variety}
        loading={loadingRestaurants}
      />
    </div>
  );
}
