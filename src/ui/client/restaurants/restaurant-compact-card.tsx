"use client";

import clsx from "clsx";
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
  MoonIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

import type { RestaurantList } from "@/lib/client/types";

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

export function RestaurantCompactCard({
  restaurant,
}: {
  restaurant: RestaurantList;
}) {
  const coverPhotoUrl = getRestaurantCoverUrl(restaurant);

  return (
    <Link href={`/client/restaurant/${restaurant.id}`} className="group block">
      <article className="min-w-0">
        <div className="relative flex aspect-[1.86/1] items-center justify-center overflow-hidden rounded-xl bg-gray-50 shadow-sm dark:bg-slate-900">
          {coverPhotoUrl ? (
            <Image
              alt={`Portada de ${restaurant.name}`}
              src={coverPhotoUrl}
              fill
              unoptimized
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <BuildingStorefrontIcon className="h-12 w-12 text-gray-300 dark:text-slate-950" />
          )}
          <span
            aria-label={restaurant.state ? "Abierto" : "Cerrado"}
            title={restaurant.state ? "Abierto" : "Cerrado"}
            className={clsx(
              "absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black shadow-sm backdrop-blur",
              restaurant.state
                ? "border-green-200 bg-green-100 text-green-900 dark:border-green-400/35 dark:bg-slate-950/85 dark:text-green-300"
                : "border-slate-200 bg-white/95 text-slate-600 dark:border-slate-500/35 dark:bg-slate-950/85 dark:text-slate-300",
            )}
          >
            {restaurant.state ? (
              <CheckCircleIcon className="h-3.5 w-3.5" />
            ) : (
              <MoonIcon className="h-3.5 w-3.5" />
            )}
            {restaurant.state ? "Abierto" : "Cerrado"}
          </span>
        </div>

        <div className="mt-2.5 flex min-w-0 items-start gap-2">
          <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-orange-100 bg-orange-50 text-sm font-black text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
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
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <h3 className="truncate text-base font-black leading-5 text-slate-900 group-hover:text-orange-700 dark:text-slate-50 dark:group-hover:text-orange-400">
                {restaurant.name}
              </h3>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-xs font-black text-slate-900 dark:bg-orange-500/10 dark:text-slate-100">
                <StarIcon className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                <span>{formatRating(restaurant.stars)}</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
