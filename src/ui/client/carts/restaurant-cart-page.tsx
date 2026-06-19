"use client";

import { useEffect, useRef, useState } from "react";
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
  applyCartCoupon,
  deleteCart,
  getCart,
  getDeliveryPoints,
  getDishName,
  getRestaurant,
  placeOrder,
  removeCartCoupon,
  updateCartItem,
} from "@/services/client/client-service";
import {
  applyClientVoucher,
  getAvailableClientVouchers,
  getClientVirtualMoney,
  removeClientVoucher,
} from "@/services/client/virtual-money-service";
import type {
  AppliedCartCoupon,
  Cart,
  ClientVoucher,
  DeliveryPoint,
  OrderRequest,
  Restaurant,
} from "@/lib/client/types";
import CartCouponPanel from "@/ui/client/carts/cart-coupon-panel";
import { formatCartPrice } from "@/ui/client/carts/cart-formatters";
import CartVoucherPanel from "@/ui/client/carts/cart-voucher-panel";

type AddressMode = "saved" | "manual";

interface CheckoutSectionProps {
  restaurantId: number;
}

function getCartItemName(item: Cart["items"][number]) {
  return item.nombre?.trim() || `Plato #${item.platoId}`;
}

async function hydrateCartDishNames(cart: Cart | null): Promise<Cart | null> {
  if (!cart) return null;

  const dishNameCache = new Map<number, Promise<string | null>>();

  function resolveDishName(platoId: number) {
    const cachedName = dishNameCache.get(platoId);
    if (cachedName) return cachedName;

    const dishName = getDishName(platoId).catch(() => null);
    dishNameCache.set(platoId, dishName);
    return dishName;
  }

  const items = await Promise.all(
    cart.items.map(async (item) => {
      if (item.nombre?.trim()) return item;

      const dishName = await resolveDishName(item.platoId);
      return dishName ? { ...item, nombre: dishName } : item;
    }),
  );

  return { ...cart, items };
}

function CheckoutSection({ restaurantId }: CheckoutSectionProps) {
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
  const [localNotes, setLocalNotes] = useState("");
  const [guardarEnCuenta, setGuardarEnCuenta] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeliveryPoints()
      .then((pts) => {
        setDeliveryPoints(pts);
        if (pts.length === 0) setMode("manual");
        else setSelectedPointId(pts[0].id);
      })
      .catch(() => setMode("manual"))
      .finally(() => setLoadingPoints(false));
  }, []);

  async function handleConfirm() {
    setError(null);

    let body: OrderRequest;
    const trimmedLocalNotes = localNotes.trim() || undefined;

    if (mode === "saved" && selectedPointId != null) {
      body = { puntoDeEntregaId: selectedPointId, notasLocal: trimmedLocalNotes };
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
        notasLocal: trimmedLocalNotes,
      };
    }

    setPlacing(true);
    try {
      const { linkPago } = await placeOrder(restaurantId, body);
      router.push(linkPago);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo realizar el pedido.";
      if (message.toLowerCase().includes("venc")) {
        setError(
          "El voucher ya no es válido. Quitá el voucher aplicado e intentá realizar el pedido nuevamente.",
        );
      } else if (message.toLowerCase().includes("cupón") || message.toLowerCase().includes("cupon")) {
        setError(
          "El cupón ya no es válido. Quitá el cupón aplicado e intentá realizar el pedido nuevamente.",
        );
      } else {
        setError(message);
      }
    } finally {
      setPlacing(false);
    }
  }

  if (loadingPoints) {
    return (
      <div className="mt-4 flex justify-center py-6">
        <span className="block h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700" />
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-orange-200">
      <div className="border-b border-orange-100 bg-orange-50 px-5 py-3">
        <p className="text-sm font-semibold text-gray-700">Dirección de entrega</p>
      </div>

      <div className="space-y-4 p-5">
        {deliveryPoints.length > 0 && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode("saved")}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
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
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                mode === "manual"
                  ? "border-orange-600 bg-orange-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-orange-300"
              }`}
            >
              Nueva dirección
            </button>
          </div>
        )}

        {mode === "saved" && (
          <ul className="space-y-2">
            {deliveryPoints.map((pt) => (
              <li key={pt.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-orange-300 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
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
                      <p className="mt-0.5 text-xs text-gray-400">{pt.indicaciones}</p>
                    )}
                  </div>
                </label>
              </li>
            ))}
          </ul>
        )}

        {mode === "manual" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">
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
                <label className="mb-1 block text-xs font-medium text-gray-600">
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
                <label className="mb-1 block text-xs font-medium text-gray-600">
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
                <label className="mb-1 block text-xs font-medium text-gray-600">Apto</label>
                <input
                  type="text"
                  value={nroApto}
                  onChange={(e) => setNroApto(e.target.value)}
                  placeholder="Ej: 302"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">
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

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
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

        <div className="border-t border-orange-100 pt-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Notas para el local (opcional)
          </label>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="Ej: Sin cebolla, bien cocido, traer cubiertos"
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
        )}

        <button
          type="button"
          disabled={placing || (mode === "saved" && selectedPointId == null)}
          onClick={handleConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-800 disabled:opacity-60"
        >
          {placing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              Confirmar y pagar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

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
  const [availableVouchers, setAvailableVouchers] = useState<ClientVoucher[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<ClientVoucher | null>(null);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [applyingVoucherId, setApplyingVoucherId] = useState<string | null>(null);
  const [removingVoucher, setRemovingVoucher] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [removingCoupon, setRemovingCoupon] = useState(false);
  const cartUpdateInFlight = useRef(false);

  const activeItems = cart?.items.filter((i) => i.eliminacion == null) ?? [];
  const itemsSubtotal = activeItems.reduce((sum, item) => sum + item.total, 0);
  const couponDiscount = cart?.descuento ?? 0;
  const subtotalAfterCoupon = Math.max(0, itemsSubtotal - couponDiscount);
  const appliedCoupon: AppliedCartCoupon | null =
    cart?.cuponId != null && cart.cuponCodigo && cart.cuponPorcentaje != null
      ? {
          code: cart.cuponCodigo,
          percentage: cart.cuponPorcentaje,
          discountAmount: couponDiscount,
        }
      : null;
  const hasCouponDiscount = appliedCoupon != null && couponDiscount > 0;
  const hasVoucherDiscount =
    cart?.voucherId != null && subtotalAfterCoupon > (cart?.total ?? 0);

  async function loadVoucherPanels(cartData: Cart) {
    setLoadingVouchers(true);
    setVoucherError(null);

    try {
      const [available, wallet] = await Promise.all([
        getAvailableClientVouchers(restaurantId),
        getClientVirtualMoney().catch(() => ({ vouchers: [] })),
      ]);

      setAvailableVouchers(available);

      if (cartData.voucherId != null) {
        const applied =
          wallet.vouchers.find((voucher) => voucher.id === String(cartData.voucherId)) ??
          available.find((voucher) => voucher.id === String(cartData.voucherId)) ??
          null;
        setAppliedVoucher(applied);
      } else {
        setAppliedVoucher(null);
      }
    } catch (err) {
      setVoucherError(
        err instanceof Error ? err.message : "No se pudieron cargar los vouchers.",
      );
    } finally {
      setLoadingVouchers(false);
    }
  }

  useEffect(() => {
    async function load() {
      const [cartData, restaurantData] = await Promise.allSettled([
        getCart(restaurantId),
        getRestaurant(String(restaurantId)),
      ]);

      if (cartData.status === "fulfilled") {
        setCart(await hydrateCartDishNames(cartData.value));
      }
      if (restaurantData.status === "fulfilled") setRestaurant(restaurantData.value);
      setLoading(false);
    }

    void load();
  }, [restaurantId]);

  useEffect(() => {
    if (!loading && cart && activeItems.length > 0) {
      void loadVoucherPanels(cart);
      return;
    }

    if (!cart || activeItems.length === 0) {
      setAvailableVouchers([]);
      setAppliedVoucher(null);
      setVoucherError(null);
      setCouponError(null);
    }
  }, [loading, cart?.id, cart?.voucherId, cart?.cuponId, activeItems.length, restaurantId]);

  async function handleUpdateItem(platoId: number, delta: number) {
    if (cartUpdateInFlight.current) return;
    cartUpdateInFlight.current = true;
    setUpdatingDishId(platoId);
    try {
      const updated = await hydrateCartDishNames(
        await updateCartItem(restaurantId, platoId, delta),
      );
      const hasActiveItems = (updated?.items ?? []).some((i) => i.eliminacion == null);
      setCart(hasActiveItems ? updated : null);
      if (!hasActiveItems) setCheckoutOpen(false);
    } catch {
      // Falla silenciosa; el usuario puede reintentar
    } finally {
      cartUpdateInFlight.current = false;
      setUpdatingDishId(null);
    }
  }

  async function handleDeleteCart() {
    setDeletingCart(true);
    try {
      await deleteCart(restaurantId);
      setCart(null);
      setCheckoutOpen(false);
      setAvailableVouchers([]);
      setAppliedVoucher(null);
      setVoucherError(null);
      setCouponError(null);
    } catch {
      // Falla silenciosa
    } finally {
      setDeletingCart(false);
    }
  }

  async function handleApplyVoucher(voucher: ClientVoucher) {
    setVoucherError(null);
    setApplyingVoucherId(voucher.id);

    try {
      const updated = await hydrateCartDishNames(
        await applyClientVoucher(restaurantId, Number(voucher.id)),
      );
      setCart(updated);
      setAppliedVoucher(voucher);
      setAvailableVouchers((previous) =>
        previous.filter((entry) => entry.id !== voucher.id),
      );
    } catch (err) {
      setVoucherError(
        err instanceof Error ? err.message : "No se pudo aplicar el voucher.",
      );
    } finally {
      setApplyingVoucherId(null);
    }
  }

  async function handleRemoveVoucher() {
    setVoucherError(null);
    setRemovingVoucher(true);

    try {
      const removedVoucher = appliedVoucher;
      const updated = await hydrateCartDishNames(await removeClientVoucher(restaurantId));
      setCart(updated);
      setAppliedVoucher(null);

      if (removedVoucher) {
        setAvailableVouchers((previous) =>
          [...previous, removedVoucher].sort((left, right) =>
            left.code.localeCompare(right.code),
          ),
        );
      }
    } catch (err) {
      setVoucherError(
        err instanceof Error ? err.message : "No se pudo quitar el voucher.",
      );
    } finally {
      setRemovingVoucher(false);
    }
  }

  async function handleApplyCoupon(code: string) {
    setCouponError(null);
    setApplyingCoupon(true);

    try {
      const updated = await hydrateCartDishNames(await applyCartCoupon(restaurantId, code));
      setCart(updated);
    } catch (err) {
      setCouponError(
        err instanceof Error ? err.message : "No se pudo aplicar el cupón.",
      );
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handleRemoveCoupon() {
    setCouponError(null);
    setRemovingCoupon(true);

    try {
      const updated = await hydrateCartDishNames(await removeCartCoupon(restaurantId));
      setCart(updated);
    } catch (err) {
      setCouponError(
        err instanceof Error ? err.message : "No se pudo quitar el cupón.",
      );
    } finally {
      setRemovingCoupon(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href={`/client/restaurant/${restaurantId}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-orange-600"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a {restaurant?.name ?? "el restaurante"}
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Tu carrito</h1>
        {cart && (
          <button
            type="button"
            disabled={deletingCart}
            onClick={handleDeleteCart}
            className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
          >
            {deletingCart ? (
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-400" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
            Vaciar carrito
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse justify-between rounded-xl border border-gray-100 bg-white p-4"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-3 w-1/4 rounded bg-gray-100" />
              </div>
              <div className="h-8 w-24 rounded-lg bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {!loading && (!cart || activeItems.length === 0) && (
        <div className="flex flex-col items-center gap-4 py-16 text-gray-400">
          <ShoppingCartIcon className="h-14 w-14" />
          <p className="text-sm">Tu carrito está vacío.</p>
          <Link
            href={`/client/restaurant/${restaurantId}`}
            className="text-sm font-semibold text-orange-700 hover:underline"
          >
            Ver platos del restaurante
          </Link>
        </div>
      )}

      {!loading && cart && activeItems.length > 0 && (
        <div className="items-start lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="min-w-0">
            <div className="mb-6 space-y-3">
              {activeItems.map((item) => {
                const isUpdating = updatingDishId === item.platoId;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {getCartItemName(item)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        ${item.costoUnitario.toFixed(2)} c/u
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center gap-2 rounded-lg border border-orange-200 px-1 py-1">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateItem(item.platoId, -1)}
                          className="rounded p-1 transition-colors hover:bg-orange-50 disabled:opacity-50"
                        >
                          <MinusIcon className="h-3.5 w-3.5 text-orange-700" />
                        </button>

                        {isUpdating ? (
                          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700" />
                        ) : (
                          <span className="min-w-[18px] text-center text-sm font-bold text-orange-700">
                            {item.cantidad}
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateItem(item.platoId, 1)}
                          className="rounded p-1 transition-colors hover:bg-orange-50 disabled:opacity-50"
                        >
                          <PlusIcon className="h-3.5 w-3.5 text-orange-700" />
                        </button>
                      </div>

                      <span className="min-w-[60px] text-right text-sm font-bold text-gray-800">
                        ${item.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  {(hasCouponDiscount || hasVoucherDiscount) && (
                    <p className="text-xs text-gray-500">
                      Subtotal{" "}
                      <span className="font-medium text-gray-700">
                        {formatCartPrice(itemsSubtotal)}
                      </span>
                    </p>
                  )}
                  {hasCouponDiscount && (
                    <p className="text-xs text-green-700">
                      Cupón ({appliedCoupon?.code}){" "}
                      <span className="font-medium">
                        -{formatCartPrice(couponDiscount)}
                      </span>
                    </p>
                  )}
                  {hasVoucherDiscount && (
                    <p className="text-xs text-green-700">
                      Voucher{" "}
                      <span className="font-medium">
                        -{formatCartPrice(subtotalAfterCoupon - cart.total)}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-2xl font-extrabold text-orange-700">
                    {formatCartPrice(cart.total)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen((value) => !value)}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-800"
                >
                  Realizar pedido
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${checkoutOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {checkoutOpen && <CheckoutSection restaurantId={restaurantId} />}
            </div>
          </div>

          <aside className="mt-8 space-y-4 lg:sticky lg:top-24 lg:mt-0">
            <CartCouponPanel
              appliedCoupon={appliedCoupon}
              applying={applyingCoupon}
              removing={removingCoupon}
              error={couponError}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
            />
            <CartVoucherPanel
              vouchers={availableVouchers}
              appliedVoucher={appliedVoucher}
              loading={loadingVouchers}
              applyingVoucherId={applyingVoucherId}
              removingVoucher={removingVoucher}
              error={voucherError}
              onApply={handleApplyVoucher}
              onRemove={handleRemoveVoucher}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
