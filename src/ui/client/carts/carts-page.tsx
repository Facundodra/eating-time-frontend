"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, ShoppingCartIcon, TrashIcon } from "@heroicons/react/24/outline";

import {
  deleteCart,
  getCarts,
  getDishName,
  getRestaurantName,
} from "@/services/client/client-service";
import type { Cart } from "@/lib/client/types";

function CartCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse space-y-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 dark:bg-slate-700" />
        <div className="h-4 bg-gray-200 rounded w-1/3 dark:bg-slate-700" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-2/3 dark:bg-slate-800" />
        <div className="h-3 bg-gray-100 rounded w-1/2 dark:bg-slate-800" />
      </div>
      <div className="flex justify-between items-center pt-1">
        <div className="h-4 bg-gray-200 rounded w-1/4 dark:bg-slate-700" />
        <div className="h-8 bg-gray-200 rounded-lg w-28 dark:bg-slate-700" />
      </div>
    </div>
  );
}

type CartWithName = Cart & { restaurantName: string };

export default function CartsPage() {
  const [carts, setCarts] = useState<CartWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingRestaurantId, setDeletingRestaurantId] = useState<number | null>(null);

  useEffect(() => {
    async function loadCarts() {
      try {
        const rawCarts = await getCarts();
        const dishNameCache = new Map<number, Promise<string | null>>();

        function resolveDishName(platoId: number) {
          const cachedName = dishNameCache.get(platoId);
          if (cachedName) return cachedName;

          const dishName = getDishName(platoId).catch(() => null);
          dishNameCache.set(platoId, dishName);
          return dishName;
        }

        // Carga el nombre de cada restaurante y plato en paralelo
        const cartsWithNames = await Promise.all(
          rawCarts.map(async (cart) => {
            const [restaurantName, items] = await Promise.all([
              getRestaurantName(cart.restaurantId).catch(
                () => `Restaurante #${cart.restaurantId}`
              ),
              Promise.all(
                cart.items.map(async (item) => {
                  if (item.nombre?.trim()) return item;

                  const dishName = await resolveDishName(item.platoId);
                  return dishName ? { ...item, nombre: dishName } : item;
                })
              ),
            ]);

            return { ...cart, restaurantName, items };
          })
        );

        setCarts(cartsWithNames);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los carritos.");
      } finally {
        setLoading(false);
      }
    }

    loadCarts();
  }, []);

  async function handleDelete(restaurantId: number) {
    setDeletingRestaurantId(restaurantId);
    try {
      await deleteCart(restaurantId);
      setCarts((prev) => prev.filter((c) => c.restaurantId !== restaurantId));
    } catch {
      // Falla silenciosa; el carrito sigue visible
    } finally {
      setDeletingRestaurantId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800 mb-6 dark:text-slate-100">Mis carritos</h1>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CartCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-red-500 text-sm dark:text-red-300">{error}</p>
      )}

      {!loading && !error && carts.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-gray-400 dark:text-slate-500">
          <ShoppingCartIcon className="w-14 h-14" />
          <p className="text-sm">No tenés carritos activos.</p>
          <Link
            href="/client"
            className="text-orange-700 text-sm font-semibold hover:underline dark:text-orange-400"
          >
            Explorar restaurantes
          </Link>
        </div>
      )}

      {!loading && !error && carts.length > 0 && (
        <div className="space-y-4">
          {carts.map((cart) => {
            const isDeleting = deletingRestaurantId === cart.restaurantId;
            return (
              <div
                key={cart.id}
                className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Encabezado del carrito */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 dark:bg-orange-500/10">
                      <ShoppingCartIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-slate-100">{cart.restaurantName}</span>
                  </div>

                  {/* Botón eliminar carrito */}
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(cart.restaurantId)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                    title="Eliminar carrito"
                  >
                    {isDeleting ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-500 block dark:border-slate-600 dark:border-t-red-400" />
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Ítems del carrito */}
                <ul className="text-sm text-gray-600 space-y-1 pl-1 dark:text-slate-300">
                  {cart.items
                    .filter((item) => item.eliminacion == null)
                    .map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>
                          {item.cantidad}x {item.nombre?.trim() || `Plato #${item.platoId}`}
                        </span>
                        <span className="text-gray-500 dark:text-slate-400">${item.total.toFixed(2)}</span>
                      </li>
                    ))}
                </ul>

                {/* Total + botón continuar */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-slate-800">
                  <span className="font-bold text-orange-700 dark:text-orange-400">
                    Total: ${cart.total.toFixed(2)}
                  </span>
                  <Link
                    href={`/client/restaurant/${cart.restaurantId}/cart`}
                    className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Continuar pedido
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
