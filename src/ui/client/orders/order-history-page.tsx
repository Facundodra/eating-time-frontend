"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

import type { Order, OrderHistoryStatus, OrderRating } from "@/lib/client/types";
import {
  getOrderHistory,
  getOrderHistoryRestaurants,
  getOrderLocalRating,
  type OrderHistoryFilter,
  type OrderHistoryRestaurant,
} from "@/services/client/client-service";
import OrderDetailModal from "@/ui/client/orders/order-detail-modal";
import OrderRatingModal from "@/ui/client/ratings/order-rating-modal";

const PAGE_SIZE = 10;

type SortKey = "fecha-desc" | "fecha-asc" | "precio-desc" | "precio-asc";

const statusLabels: Record<OrderHistoryStatus, string> = {
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En preparacion",
  EN_CAMINO_LOCAL: "En camino",
  FINALIZADO: "Finalizado",
  RECHAZADO_LOCAL: "Rechazado",
  CANCELADO_CLIENTE: "Cancelado",
};

const statusColors: Record<OrderHistoryStatus, string> = {
  ACEPTADO_LOCAL: "bg-blue-100 text-blue-700",
  EN_CURSO_LOCAL: "bg-amber-100 text-amber-700",
  EN_CAMINO_LOCAL: "bg-indigo-100 text-indigo-700",
  FINALIZADO: "bg-green-100 text-green-800",
  RECHAZADO_LOCAL: "bg-red-100 text-red-700",
  CANCELADO_CLIENTE: "bg-gray-200 text-gray-600",
};

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
  try {
    return new Date(dateStr).toLocaleString("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
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
      <div className="space-y-2">
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-100" />
      </div>
      <div className="h-4 w-2/3 rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-gray-100" />
        <div className="h-3 w-3/4 rounded bg-gray-100" />
      </div>
      <div className="space-y-2 sm:justify-self-end">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-3 w-16 rounded bg-gray-100" />
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sort, setSort] = useState<SortKey>("fecha-desc");
  const [localId, setLocalId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<OrderHistoryFilter>({});
  const [restaurants, setRestaurants] = useState<OrderHistoryRestaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(
    null,
  );
  const [selectedRatingOrder, setSelectedRatingOrder] = useState<Order | null>(
    null,
  );
  const [loadingRatingOrderId, setLoadingRatingOrderId] = useState<
    number | null
  >(null);
  const [ratingLoadError, setRatingLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    setRestaurantsLoading(true);

    getOrderHistoryRestaurants()
      .then((data) => {
        if (!ignore) setRestaurants(data);
      })
      .catch(() => {
        if (!ignore) setRestaurants([]);
      })
      .finally(() => {
        if (!ignore) setRestaurantsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

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

  function applyFilters() {
    const next: OrderHistoryFilter = {};
    if (localId !== "") next.localId = Number(localId);
    if (desde) next.desde = toStartOfDay(desde);
    if (hasta) next.hasta = toEndOfDay(hasta);

    setPage(0);
    setAppliedFilter(next);
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

  async function handleOpenRating(order: Order) {
    setRatingLoadError(null);

    if (order.calificacionLocal) {
      setSelectedRatingOrder(order);
      return;
    }

    setLoadingRatingOrderId(order.id);

    try {
      const rating = await getOrderLocalRating(order.id);

      if (!rating) {
        throw new Error("No se encontro la calificacion guardada.");
      }

      const ratedOrder = mergeOrderRating(order, rating);

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id ? ratedOrder : currentOrder,
        ),
      );
      setSelectedRatingOrder(ratedOrder);
    } catch (err) {
      setRatingLoadError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la calificacion guardada.",
      );
    } finally {
      setLoadingRatingOrderId(null);
    }
  }

  function handleRatingSaved(orderId: number, rating: OrderRating) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? mergeOrderRating(order, rating) : order,
      ),
    );
    window.dispatchEvent(new Event("order-rating-updated"));
  }

  function goToPage(target: number) {
    setPage(target);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function getRestaurantName(id: number) {
    return restaurants.find((restaurant) => restaurant.id === id)?.name ?? `Local #${id}`;
  }

  const controlsDisabled = restaurantsLoading;
  const controlClasses =
    "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";
  const pageNumbers = getPageNumbers(page + 1, totalPages);

  return (
    <div className="mx-auto max-w-[1150px] space-y-6 px-4 py-6">
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

      <section>
        <h1 className="text-2xl font-bold text-gray-900">
          Historial de pedidos
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta tus pedidos anteriores.
        </p>
      </section>

      <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">
              Ordenar por
            </span>
            <select
              className={controlClasses}
              disabled={controlsDisabled}
              onChange={(event) => {
                setPage(0);
                setSort(event.target.value as SortKey);
              }}
              value={sort}
            >
              <option value="fecha-desc">Fecha: mas recientes</option>
              <option value="fecha-asc">Fecha: mas antiguos</option>
              <option value="precio-desc">Precio total: mayor a menor</option>
              <option value="precio-asc">Precio total: menor a mayor</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">
              Local
            </span>
            <select
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
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                Desde
              </span>
              <input
                className={`${controlClasses} w-36`}
                disabled={controlsDisabled}
                onChange={(event) => setDesde(event.target.value)}
                type="date"
                value={desde}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                Hasta
              </span>
              <input
                className={`${controlClasses} w-36`}
                disabled={controlsDisabled}
                onChange={(event) => setHasta(event.target.value)}
                type="date"
                value={hasta}
              />
            </label>
          </div>

          <button
            className="h-10 rounded-md bg-orange-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-orange-300"
            disabled={controlsDisabled}
            onClick={applyFilters}
            type="button"
          >
            Aplicar filtros
          </button>
        </div>

        {restaurantsLoading ? (
          <p className="text-xs text-gray-400">
            Cargando locales... los filtros se habilitaran en un momento.
          </p>
        ) : null}
      </div>

      {ratingLoadError ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {ratingLoadError}
        </p>
      ) : null}

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-16 text-center">
          <ReceiptPercentIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            No se encontraron pedidos para los filtros aplicados.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            {orders.map((order) => (
              <div
                className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-orange-50/40 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_auto] sm:items-center sm:gap-8"
                key={order.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-bold text-gray-900">
                      {formatDate(order.creacion)}
                    </span>
                    <StatusBadge status={order.estado} />
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-orange-700">
                    {formatPrice(order.total)}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="line-clamp-2 font-semibold text-gray-900">
                    {getRestaurantName(order.restaurantId)}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500">Envio a:</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
                    {order.direccion?.trim()
                      ? order.direccion
                      : "Sin direccion registrada"}
                  </p>
                </div>

                <div className="space-y-1.5 sm:justify-self-end sm:text-right">
                  <button
                    className="text-sm font-semibold text-orange-700 transition-colors hover:text-orange-800 hover:underline"
                    onClick={() => setSelectedDetailOrder(order)}
                    type="button"
                  >
                    Ver detalles
                  </button>

                  {order.estado === "FINALIZADO" && isOrderRated(order) ? (
                    <button
                      className="block text-sm font-semibold text-orange-700 transition-colors hover:text-orange-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
                      disabled={loadingRatingOrderId === order.id}
                      onClick={() => void handleOpenRating(order)}
                      type="button"
                    >
                      {loadingRatingOrderId === order.id
                        ? "Cargando..."
                        : "Ver calificacion"}
                    </button>
                  ) : null}

                  {order.urlFactura ? (
                    <Link
                      className="block text-sm font-semibold text-orange-700 transition-colors hover:text-orange-800 hover:underline"
                      href={order.urlFactura}
                      target="_blank"
                    >
                      Ver factura
                    </Link>
                  ) : null}

                  <p className="mt-0.5 text-xs text-gray-400">
                    Pedido{" "}
                    <span className="font-semibold text-gray-600">#{order.id}</span>
                    {" - "}
                    {itemCount(order)} {itemCount(order) === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 ? (
            <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <button
                aria-label="Pagina anterior"
                className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                        ? "bg-orange-700 text-white"
                        : "border border-gray-200 text-gray-700 hover:bg-gray-50"
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
                aria-label="Pagina siguiente"
                className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
