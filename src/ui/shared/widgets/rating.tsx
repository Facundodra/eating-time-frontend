"use client";

import { StarIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

import { getRestaurantRating } from "@/services/restaurant/statistics-service";

function formatRating(rating: number | null) {
  if (rating == null) return "-";
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

export default function RestaurantRating({
  restaurantId,
}: {
  restaurantId?: number | string;
}) {
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    if (restaurantId == null) return;

    let cancelled = false;

    getRestaurantRating(restaurantId)
      .then((restaurantRating) => {
        if (!cancelled) setRating(restaurantRating);
      })
      .catch(() => {
        if (!cancelled) setRating(null);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  return (
    <div className="restaurant-rating flex w-fit items-center rounded-3xl bg-yellow-100 px-4 py-3 dark:bg-yellow-500/15">
      <StarIcon className="w-3 text-yellow-400 dark:text-yellow-300" />
      <span className="ml-1 text-xs font-bold leading-1 text-orange-600 dark:text-yellow-300">
        {formatRating(rating)}
      </span>
    </div>
  );
}
