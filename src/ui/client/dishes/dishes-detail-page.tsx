"use client";

import { useEffect, useRef, useState } from "react";

import {
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Cart, ClientDish, Discount } from "@/lib/client/types";
import { getCart, getDish, getDishDiscount, updateCartItem } from "@/services/client/client-service";
import LocalNameWidget from "@/ui/shared/widgets/local-name-widget";

export default function DishesDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [dish, setDish] = useState<ClientDish | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [discountLoading, setDiscountLoading] = useState(true);
  // Mutex síncrono: evita que requests concurrentes al mismo endpoint creen carritos duplicados
  const cartUpdateInFlight = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    getDish(id)
      .then(setDish)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!dish) return;
    getCart(dish.localId).then(setCart).catch(() => setCart(null));
  }, [dish]);

  useEffect(() => {
    if (!dish) return;
    setDiscountLoading(true);
    getDishDiscount(dish.id)
      .then(setDiscount)
      .catch(() => setDiscount(null))
      .finally(() => setDiscountLoading(false));
  }, [dish]);

  const discountedPrice = discount && dish
    ? Math.round(dish.price * (1 - discount.porcentaje / 100) * 100) / 100
    : null;

  const currentQty =
    cart?.items
      .filter((i) => i.eliminacion == null && i.platoId === Number(dish?.id))
      .reduce((sum, i) => sum + i.cantidad, 0) ?? 0;

  const cartItemCount =
    cart?.items
      .filter((i) => i.eliminacion == null)
      .reduce((sum, i) => sum + i.cantidad, 0) ?? 0;

  async function handleCartUpdate(delta: number) {
    if (!dish || cartUpdateInFlight.current) return;
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

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-[1px]">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => router.back()}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-slate-500 transition hover:border-orange-300 hover:text-orange-700 dark:border-slate-700 dark:text-slate-300"
            aria-label="Cerrar detalle del plato"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (loading || !dish) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-[1px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-detail-title"
        className="relative flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm ring-1 ring-gray-200 transition hover:text-orange-700 dark:bg-slate-950/90 dark:text-slate-200 dark:ring-slate-800"
          aria-label="Cerrar detalle del plato"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto">
          {/* Imagen */}
          <div className="relative flex items-center justify-center bg-orange-50 h-64">
            {!discountLoading && discount && (
              <span className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1 text-sm font-bold text-white shadow">
                <TagIcon className="h-4 w-4" />
                -{discount.porcentaje}%
              </span>
            )}
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
          <div className="p-6 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <h1
                id="dish-detail-title"
                className="text-2xl font-extrabold text-gray-900 dark:text-white"
              >
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

            {dish.description.trim() ? (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
                {dish.description}
              </p>
            ) : null}

            {discountLoading ? (
              <div className="mt-3 h-9 w-32 animate-pulse rounded-md bg-gray-200" />
            ) : discountedPrice != null ? (
              <div className="mt-3 flex items-baseline gap-3">
                <p className="text-3xl font-black text-orange-600">
                  ${discountedPrice}
                </p>
                <p className="text-lg text-gray-400 line-through">
                  ${dish.price}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-3xl font-black text-orange-600">
                ${dish.price}
              </p>
            )}

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

            {cartItemCount > 0 && (
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-orange-700 px-5 py-4 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingCartIcon className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-bold text-orange-700">
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
                  className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-orange-700 transition-colors hover:bg-orange-50"
                >
                  Ver carrito
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
