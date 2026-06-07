"use client";

import { useEffect, useRef, useState } from "react";

import {
  ChevronLeftIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Cart, ClientDish } from "@/lib/client/types";
import { getCart, updateCartItem } from "@/services/client/client-service";
import LocalNameWidget from "@/ui/shared/widgets/local-name-widget";

export default function DishesDetailPage({ dish }: { dish: ClientDish }) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  // Mutex síncrono: evita que requests concurrentes al mismo endpoint creen carritos duplicados
  const cartUpdateInFlight = useRef(false);

  useEffect(() => {
    getCart(dish.localId).then(setCart).catch(() => setCart(null));
  }, [dish.localId]);

  const currentQty =
    cart?.items
      .filter((i) => i.eliminacion == null && i.platoId === Number(dish.id))
      .reduce((sum, i) => sum + i.cantidad, 0) ?? 0;

  const cartItemCount =
    cart?.items
      .filter((i) => i.eliminacion == null)
      .reduce((sum, i) => sum + i.cantidad, 0) ?? 0;

  async function handleCartUpdate(delta: number) {
    if (cartUpdateInFlight.current) return;
    cartUpdateInFlight.current = true;
    setIsUpdating(true);
    try {
      const updated = await updateCartItem(dish.localId, Number(dish.id), delta);
      const hasActiveItems = (updated.items ?? []).some((i) => i.eliminacion == null);
      setCart(hasActiveItems ? updated : null);
    } catch (err) {
      console.error("[carrito] error:", err);
    } finally {
      cartUpdateInFlight.current = false;
      setIsUpdating(false);
    }
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Volver */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 transition-colors mb-6"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Volver al listado
        </button>

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

            <div className="mt-2">
              <LocalNameWidget localId={dish.localId} />
            </div>

            {/* Botón agregar al carrito / contador */}
            {currentQty === 0 ? (
              <button
                type="button"
                disabled={dish.status !== "available" || isUpdating}
                onClick={() => handleCartUpdate(1)}
                className="mt-8 flex cursor-pointer w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <ShoppingCartIcon className="h-5 w-5" />
                    Agregar al carrito
                  </>
                )}
              </button>
            ) : (
              <div className="mt-8 flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleCartUpdate(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white transition hover:bg-orange-700 disabled:opacity-50"
                >
                  <MinusIcon className="h-5 w-5" />
                </button>
                <span className="text-lg font-extrabold text-gray-900">
                  {currentQty}
                </span>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleCartUpdate(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white transition hover:bg-orange-700 disabled:opacity-50"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra fija de carrito */}
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
              href={`/client/restaurant/${dish.localId}/cart`}
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
