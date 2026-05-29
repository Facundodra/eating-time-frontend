"use client";

import Link from "next/link";
import { ChevronLeftIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import type { ClientDish } from "@/lib/client/types";

export default function DishesDetailPage({ dish }: { dish: ClientDish }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Volver */}
      <Link
        href="/client/platos"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 transition-colors mb-6"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver al listado
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Imagen */}
        <div className="flex items-center justify-center bg-orange-50 h-64">
          {dish.imageUrl ? (
            <img
              src={dish.imageUrl}
              alt={dish.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-7xl font-black text-orange-600">
              {dish.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {dish.name}
            </h1>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                dish.status === "available"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {dish.status === "available" ? "Disponible" : "No disponible"}
            </span>
          </div>

          <p className="mt-3 text-3xl font-black text-orange-600">
            ${dish.price}
          </p>

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
