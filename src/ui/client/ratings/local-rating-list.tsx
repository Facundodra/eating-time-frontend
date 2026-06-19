"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, StarIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

import { getLocalRatings } from "@/services/client/client-service";
import { LocalRating } from "@/lib/client/types";

function RatingCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-4 w-10 rounded bg-gray-100 dark:bg-slate-800" />
      </div>
      <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-slate-800" />
      <div className="border-t border-gray-100 pt-3 dark:border-slate-800">
        <div className="h-3 w-1/5 rounded bg-gray-100 dark:bg-slate-800" />
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

function getDateTimeValue(dateStr: string) {
  const value = new Date(dateStr).getTime();

  return Number.isNaN(value) ? 0 : value;
}

function getRatingClientKey(rating: LocalRating) {
  if (rating.clienteId != null) {
    return `id-${rating.clienteId}`;
  }

  return rating.nombreCliente.trim().toLowerCase() || `pedido-${rating.pedidoId}`;
}

function getLatestCommentsByClient(ratings: LocalRating[]) {
  const latestByClient = new Map<string, LocalRating>();

  ratings
    .filter((rating) => rating.comentario?.trim())
    .forEach((rating) => {
      const key = getRatingClientKey(rating);
      const current = latestByClient.get(key);

      if (!current || getDateTimeValue(rating.creacion) > getDateTimeValue(current.creacion)) {
        latestByClient.set(key, rating);
      }
    });

  return Array.from(latestByClient.values())
    .sort((left, right) => getDateTimeValue(right.creacion) - getDateTimeValue(left.creacion))
    .slice(0, 10);
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

  const restaurantIdNumber = Number(restaurantId);
  const latestComments = useMemo(
    () => getLatestCommentsByClient(ratings),
    [ratings],
  );

  useEffect(() => {
    let cancelled = false;

    getLocalRatings(restaurantIdNumber)
      .then((ids) => {
        if (!cancelled) {
          setRatings(ids);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRatings([]);
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los comentarios.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantIdNumber]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver al restaurante
      </button>
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Comentarios
      </h2>
      {loading ? (
        <RatingSkeleton />
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : latestComments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Este local todavía no tiene comentarios.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {latestComments.map((rating) => (
            <div
              key={rating.id}
              className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500/60"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold text-gray-900 dark:text-white">
                  {rating.nombreCliente}
                </p>
                <div className="flex shrink-0 items-center gap-1 font-bold text-orange-600">
                  <StarIcon className="h-4 w-4 text-orange-400" />
                  {rating.calificacion}
                </div>
              </div>
              {rating.comentario && (
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                  {rating.comentario}
                </p>
              )}
              <div className="mt-4 border-t border-gray-100 pt-3 dark:border-slate-800">
                <span className="text-xs text-gray-400 dark:text-slate-500">
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
