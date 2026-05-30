"use client";

import { useEffect, useState } from "react";

import { getRestaurant } from "@/services/client/client-service";
import type { Restaurant } from "@/lib/client/types";
import {
  ChevronLeftIcon,
  StarIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

import Link from "next/link";
import Image from "next/image";
import DishesList from "@/ui/client/dishes/dishes-list";

export default function RestaurantDetailPage({ id }: { id: string }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRestaurant(id)
      .then(setRestaurant)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      );
  }, [id]);


  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        {/* Volver */}
        <Link
          href="/client"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Volver al listado
        </Link>
        

        {/* Ficha local */}
        <div className="restaurant-card flex align-center overflow-hidden mb-7">
          {/* Imagen */}
          <div>
            <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-orange-50 dark:bg-orange-500/10">
              {restaurant.url_photo ? (
                <Image
                  src={restaurant.url_photo}
                  alt={restaurant.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-lg font-black text-orange-600 dark:text-orange-300">
                  {restaurant.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <span
              className={`block rounded-full px-3 py-1 text-xs font-semibold mx-auto w-full text-center mt-3 ${
                restaurant.state == true
                  ? "bg-green-100 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {restaurant.state == true ? "Abierto" : "Cerrado"}
            </span>
          </div>

          {/* Info */}
          <div className="p-6">
            <div>
              <h1 className="flex align-center gap-3 text-lg font-extrabold text-gray-900 dark:text-white">
                {restaurant.name}
                <span className="flex align-center text-sm text-orange-700 dark:text-orange-300">
                  <StarIcon className="w-[20px] mr-1"></StarIcon>{" "}
                  <span className="relative top-[5px]">{restaurant.stars}</span>
                </span>
              </h1>
              <p className="descripcion text-md block text-slate-700 dark:text-slate-300">
                {restaurant.description}
              </p>
              <p className="direccion mt-1 flex align-center text-xs text-gray-700 dark:text-slate-400">
                <MapPinIcon className="w-[15px] mr-1"></MapPinIcon>
                {restaurant.address}
              </p>
            </div>
          </div>
        </div>

        {/* Listado de platos */}
        <h2 className="mb-5 text-xl font-bold text-gray-700 dark:text-white">Platos disponibles</h2>
        <DishesList idLocal={Number(id)} />

      </div>
    </>
  );
}
