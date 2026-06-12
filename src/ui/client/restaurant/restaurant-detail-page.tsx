"use client";

import { useEffect, useState } from "react";

import { getRestaurant, getCart } from "@/services/client/client-service";
import type { Cart, Restaurant } from "@/lib/client/types";
import {
  ChevronLeftIcon,
  ShoppingCartIcon,
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

  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    getRestaurant(id)
      .then(setRestaurant)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      )
      .finally(() => setLoading(false));

    // Carga el carrito existente para este restaurante (null si no hay)
    getCart(Number(id)).then(setCart).catch(() => setCart(null));
  }, [id]);

  const cartItemCount =
    cart?.items.filter((i) => i.eliminacion == null).reduce((sum, i) => sum + i.cantidad, 0) ?? 0;

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
      <div className="max-w-[1440px] mx-auto px-4 py-6 pb-28">
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
                  width="100"
                  height="100"
                  className="object-cover w-full h-full rounded-full"
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
              <h1 className="text-lg font-extrabold text-gray-900 flex items-center gap-3">
                {restaurant.name}
                <span className="flex align-center text-sm text-orange-700 items-center">
                  <StarIcon className="w-[20px] mr-1"></StarIcon>{" "}
                  <span className="relative">{restaurant.stars}</span>
                  <Link href={`/client/restaurant/${id}/comentarios`} className="text-gray-800 text-xs  leading-1 font-normal ml-3 hover:text-orange-700">
                    Ver comentarios
                  </Link>
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
        <DishesList
          idLocal={Number(id)}
          cart={cart}
          onCartUpdate={setCart}
        />
      </div>

      {/* Barra fija de carrito — aparece cuando hay ítems */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-lg bg-orange-700 text-white rounded-2xl shadow-xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCartIcon className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-orange-700 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartItemCount}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">Tu pedido</p>
                <p className="text-xs opacity-80">${cart?.total.toFixed(2)}</p>
              </div>
            </div>
            <Link
              href={`/client/restaurant/${id}/cart`}
              className="bg-white text-orange-700 font-bold text-sm px-5 py-2 rounded-xl hover:bg-orange-50 transition-colors"
            >
              Ver carrito
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
