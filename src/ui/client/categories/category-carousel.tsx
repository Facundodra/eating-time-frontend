"use client";

import { Squares2X2Icon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

import type { ClientDishCategorySummary } from "@/lib/client/types";

function CategorySkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="w-24 shrink-0 animate-pulse sm:w-28">
          <div className="mx-auto h-16 w-16 rounded-xl bg-gray-100 dark:bg-slate-800 sm:h-20 sm:w-20" />
          <div className="mt-2">
            <div className="mx-auto h-4 w-20 rounded bg-gray-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

type CategoryCarouselProps = {
  categories: ClientDishCategorySummary[];
  loading: boolean;
  hrefForCategory?: (category: ClientDishCategorySummary) => string;
  selectedCategoryId?: number | null;
  onSelectCategory?: (category: ClientDishCategorySummary) => void;
};

export default function CategoryCarousel({
  categories,
  loading,
  hrefForCategory = (category) =>
    `/client/search?q=${encodeURIComponent(category.name)}&tab=dishes`,
  selectedCategoryId = null,
  onSelectCategory,
}: CategoryCarouselProps) {
  return (
    <section className="min-w-0">
      <div className="hide-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 touch-pan-x">
        {loading ? (
          <CategorySkeleton />
        ) : (
          categories.map((category) => {
            const selected = selectedCategoryId === category.id;
            const content = (
              <>
              <div
                className={`relative mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 bg-slate-100 transition dark:bg-slate-800 sm:h-20 sm:w-20 ${
                  selected
                    ? "border-orange-500"
                    : "border-transparent group-hover:border-orange-300 dark:group-hover:border-orange-500/70"
                }`}
              >
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
                <span
                  className={`block truncate text-sm font-bold transition ${
                    selected
                      ? "text-orange-700 dark:text-orange-300"
                      : "text-gray-800 dark:text-slate-100"
                  }`}
                >
                  {category.name}
                </span>
              </div>
              </>
            );
            const className = `group w-24 shrink-0 snap-center rounded-3xl outline-none transition sm:w-28 ${
              selected
                ? "text-orange-700 dark:text-orange-300"
                : ""
            }`;

            if (onSelectCategory) {
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelectCategory(category)}
                  className={className}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={category.id}
                href={hrefForCategory(category)}
                className={className}
              >
                {content}
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
