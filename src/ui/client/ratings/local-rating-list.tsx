"use client";

import { useEffect, useRef, useState } from "react";
import { StarIcon } from "@heroicons/react/24/outline";

import { getLocalRatings } from "@/services/client/client-service";
import { LocalRating } from "@/lib/client/types";

import { ChevronLeftIcon } from "@heroicons/react/24/outline";

import router from "next/dist/shared/lib/router/router";
import { useRouter } from "next/dist/client/components/navigation";

function RatingCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-100 rounded w-10" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="border-t border-gray-100 pt-3">
        <div className="h-3 bg-gray-100 rounded w-1/5" />
      </div>
    </div>
  );
}

function RatingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <RatingCardSkeleton key={i} />
      ))}
    </div>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function LocalRatingList({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const [ratings, setRatings] = useState<LocalRating[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const restaurantIdString = parseInt(restaurantId);
  useEffect(() => {
    let cancelled = false;
    getLocalRatings(restaurantIdString).then((ids) => {
      if (!cancelled) {
        setRatings(ids);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 transition-colors mb-6 cursor-pointer"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver al restaurante
      </button>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Comentarios</h2>
      {loading ? (
        <RatingSkeleton />
      ) : ratings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            Este local todavía no tiene comentarios.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div
              key={rating.id}
              className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-orange-300"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold text-gray-900">
                  {rating.nombreCliente}
                </p>
                <div className="flex shrink-0 items-center gap-1 font-bold text-orange-600">
                  <StarIcon className="w-4 h-4 text-orange-400" />
                  {rating.calificacion}
                </div>
              </div>
              {rating.comentario && (
                <p className="mt-2 text-sm text-gray-600">
                  {rating.comentario}
                </p>
              )}
              <div className="mt-4 border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">
                  {formatDate(rating.creacion)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
