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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRestaurant(id)
      .then(setRestaurant)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      )
      .finally(() => setLoading(false));
  }, [id]);


  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
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
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 transition-colors mb-6"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Volver al listado
        </Link>
        

        {/* Ficha local */}
        <div className="restaurant-card flex align-center overflow-hidden mb-7">
          {/* Imagen */}
          <div>
            <div className="flex items-center justify-center bg-orange-50 h-64 rounded-full w-[100px] h-[100px]">
              {restaurant.url_photo ? (
                <Image
                  src={restaurant.url_photo}
                  alt={restaurant.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-lg font-black text-orange-600">
                  {restaurant.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <span
              className={`block rounded-full px-3 py-1 text-xs font-semibold mx-auto w-full text-center mt-3 ${
                restaurant.state == true
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {restaurant.state == true ? "Abierto" : "Cerrado"}
            </span>
          </div>

          {/* Info */}
          <div className="p-6">
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 flex align-center gap-3">
                {restaurant.name}
                <span className="flex text-sm text-orange-700 align-center">
                  <StarIcon className="w-[20px] mr-1"></StarIcon>{" "}
                  <span className="relative top-[5px]">{restaurant.stars}</span>
                </span>
              </h1>
              <p className="descripcion text-md block">
                {restaurant.description}
              </p>
              <p className="direccion text-gray-700 text-xs flex align-center mt-1">
                <MapPinIcon className="w-[15px] mr-1"></MapPinIcon>
                {restaurant.address}
              </p>
            </div>
          </div>
        </div>

        {/* Listado de platos */}
        <h2 className="text-xl font-bold text-gray-700 mb-5">Platos disponibles</h2>
        <DishesList idLocal={Number(id)} />

      </div>
    </>
  );
}
