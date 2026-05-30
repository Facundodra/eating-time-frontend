"use client";

import {
  ChevronLeftIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import type { ClientDish } from "@/lib/client/types";

export default function DishesDetailPage({ dish }: { dish: ClientDish }) {
  return (
    <section className="mx-auto w-full max-w-3xl">
      <Link
        href="/client/platos"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver al listado
      </Link>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-72 items-center justify-center bg-orange-50 dark:bg-orange-500/10">
          {dish.imageUrl ? (
            <img
              src={dish.imageUrl}
              alt={dish.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-7xl font-black text-orange-600 dark:text-orange-300">
              {dish.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-950 dark:text-white">
                {dish.name}
              </h1>
              <p className="mt-3 text-3xl font-black text-orange-600 dark:text-orange-300">
                ${dish.price}
              </p>
            </div>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {dish.status === "available" ? "Disponible" : "No disponible"}
            </span>
          </div>

          <button
            type="button"
            disabled={dish.status !== "available"}
            className="mt-8 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            Agregar al carrito
          </button>
        </div>
      </article>
    </section>
  );
}
