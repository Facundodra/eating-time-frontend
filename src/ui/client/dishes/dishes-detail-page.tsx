"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import type { ClientDish } from "@/lib/client/types";
import LocalNameWidget from "@/ui/shared/widgets/local-name-widget";

export default function DishesDetailPage({ dish }: { dish: ClientDish }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Volver */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver al listado
      </button>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Imagen */}
        <div className="flex h-64 items-center justify-center bg-orange-50 dark:bg-orange-500/10">
          {dish.imageUrl ? (
            <img
              src={dish.imageUrl}
              alt={dish.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-7xl font-black text-orange-600 dark:text-orange-300">
              {dish.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {dish.name}
            </h1>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                dish.status === "available"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {dish.status === "available" ? "Disponible" : "No disponible"}
            </span>
          </div>

          <p className="mt-3 text-3xl font-black text-orange-600 dark:text-orange-300">
            ${dish.price}
          </p>

          <div className="mt-2">
            <LocalNameWidget localId={dish.localId} />
          </div>

          {/* Botón agregar al carrito */}
          <button
            type="button"
            disabled={dish.status !== "available"}
            className="mt-8 flex cursor-pointer w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
