"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowPathIcon,
  ArrowsUpDownIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ReceiptPercentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import type { Order, OrderClaim, OrderHistoryStatus, OrderRating } from "@/lib/client/types";
import { loadOrderClaimsByOrderId } from "@/services/client/claim-service";
import {
  getOrderHistory,
  getOrderHistoryRestaurants,
  getOrderLocalRating,
  getRestaurantName as fetchRestaurantName,
  type OrderHistoryFilter,
  type OrderHistoryRestaurant,
} from "@/services/client/client-service";
import ViewClaimModal from "@/ui/client/complaints/view-claim-modal";
import OrderDetailModal from "@/ui/client/orders/order-detail-modal";
import OrderRatingModal from "@/ui/client/ratings/order-rating-modal";

const PAGE_SIZE = 10;

const CLAIM_ELIGIBLE_STATUSES: OrderHistoryStatus[] = [
  "RECHAZADO_LOCAL",
  "ACEPTADO_LOCAL",
  "EN_CURSO_LOCAL",
  "EN_CAMINO_LOCAL",
  "FINALIZADO",
];

function isClaimEligible(status: OrderHistoryStatus) {
  return CLAIM_ELIGIBLE_STATUSES.includes(status);
}

type SortKey = "fecha-desc" | "fecha-asc" | "precio-desc" | "precio-asc";

const statusLabels: Record<OrderHistoryStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL: "Esperando al local",
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En preparación",
  EN_CAMINO_LOCAL: "En camino",
  FINALIZADO: "Finalizado",
  RECHAZADO_LOCAL: "Rechazado",
  CANCELADO_CLIENTE: "Cancelado",
};

const statusColors: Record<OrderHistoryStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  ACEPTADO_LOCAL: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  EN_CURSO_LOCAL:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  EN_CAMINO_LOCAL:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  FINALIZADO: "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300",
  RECHAZADO_LOCAL: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  CANCELADO_CLIENTE:
    "bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
};

const statusOptions: Array<[OrderHistoryStatus, string]> = [
  ["ACEPTADO_LOCAL", statusLabels.ACEPTADO_LOCAL],
  ["EN_CURSO_LOCAL", statusLabels.EN_CURSO_LOCAL],
  ["EN_CAMINO_LOCAL", statusLabels.EN_CAMINO_LOCAL],
  ["FINALIZADO", statusLabels.FINALIZADO],
  ["RECHAZADO_LOCAL", statusLabels.RECHAZADO_LOCAL],
  ["CANCELADO_CLIENTE", statusLabels.CANCELADO_CLIENTE],
];

const sortMap: Record<
  SortKey,
  { ordenarPor: "fecha" | "precio"; direccion: "asc" | "desc" }
> = {
  "fecha-desc": { ordenarPor: "fecha", direccion: "desc" },
  "fecha-asc": { ordenarPor: "fecha", direccion: "asc" },
  "precio-desc": { ordenarPor: "precio", direccion: "desc" },
  "precio-asc": { ordenarPor: "precio", direccion: "asc" },
};

function StatusBadge({ status }: { status: OrderHistoryStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
        statusColors[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number) {
  return `$${price.toLocaleString("es-UY")}`;
}

function itemCount(order: Order) {
  return order.items
    .filter((item) => item.eliminacion == null)
    .reduce((sum, item) => sum + item.cantidad, 0);
}

function RowSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_auto] sm:items-center sm:gap-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="space-y-2">
          <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-slate-800/70" />
        </div>
        <div className="h-7 w-24 rounded-full bg-gray-100 dark:bg-slate-800/70" />
      </div>
      <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-800" />
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-gray-100 dark:bg-slate-800/70" />
        <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-slate-800/70" />
      </div>
      <div className="space-y-2 sm:justify-self-end">
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-800" />
        <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-800/70" />
      </div>
    </div>
  );
}

function toStartOfDay(date: string) {
  return `${date}T00:00:00`;
}

function toEndOfDay(date: string) {
  return `${date}T23:59:59`;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const delta = 1;
  const range: number[] = [];

  for (
    let i = Math.max(1, current - delta);
    i <= Math.min(total, current + delta);
    i += 1
  ) {
    range.push(i);
  }

  const pages: (number | "ellipsis")[] = [];

  if (range[0] > 1) {
    pages.push(1);
    if (range[0] > 2) pages.push("ellipsis");
  }

  pages.push(...range);

  const last = range[range.length - 1];

  if (last < total) {
    if (last < total - 1) pages.push("ellipsis");
    pages.push(total);
  }

  return pages;
}

export default function OrderHistoryPage() {
  const searchParams = useSearchParams();
  const showClaimSuccessBanner = searchParams.get("reclamoEnviado") === "1";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sort, setSort] = useState<SortKey>("fecha-desc");
  const [localId, setLocalId] = useState("");
  const [status, setStatus] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState<OrderHistoryFilter>({});
  const [restaurants, setRestaurants] = useState<OrderHistoryRestaurant[]>([]);
  const [restaurantNames, setRestaurantNames] = useState<Record<number, string>>({});
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState(false);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedRatingOrder, setSelectedRatingOrder] = useState<Order | null>(null);
  const [loadingRatingOrderId, setLoadingRatingOrderId] = useState<number | null>(null);
  const [ratingLoadError, setRatingLoadError] = useState<string | null>(null);
  const [orderClaims, setOrderClaims] = useState<Record<number, OrderClaim>>({});
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [selectedClaimOrder, setSelectedClaimOrder] = useState<Order | null>(null);

  useEffect(() => {
    let ignore = false;

    setRestaurantsLoading(true);
    setRestaurantsError(false);

    getOrderHistoryRestaurants()
      .then((data) => {
        if (ignore) return;

        setRestaurants(data);
        setRestaurantNames((currentNames) => {
          const nextNames = { ...currentNames };
          let hasNewName = false;

          data.forEach((restaurant) => {
            if (nextNames[restaurant.id] !== restaurant.name) {
              nextNames[restaurant.id] = restaurant.name;
              hasNewName = true;
            }
          });

          return hasNewName ? nextNames : currentNames;
        });
      })
      .catch(() => {
        if (ignore) return;
        setRestaurants([]);
        setRestaurantsError(true);
      })
      .finally(() => {
        if (!ignore) setRestaurantsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;

    let ignore = false;
    const missingRestaurantIds = Array.from(
      new Set(
        orders
          .map((order) => order.restaurantId)
          .filter((restaurantId) => restaurantNames[restaurantId] == null),
      ),
    );

    if (missingRestaurantIds.length === 0) return;

    async function loadRestaurantNames() {
      const loadedNames = await Promise.all(
        missingRestaurantIds.map(async (restaurantId) => {
          try {
            return {
              id: restaurantId,
              name: await fetchRestaurantName(restaurantId),
            };
          } catch {
            return null;
          }
        }),
      );

      if (ignore) return;

      setRestaurantNames((currentNames) => {
        const nextNames = { ...currentNames };
        let hasNewName = false;

        loadedNames.forEach((restaurant) => {
          if (restaurant && nextNames[restaurant.id] !== restaurant.name) {
            nextNames[restaurant.id] = restaurant.name;
            hasNewName = true;
          }
        });

        return hasNewName ? nextNames : currentNames;
      });
    }

    void loadRestaurantNames();

    return () => {
      ignore = true;
    };
  }, [orders, restaurantNames]);

  useEffect(() => {
    let ignore = false;

    async function loadOrders() {
      setLoading(true);
      setError(null);

      try {
        const { orders: data, totalPages: total } = await getOrderHistory({
          ...appliedFilter,
          ...sortMap[sort],
          page,
          size: PAGE_SIZE,
        });

        if (ignore) return;

        setOrders(data);
        setRestaurantNames((currentNames) => {
          const nextNames = { ...currentNames };
          let hasNewName = false;

          data.forEach((order) => {
            if (order.restaurantName && nextNames[order.restaurantId] !== order.restaurantName) {
              nextNames[order.restaurantId] = order.restaurantName;
              hasNewName = true;
            }
          });

          return hasNewName ? nextNames : currentNames;
        });
        setTotalPages(total);
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los pedidos.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadOrders();

    return () => {
      ignore = true;
    };
  }, [appliedFilter, sort, page]);

  useEffect(() => {
    const eligibleOrderIds = orders
      .filter((order) => isClaimEligible(order.estado))
      .map((order) => order.id);

    if (eligibleOrderIds.length === 0) {
      setOrderClaims({});
      setClaimsLoading(false);
      return;
    }

    let ignore = false;
    setClaimsLoading(true);

    loadOrderClaimsByOrderId(eligibleOrderIds)
      .then((claims) => {
        if (!ignore) setOrderClaims(claims);
      })
      .catch(() => {
        if (!ignore) setOrderClaims({});
      })
      .finally(() => {
        if (!ignore) setClaimsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [orders]);

  function applyFilters() {
    const next: OrderHistoryFilter = {};

    if (localId !== "") next.localId = Number(localId);
    if (status !== "") next.estado = status as OrderHistoryStatus;
    if (desde) next.desde = toStartOfDay(desde);
    if (hasta) next.hasta = toEndOfDay(hasta);

    setPage(0);
    setAppliedFilter(next);
  }

  function clearFilters() {
    setLocalId("");
    setStatus("");
    setDesde("");
    setHasta("");
    setPage(0);
    setAppliedFilter({});
    setIsMobileFiltersOpen(false);
  }

  function mergeOrderRating(order: Order, rating: OrderRating): Order {
    return {
      ...order,
      calificacionLocal: rating,
      hasLocalRating: true,
    };
  }

  function isOrderRated(order: Order) {
    return order.hasLocalRating || Boolean(order.calificacionLocal);
  }

  function handleRatingSaved(orderId: number, rating: OrderRating) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? mergeOrderRating(order, rating) : order,
      ),
    );

    window.dispatchEvent(new Event("order-rating-updated"));
  }

  async function handleOpenRating(order: Order) {
    setRatingLoadError(null);

    if (!isOrderRated(order)) {
      setSelectedRatingOrder(order);
      return;
    }

    setLoadingRatingOrderId(order.id);

    try {
      const rating = await getOrderLocalRating(order.id);

      if (!rating) {
        if (order.calificacionLocal) {
          setSelectedRatingOrder(order);
          return;
        }

        throw new Error("No se encontró la calificación guardada.");
      }

      const ratedOrder = mergeOrderRating(order, rating);

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id ? ratedOrder : currentOrder,
        ),
      );
      setSelectedRatingOrder(ratedOrder);
      return;
    } catch (err) {
      setRatingLoadError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la calificación guardada.",
      );
    } finally {
      setLoadingRatingOrderId(null);
    }
  }

  function goToPage(target: number) {
    setPage(target);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function getRestaurantDisplayName(order: Order) {
    return (
      order.restaurantName ??
      restaurantNames[order.restaurantId] ??
      restaurants.find((restaurant) => restaurant.id === order.restaurantId)?.name ??
      `Local #${order.restaurantId}`
    );
  }

  const controlsDisabled = restaurantsLoading;
  const controlClasses =
    "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-900 dark:disabled:text-slate-500";
  const mobileControlClasses =
    "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-900 dark:disabled:text-slate-500";
  const hasActiveFilters =
    localId !== "" || status !== "" || desde !== "" || hasta !== "";
  const actionClasses =
    "text-sm font-semibold text-orange-700 transition-colors hover:text-orange-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-orange-300 dark:hover:text-orange-200";
  const viewClaimClasses =
    "block text-sm font-semibold text-indigo-700 transition-colors hover:text-indigo-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-indigo-300 dark:hover:text-indigo-200";
  const pageNumbers = getPageNumbers(page + 1, totalPages);

  return (
    <div className="space-y-6">
      {selectedDetailOrder ? (
        <OrderDetailModal
          onClose={() => setSelectedDetailOrder(null)}
          order={selectedDetailOrder}
          restaurantId={selectedDetailOrder.restaurantId}
        />
      ) : null}

      {selectedRatingOrder ? (
        <OrderRatingModal
          key={selectedRatingOrder.id}
          onClose={() => setSelectedRatingOrder(null)}
          onSaved={(rating) => handleRatingSaved(selectedRatingOrder.id, rating)}
          order={selectedRatingOrder}
        />
      ) : null}

      {selectedClaimOrder && orderClaims[selectedClaimOrder.id] ? (
        <ViewClaimModal
          claim={orderClaims[selectedClaimOrder.id]}
          onClose={() => setSelectedClaimOrder(null)}
          restaurantName={getRestaurantDisplayName(selectedClaimOrder)}
        />
      ) : null}

      <section>
        <Link
          href="/client/mi-cuenta"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Volver a mi cuenta
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          Historial de pedidos
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Consultá tus pedidos anteriores.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 xl:hidden">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              aria-label="Abrir filtros"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              <FunnelIcon className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-600 dark:bg-orange-400" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Limpiar filtros"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              >
                <FunnelIcon className="h-5 w-5" />
                <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
              </button>
            )}

            <button
              type="button"
              onClick={applyFilters}
              disabled={controlsDisabled}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              aria-label="Actualizar filtros"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
              <label htmlFor="client-order-history-sort-mobile" className="sr-only">
                Orden
              </label>
              <select
                id="client-order-history-sort-mobile"
                value={sort}
                onChange={(event) => {
                  setPage(0);
                  setSort(event.target.value as SortKey);
                }}
                className="h-11 w-[150px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="fecha-desc">Más recientes</option>
                <option value="fecha-asc">Más antiguas</option>
                <option value="precio-desc">Mayor precio</option>
                <option value="precio-asc">Menor precio</option>
              </select>
            </div>
          </div>

          {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 pb-4 pt-20 backdrop-blur-sm sm:items-center sm:pt-16">
              <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-xl sm:max-w-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      Filtros
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Ajusta el historial visible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    aria-label="Cerrar filtros"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:text-orange-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-orange-400"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-4 px-5 py-5">
                  <label htmlFor="client-order-history-local-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Local
                    </span>
                    <select
                      id="client-order-history-local-mobile"
                      className={mobileControlClasses}
                      disabled={controlsDisabled}
                      onChange={(event) => setLocalId(event.target.value)}
                      value={localId}
                    >
                      <option value="">
                        {restaurantsLoading ? "Cargando locales..." : "Todos los locales"}
                      </option>
                      {restaurants.map((restaurant) => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label htmlFor="client-order-history-status-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Estado
                    </span>
                    <select
                      id="client-order-history-status-mobile"
                      className={mobileControlClasses}
                      disabled={controlsDisabled}
                      onChange={(event) => setStatus(event.target.value)}
                      value={status}
                    >
                      <option value="">Todos los estados</option>
                      {statusOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label htmlFor="client-order-history-from-mobile" className="block">
                      <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        Desde
                      </span>
                      <input
                        id="client-order-history-from-mobile"
                        className={mobileControlClasses}
                        disabled={controlsDisabled}
                        onChange={(event) => setDesde(event.target.value)}
                        type="date"
                        value={desde}
                      />
                    </label>

                    <label htmlFor="client-order-history-to-mobile" className="block">
                      <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        Hasta
                      </span>
                      <input
                        id="client-order-history-to-mobile"
                        className={mobileControlClasses}
                        disabled={controlsDisabled}
                        onChange={(event) => setHasta(event.target.value)}
                        type="date"
                        value={hasta}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-gray-200 px-5 py-4 dark:border-slate-800">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
                    >
                      Limpiar filtros
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      applyFilters();
                      setIsMobileFiltersOpen(false);
                    }}
                    disabled={controlsDisabled}
                    className="h-11 flex-1 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300 dark:disabled:bg-orange-900/60"
                  >
                    Ver resultados
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden gap-5 xl:grid xl:grid-cols-[minmax(12rem,1fr)_14rem_12rem_auto_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <select
              aria-label="Ordenar pedidos"
              className={controlClasses}
              onChange={(event) => {
                setPage(0);
                setSort(event.target.value as SortKey);
              }}
              value={sort}
            >
              <option value="fecha-desc">Fecha: más recientes</option>
              <option value="fecha-asc">Fecha: más antiguas</option>
              <option value="precio-desc">Precio total: mayor a menor</option>
              <option value="precio-asc">Precio total: menor a mayor</option>
            </select>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <BuildingStorefrontIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <select
              aria-label="Filtrar por local"
              className={controlClasses}
              disabled={controlsDisabled}
              onChange={(event) => setLocalId(event.target.value)}
              value={localId}
            >
              <option value="">
                {restaurantsLoading ? "Cargando locales..." : "Todos los locales"}
              </option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <select
              aria-label="Filtrar por estado"
              className={controlClasses}
              disabled={controlsDisabled}
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="">Todos los estados</option>
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-[auto_8.75rem_auto_8.75rem] items-center gap-1.5">
            <CalendarDaysIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <input
              aria-label="Fecha desde"
              className={controlClasses}
              disabled={controlsDisabled}
              onChange={(event) => setDesde(event.target.value)}
              type="date"
              value={desde}
            />
            <span className="text-slate-400">-</span>
            <input
              aria-label="Fecha hasta"
              className={controlClasses}
              disabled={controlsDisabled}
              onChange={(event) => setHasta(event.target.value)}
              type="date"
              value={hasta}
            />
          </div>

          <button
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            disabled={controlsDisabled}
            onClick={applyFilters}
            type="button"
            aria-label="Actualizar filtros"
            title="Actualizar filtros"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>

        {restaurantsLoading ? (
          <p className="mt-4 text-xs text-gray-400 dark:text-slate-500">
            Cargando locales... los filtros se habilitarán en un momento.
          </p>
        ) : null}
      </section>

      {restaurantsError ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          No se pudieron cargar los locales desde el servidor.
        </p>
      ) : null}

      {ratingLoadError ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {ratingLoadError}
        </p>
      ) : null}

      {showClaimSuccessBanner ? (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:bg-green-500/10 dark:text-green-300">
          Tu reclamo fue enviado correctamente. El local lo revisará a la brevedad.
        </p>
      ) : null}

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
          {Array.from({ length: 5 }).map((_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <ReceiptPercentIcon className="mx-auto h-10 w-10 text-gray-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
            No se encontraron pedidos para los filtros aplicados.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
            {orders.map((order) => (
              <div
                className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-orange-50/40 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_auto] sm:items-center sm:gap-8 dark:hover:bg-orange-500/5"
                key={order.id}
              >
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <span className="block truncate font-bold text-gray-900 dark:text-white">
                      {formatDate(order.creacion)}
                    </span>
                    <p className="mt-0.5 text-sm font-semibold text-orange-700 dark:text-orange-300">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                  <div className="flex min-w-[112px] justify-end">
                    <StatusBadge status={order.estado} />
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="line-clamp-2 font-semibold text-gray-900 dark:text-white">
                    {getRestaurantDisplayName(order)}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-500">
                    Recibido en:
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-slate-400">
                    {order.direccion?.trim()
                      ? order.direccion
                      : "Sin dirección registrada"}
                  </p>
                </div>

                <div className="space-y-1.5 sm:justify-self-end sm:text-right">
                  <button
                    className={actionClasses}
                    onClick={() => setSelectedDetailOrder(order)}
                    type="button"
                  >
                    Ver detalles
                  </button>

                  {order.estado === "FINALIZADO" ? (
                    <button
                      className={`block sm:ml-auto ${actionClasses}`}
                      disabled={loadingRatingOrderId === order.id}
                      onClick={() => void handleOpenRating(order)}
                      type="button"
                    >
                      {loadingRatingOrderId === order.id
                        ? "Cargando..."
                        : isOrderRated(order)
                          ? "Ver calificación"
                          : "Calificar"}
                    </button>
                  ) : null}

                  {isClaimEligible(order.estado) ? (
                    claimsLoading ? (
                      <span className="block text-xs text-gray-400 dark:text-slate-500 sm:ml-auto sm:text-right">
                        ...
                      </span>
                    ) : orderClaims[order.id] ? (
                      <button
                        className={`block sm:ml-auto ${viewClaimClasses}`}
                        onClick={() => setSelectedClaimOrder(order)}
                        type="button"
                      >
                        Ver reclamo
                      </button>
                    ) : (
                      <Link
                        className={`block sm:ml-auto ${actionClasses}`}
                        href={`/client/complaint/${order.id}`}
                      >
                        Iniciar reclamo
                      </Link>
                    )
                  ) : null}

                  <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                    Pedido{" "}
                    <span className="font-semibold text-gray-600 dark:text-slate-300">
                      #{order.id}
                    </span>
                    {" - "}
                    {itemCount(order)} {itemCount(order) === 1 ? "ítem" : "ítems"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 ? (
            <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <button
                aria-label="Página anterior"
                className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                disabled={page === 0}
                onClick={() => goToPage(page - 1)}
                type="button"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {pageNumbers.map((pageNumber, index) =>
                pageNumber === "ellipsis" ? (
                  <span className="px-2 text-sm text-gray-400" key={`e-${index}`}>
                    ...
                  </span>
                ) : (
                  <button
                    aria-current={pageNumber - 1 === page ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-md px-3 text-sm font-semibold transition-colors ${
                      pageNumber - 1 === page
                        ? "bg-orange-700 text-white dark:bg-orange-600"
                        : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                    key={pageNumber}
                    onClick={() => goToPage(pageNumber - 1)}
                    type="button"
                  >
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                aria-label="Página siguiente"
                className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                disabled={page >= totalPages - 1}
                onClick={() => goToPage(page + 1)}
                type="button"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
