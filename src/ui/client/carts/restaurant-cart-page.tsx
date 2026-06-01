"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import {
  deleteCart,
  getCart,
  getDeliveryPoints,
  getRestaurant,
  placeOrder,
  updateCartItem,
} from "@/services/client/client-service";
import type { Cart, DeliveryPoint, OrderRequest, Restaurant } from "@/lib/client/types";

// ── Sección de checkout ────────────────────────────────────────────────────────

type AddressMode = "saved" | "manual";

interface CheckoutSectionProps {
  restaurantId: number;
  onSuccess: () => void;
}

function CheckoutSection({ restaurantId, onSuccess }: CheckoutSectionProps) {
  const router = useRouter();

  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(true);

  const [mode, setMode] = useState<AddressMode>("saved");
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);

  const [localidad, setLocalidad] = useState("");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [nroApto, setNroApto] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [guardarEnCuenta, setGuardarEnCuenta] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeliveryPoints()
      .then((pts) => {
        setDeliveryPoints(pts);
        // Si no tiene puntos guardados, va directo al formulario manual
        if (pts.length === 0) setMode("manual");
        else setSelectedPointId(pts[0].id);
      })
      .catch(() => setMode("manual"))
      .finally(() => setLoadingPoints(false));
  }, []);

  async function handleConfirm() {
    setError(null);

    let body: OrderRequest;

    if (mode === "saved" && selectedPointId != null) {
      body = { puntoDeEntregaId: selectedPointId };
    } else {
      if (!localidad || !calle || !numero) {
        setError("Localidad, calle y número son obligatorios.");
        return;
      }
      body = {
        localidad,
        calle,
        numero,
        nroApto: nroApto || undefined,
        indicaciones: indicaciones || undefined,
        guardarEnCuenta,
      };
    }

    setPlacing(true);
    try {
      const { linkPago } = await placeOrder(restaurantId, body);
      router.push(linkPago);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo realizar el pedido.");
    } finally {
      setPlacing(false);
    }
  }

  if (loadingPoints) {
    return (
      <div className="mt-4 flex justify-center py-6">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700 block" />
      </div>
    );
  }

  return (
    <div className="mt-4 border border-orange-200 rounded-xl overflow-hidden">
      <div className="bg-orange-50 px-5 py-3 border-b border-orange-100">
        <p className="text-sm font-semibold text-gray-700">Dirección de entrega</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Selector de modo — solo si tiene puntos guardados */}
        {deliveryPoints.length > 0 && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode("saved")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mode === "saved"
                  ? "border-orange-600 bg-orange-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-orange-300"
              }`}
            >
              Puntos guardados
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mode === "manual"
                  ? "border-orange-600 bg-orange-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-orange-300"
              }`}
            >
              Nueva dirección
            </button>
          </div>
        )}

        {/* Lista de puntos guardados */}
        {mode === "saved" && (
          <ul className="space-y-2">
            {deliveryPoints.map((pt) => (
              <li key={pt.id}>
                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 p-3 hover:border-orange-300 transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
                  <input
                    type="radio"
                    name="delivery-point"
                    value={pt.id}
                    checked={selectedPointId === pt.id}
                    onChange={() => setSelectedPointId(pt.id)}
                    className="mt-0.5 accent-orange-600"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">
                      {pt.calle} {pt.numero}
                      {pt.nroApto ? `, Apto ${pt.nroApto}` : ""}
                    </p>
                    <p className="text-gray-500">{pt.localidad}</p>
                    {pt.indicaciones && (
                      <p className="text-gray-400 text-xs mt-0.5">{pt.indicaciones}</p>
                    )}
                  </div>
                </label>
              </li>
            ))}
          </ul>
        )}

        {/* Formulario manual */}
        {mode === "manual" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Localidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={localidad}
                  onChange={(e) => setLocalidad(e.target.value)}
                  placeholder="Ej: Montevideo"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Calle <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  placeholder="Ej: Av. Italia"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Número <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ej: 2547"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Apto</label>
                <input
                  type="text"
                  value={nroApto}
                  onChange={(e) => setNroApto(e.target.value)}
                  placeholder="Ej: 302"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Indicaciones de entrega
                </label>
                <input
                  type="text"
                  value={indicaciones}
                  onChange={(e) => setIndicaciones(e.target.value)}
                  placeholder="Ej: Tocar timbre, portón negro"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input
                type="checkbox"
                checked={guardarEnCuenta}
                onChange={(e) => setGuardarEnCuenta(e.target.checked)}
                className="rounded accent-orange-600"
              />
              Guardar esta dirección en mi cuenta
            </label>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
        )}

        {/* Botón confirmar */}
        <button
          type="button"
          disabled={placing || (mode === "saved" && selectedPointId == null)}
          onClick={handleConfirm}
          className="w-full flex items-center justify-center gap-2 bg-orange-700 hover:bg-orange-800 disabled:opacity-60 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          {placing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              Confirmar y pagar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Página principal del carrito ───────────────────────────────────────────────

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
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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
      // Si el carrito quedó vacío cerramos el checkout
      if (!hasActiveItems) setCheckoutOpen(false);
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
      setCheckoutOpen(false);
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
          {/* Listado de ítems */}
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

          {/* Total + botón realizar pedido */}
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-extrabold text-orange-700">
                  ${cart.total.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen((v) => !v)}
                className="flex items-center gap-2 bg-orange-700 hover:bg-orange-800 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
              >
                Realizar pedido
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${checkoutOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Sección de dirección de entrega */}
            {checkoutOpen && (
              <CheckoutSection
                restaurantId={restaurantId}
                onSuccess={() => setCart(null)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
