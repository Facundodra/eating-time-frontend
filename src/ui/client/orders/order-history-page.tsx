"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ReceiptPercentIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import {
  getOrderLocalRating,
  getOrderHistory,
  getOrderHistoryRestaurants,
  type OrderHistoryFilter,
  type OrderHistoryRestaurant,
} from "@/services/client/client-service";
import type { Order, OrderHistoryStatus, OrderRating } from "@/lib/client/types";
import OrderDetailModal from "@/ui/client/orders/order-detail-modal";
import OrderRatingModal from "@/ui/client/ratings/order-rating-modal";

const PAGE_SIZE = 10;

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
  PENDIENTE_CONFIRMACION_LOCAL: "bg-purple-100 text-purple-700",
  ACEPTADO_LOCAL: "bg-blue-100 text-blue-700",
  EN_CURSO_LOCAL: "bg-amber-100 text-amber-700",
  EN_CAMINO_LOCAL: "bg-indigo-100 text-indigo-700",
  FINALIZADO: "bg-green-100 text-green-800",
  RECHAZADO_LOCAL: "bg-red-100 text-red-700",
  CANCELADO_CLIENTE: "bg-gray-200 text-gray-600",
};

const actionButtonClasses =
  "inline-flex shrink-0 items-center rounded-md border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700 transition-colors hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60";

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

const TABLE_GRID_CLASS =
  "grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(0,1.15fr)_minmax(108px,auto)_minmax(104px,auto)_minmax(112px,auto)] sm:items-stretch sm:gap-0";

const TABLE_CELL_CLASS =
  "flex min-w-0 flex-col items-center justify-center px-3 py-4 text-center sm:border-r sm:border-gray-100";

const TABLE_HEADER_CLASS =
  "hidden sm:grid text-[11px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-50/80 border-b border-gray-200";

function TableCell({
  children,
  className = "",
  bordered = true,
}: {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`${TABLE_CELL_CLASS} ${bordered ? "" : "sm:border-r-0"} ${className}`}
    >
      {children}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className={`${TABLE_GRID_CLASS} animate-pulse`}>
      <TableCell>
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="mt-2 h-3 w-16 rounded bg-gray-100" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-28 rounded bg-gray-200" />
      </TableCell>
      <TableCell>
        <div className="h-3 w-20 rounded bg-gray-100" />
        <div className="mt-2 h-3 w-full max-w-40 rounded bg-gray-100" />
      </TableCell>
      <TableCell bordered={false}>
        <div className="h-6 w-24 rounded-full bg-gray-100" />
      </TableCell>
      <TableCell>
        <div className="h-7 w-20 rounded-md bg-gray-100" />
      </TableCell>
      <TableCell className="sm:border-r-0">
        <div className="h-7 w-24 rounded-md bg-gray-100" />
        <div className="mt-2 h-3 w-16 rounded bg-gray-100" />
      </TableCell>
    </div>
  );
}

const sortMap: Record<SortKey, { ordenarPor: "fecha" | "precio"; direccion: "asc" | "desc" }> = {
  "fecha-desc": { ordenarPor: "fecha", direccion: "desc" },
  "fecha-asc": { ordenarPor: "fecha", direccion: "asc" },
  "precio-desc": { ordenarPor: "precio", direccion: "desc" },
  "precio-asc": { ordenarPor: "precio", direccion: "asc" },
};

function toStartOfDay(date: string) {
  return `${date}T00:00:00`;
}

function toEndOfDay(date: string) {
  return `${date}T23:59:59`;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const delta = 1;
  const range: number[] = [];
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
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
  const [restaurantsError, setRestaurantsError] = useState(false);

  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedRatingOrder, setSelectedRatingOrder] = useState<Order | null>(null);
  const [loadingRatingOrderId, setLoadingRatingOrderId] = useState<number | null>(null);
  const [ratingLoadError, setRatingLoadError] = useState<string | null>(null);

  useEffect(() => {
    setRestaurantsLoading(true);
    setRestaurantsError(false);

    getOrderHistoryRestaurants()
      .then(setRestaurants)
      .catch(() => {
        setRestaurants([]);
        setRestaurantsError(true);
      })
      .finally(() => setRestaurantsLoading(false));
  }, []);

  const hasNoOrdersAtAll = !restaurantsLoading && !restaurantsError && restaurants.length === 0;

  useEffect(() => {
    if (restaurantsLoading) return;

    if (hasNoOrdersAtAll) {
      setOrders([]);
      setTotalPages(0);
      setLoading(false);
      setError(null);
      return;
    }

    let ignore = false;

    setLoading(true);
    setError(null);

    getOrderHistory({
      ...appliedFilter,
      ...sortMap[sort],
      page,
      size: PAGE_SIZE,
    })
      .then(({ orders: data, totalPages: total }) => {
        if (ignore) return;
        setOrders(data);
        setTotalPages(total);
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los pedidos.");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [appliedFilter, sort, page, restaurantsLoading, hasNoOrdersAtAll]);

  function applyFilters() {
    const next: OrderHistoryFilter = {};
    if (localId !== "") next.localId = Number(localId);
    if (desde) next.desde = toStartOfDay(desde);
    if (hasta) next.hasta = toEndOfDay(hasta);

    setPage(0);
    setAppliedFilter(next);
  }

  function goToPage(target: number) {
    setPage(target);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function getRestaurantName(id: number) {
    return restaurants.find((r) => r.id === id)?.name ?? `Local #${id}`;
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

    if (isOrderRated(order)) {
      setSelectedRatingOrder(order);
      return;
    }

    setLoadingRatingOrderId(order.id);

    try {
      const rating = await getOrderLocalRating(order.id);

      if (rating) {
        const ratedOrder = mergeOrderRating(order, rating);

        setOrders((currentOrders) =>
          currentOrders.map((currentOrder) =>
            currentOrder.id === order.id ? ratedOrder : currentOrder,
          ),
        );
        setSelectedRatingOrder(ratedOrder);
        return;
      }

      setSelectedRatingOrder(order);
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

  const controlsDisabled = restaurantsLoading;
  const controlClasses =
    "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

  const pageNumbers = getPageNumbers(page + 1, totalPages);
  const showTableLoading = restaurantsLoading || loading;

  return (
    <div className="max-w-[1150px] mx-auto px-4 py-6 space-y-6">
      {selectedRatingOrder ? (
        <OrderRatingModal
          key={selectedRatingOrder.id}
          onClose={() => setSelectedRatingOrder(null)}
          onSaved={(rating) => handleRatingSaved(selectedRatingOrder.id, rating)}
          order={selectedRatingOrder}
        />
      ) : null}

      {selectedDetailOrder ? (
        <OrderDetailModal
          onClose={() => setSelectedDetailOrder(null)}
          order={selectedDetailOrder}
          restaurantId={selectedDetailOrder.restaurantId}
        />
      ) : null}

      <section>
        <h1 className="text-2xl font-bold text-gray-900">Historial de pedidos</h1>
        <p className="text-sm text-gray-500 mt-1">Consultá tus pedidos anteriores.</p>
      </section>

      <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">Ordenar por</span>
            <select
              value={sort}
              disabled={controlsDisabled}
              onChange={(e) => {
                setPage(0);
                setSort(e.target.value as SortKey);
              }}
              className={controlClasses}
            >
              <option value="fecha-desc">Fecha: más recientes</option>
              <option value="fecha-asc">Fecha: más antiguos</option>
              <option value="precio-desc">Precio total: mayor a menor</option>
              <option value="precio-asc">Precio total: menor a mayor</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">Local</span>
            <select
              value={localId}
              disabled={controlsDisabled}
              onChange={(e) => setLocalId(e.target.value)}
              className={controlClasses}
            >
              <option value="">{restaurantsLoading ? "Cargando locales..." : "Todos los locales"}</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">Desde</span>
              <input
                type="date"
                value={desde}
                disabled={controlsDisabled}
                onChange={(e) => setDesde(e.target.value)}
                className={`${controlClasses} w-36`}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">Hasta</span>
              <input
                type="date"
                value={hasta}
                disabled={controlsDisabled}
                onChange={(e) => setHasta(e.target.value)}
                className={`${controlClasses} w-36`}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={applyFilters}
            disabled={controlsDisabled || hasNoOrdersAtAll}
            className="h-10 rounded-md bg-orange-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            Aplicar filtros
          </button>
        </div>

        {restaurantsLoading && (
          <p className="text-xs text-gray-400">
            Cargando locales… los filtros se habilitarán en un momento.
          </p>
        )}
      </div>

      {restaurantsError && !restaurantsLoading && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          No se pudieron cargar los locales desde el back.
        </p>
      )}

      {ratingLoadError ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {ratingLoadError}
        </p>
      ) : null}

      {showTableLoading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
      ) : hasNoOrdersAtAll || orders.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-16 text-center">
          <ReceiptPercentIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            {hasNoOrdersAtAll
              ? "No se encontraron pedidos realizados."
              : "No se encontraron pedidos para los filtros aplicados."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className={`${TABLE_HEADER_CLASS} ${TABLE_GRID_CLASS}`}>
              <TableCell>Fecha / Total</TableCell>
              <TableCell>Local</TableCell>
              <TableCell>Envío</TableCell>
              <TableCell bordered={false}>Estado</TableCell>
              <TableCell>Calificar</TableCell>
              <TableCell className="sm:border-r-0">Detalle</TableCell>
            </div>

            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`${TABLE_GRID_CLASS} transition-colors hover:bg-orange-50/40`}
                >
                  <TableCell>
                    <span className="font-bold text-gray-900">{formatDate(order.creacion)}</span>
                    <p className="mt-1 text-sm font-semibold text-orange-700">
                      {formatPrice(order.total)}
                    </p>
                  </TableCell>

                  <TableCell>
                    <p className="font-semibold text-gray-900 line-clamp-2">
                      {getRestaurantName(order.restaurantId)}
                    </p>
                  </TableCell>

                  <TableCell>
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {order.direccion?.trim() ? order.direccion : "Sin dirección registrada"}
                    </p>
                  </TableCell>

                  <TableCell bordered={false}>
                    <StatusBadge status={order.estado} />
                  </TableCell>

                  <TableCell>
                    {order.estado === "FINALIZADO" ? (
                      <button
                        className={actionButtonClasses}
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
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </TableCell>

                  <TableCell className="sm:border-r-0">
                    <button
                      className={actionButtonClasses}
                      onClick={() => setSelectedDetailOrder(order)}
                      type="button"
                    >
                      Ver detalles
                    </button>
                    <p className="mt-2 text-xs text-gray-400">
                      Pedido <span className="font-semibold text-gray-600">#{order.id}</span>
                    </p>
                  </TableCell>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page === 0}
                className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {pageNumbers.map((p, i) =>
                p === "ellipsis" ? (
                  <span key={`e-${i}`} className="px-2 text-sm text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p - 1)}
                    aria-current={p - 1 === page ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-md px-3 text-sm font-semibold transition-colors ${
                      p - 1 === page
                        ? "bg-orange-700 text-white"
                        : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
