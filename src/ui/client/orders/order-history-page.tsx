"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptPercentIcon } from "@heroicons/react/24/outline";

import type { Order, OrderHistoryStatus, OrderRating } from "@/lib/client/types";
import {
  getOrderHistory,
  getOrderLocalRating,
  getOrderHistoryRestaurants,
  type OrderHistoryFilter,
  type OrderHistoryRestaurant,
} from "@/services/client/client-service";
import OrderDetailModal from "@/ui/client/orders/order-detail-modal";
import OrderRatingModal from "@/ui/client/ratings/order-rating-modal";
import LocalNameWidget from "@/ui/shared/widgets/local-name-widget";

const PAGE_SIZE = 10;

type SortKey = "fecha-desc" | "fecha-asc" | "precio-desc" | "precio-asc";

const statusLabels: Record<OrderHistoryStatus, string> = {
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En preparación",
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
      className={`rounded-full px-3 py-1 text-xs font-bold ${
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

function toStartOfDay(date: string) {
  return `${date}T00:00:00`;
}

function toEndOfDay(date: string) {
  return `${date}T23:59:59`;
}

function OrderCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="h-4 w-1/4 rounded bg-gray-200" />
        <div className="h-5 w-20 rounded-full bg-gray-100" />
      </div>
      <div className="h-3 w-1/3 rounded bg-gray-100" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-3 w-1/4 rounded bg-gray-100" />
        <div className="h-4 w-1/5 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sort, setSort] = useState<SortKey>("fecha-desc");
  const [localId, setLocalId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<OrderHistoryFilter>({});
  const [restaurants, setRestaurants] = useState<OrderHistoryRestaurant[]>([]);
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
    getOrderHistoryRestaurants()
      .then(setRestaurants)
      .catch(() => setRestaurants([]));
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadOrders() {
      const isNewSearch = page === 0;
      if (isNewSearch) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const { orders: data, totalPages: total } = await getOrderHistory({
          ...appliedFilter,
          ...sortMap[sort],
          page,
          size: PAGE_SIZE,
        });

        if (ignore) return;

        setOrders((prev) => (isNewSearch ? data : [...prev, ...data]));
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
        if (!ignore) {
          if (isNewSearch) setLoading(false);
          else setLoadingMore(false);
        }
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
        throw new Error("No se encontró la calificación guardada.");
      }

      const ratedOrder = mergeOrderRating(order, rating);

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id ? ratedOrder : currentOrder,
        ),
      );

      setSelectedRatingOrder(ratedOrder);
    } catch (error) {
      setRatingLoadError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la calificación guardada.",
      );
    } finally {
      setLoadingRatingOrderId(null);
    }
  }

  const hasMore = page < totalPages - 1;

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 px-4 py-6">
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
          onSaved={() => undefined}
          order={selectedRatingOrder}
        />
      ) : null}

      <section>
        <h1 className="text-2xl font-bold text-gray-900">
          Historial de pedidos
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Consultá tus pedidos anteriores.
        </p>
      </section>

      <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">
              Ordenar por
            </span>
            <select
              value={sort}
              onChange={(event) => {
                setPage(0);
                setSort(event.target.value as SortKey);
              }}
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            >
              <option value="fecha-desc">Fecha: más recientes</option>
              <option value="fecha-asc">Fecha: más antiguos</option>
              <option value="precio-desc">Precio total: mayor a menor</option>
              <option value="precio-asc">Precio total: menor a mayor</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">
              Local
            </span>
            <select
              value={localId}
              onChange={(event) => setLocalId(event.target.value)}
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Todos los locales</option>
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
                type="date"
                value={desde}
                onChange={(event) => setDesde(event.target.value)}
                className="h-10 w-36 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                Hasta
              </span>
              <input
                type="date"
                value={hasta}
                onChange={(event) => setHasta(event.target.value)}
                className="h-10 w-36 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={applyFilters}
            className="h-10 rounded-md bg-orange-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-800"
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      {ratingLoadError ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {ratingLoadError}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <OrderCardSkeleton key={index} />
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
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-orange-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <h2 className="font-bold text-gray-900">
                        Pedido #{order.id}
                      </h2>
                      <button
                        className="inline-flex shrink-0 items-center rounded-md border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700 transition-colors hover:border-orange-300 hover:bg-orange-50"
                        onClick={() => setSelectedDetailOrder(order)}
                        type="button"
                      >
                        Ver detalles
                      </button>
                      {order.estado === "FINALIZADO" && isOrderRated(order) ? (
                        <button
                          className="inline-flex shrink-0 items-center rounded-md border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700 transition-colors hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={loadingRatingOrderId === order.id}
                          onClick={() => void handleOpenRating(order)}
                          type="button"
                        >
                          {loadingRatingOrderId === order.id
                            ? "Cargando..."
                            : "Ver calificación"}
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-sm text-gray-500">
                      <LocalNameWidget localId={order.restaurantId} />
                    </div>
                  </div>
                  <StatusBadge status={order.estado} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">
                    {formatDate(order.creacion)}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">
                      {itemCount(order)} {itemCount(order) === 1 ? "ítem" : "ítems"}
                    </span>
                    <span className="text-sm font-bold text-orange-700">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {order.urlFactura ? (
                  <div className="mt-3">
                    <Link
                      href={order.urlFactura}
                      target="_blank"
                      className="text-xs font-semibold text-orange-700 hover:underline"
                    >
                      Ver factura
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-600" />
                    Cargando...
                  </>
                ) : (
                  "Cargar más"
                )}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
