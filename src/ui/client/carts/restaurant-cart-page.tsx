"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import {
  getCart,
  getRestaurant,
  updateCartItem,
  deleteCart,
} from "@/services/client/client-service";
import type { Cart, Restaurant } from "@/lib/client/types";

export default function RestaurantCartPage({
  restaurantId,
}: {
  restaurantId: number;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingDishId, setUpdatingDishId] = useState<number | null>(null);
  const [deletingCart, setDeletingCart] = useState(false);

  useEffect(() => {
    async function load() {
      const [cartData, restaurantData] = await Promise.allSettled([
        getCart(restaurantId),
        getRestaurant(String(restaurantId)),
      ]);

      if (cartData.status === "fulfilled") setCart(cartData.value);
      if (restaurantData.status === "fulfilled") setRestaurant(restaurantData.value);
      setLoading(false);
    }

    load();
  }, [restaurantId]);

  async function handleUpdateItem(platoId: number, delta: number) {
    setUpdatingDishId(platoId);
    try {
      const updated = await updateCartItem(restaurantId, platoId, delta);
      const hasActiveItems = (updated.items ?? []).some((i) => i.eliminacion == null);
      setCart(hasActiveItems ? updated : null);
    } catch {
      // Falla silenciosa; el usuario puede reintentar
    } finally {
      setUpdatingDishId(null);
    }
  }

  async function handleDeleteCart() {
    setDeletingCart(true);
    try {
      await deleteCart(restaurantId);
      setCart(null);
    } catch {
      // Falla silenciosa
    } finally {
      setDeletingCart(false);
    }
  }

  const activeItems = cart?.items.filter((i) => i.eliminacion == null) ?? [];

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Volver al restaurante */}
      <Link
        href={`/client/restaurant/${restaurantId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 transition-colors mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a {restaurant?.name ?? "el restaurante"}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Tu carrito</h1>
        {cart && (
          <button
            type="button"
            disabled={deletingCart}
            onClick={handleDeleteCart}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {deletingCart ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-400 block" />
            ) : (
              <TrashIcon className="w-4 h-4" />
            )}
            Vaciar carrito
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 animate-pulse flex justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {!loading && (!cart || activeItems.length === 0) && (
        <div className="flex flex-col items-center gap-4 py-16 text-gray-400">
          <ShoppingCartIcon className="w-14 h-14" />
          <p className="text-sm">Tu carrito está vacío.</p>
          <Link
            href={`/client/restaurant/${restaurantId}`}
            className="text-orange-700 text-sm font-semibold hover:underline"
          >
            Ver platos del restaurante
          </Link>
        </div>
      )}

      {!loading && cart && activeItems.length > 0 && (
        <>
          <div className="space-y-3 mb-6">
            {activeItems.map((item) => {
              const isUpdating = updatingDishId === item.platoId;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      Plato #{item.platoId}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ${item.costoUnitario.toFixed(2)} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-orange-200 rounded-lg px-1 py-1 gap-2">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateItem(item.platoId, -1)}
                        className="p-1 rounded hover:bg-orange-50 transition-colors disabled:opacity-50"
                      >
                        <MinusIcon className="w-3.5 h-3.5 text-orange-700" />
                      </button>

                      {isUpdating ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700 block" />
                      ) : (
                        <span className="text-sm font-bold text-orange-700 min-w-[18px] text-center">
                          {item.cantidad}
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateItem(item.platoId, 1)}
                        className="p-1 rounded hover:bg-orange-50 transition-colors disabled:opacity-50"
                      >
                        <PlusIcon className="w-3.5 h-3.5 text-orange-700" />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-gray-800 min-w-[60px] text-right">
                      ${item.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-extrabold text-orange-700">
                ${cart.total.toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              className="bg-orange-700 hover:bg-orange-800 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Realizar pedido
            </button>
          </div>
        </>
      )}
    </div>
  );
}
