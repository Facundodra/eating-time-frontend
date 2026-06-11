"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptPercentIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import {
  getOrderHistory,
  getOrderHistoryRestaurants,
  type OrderHistoryFilter,
  type OrderHistoryRestaurant,
} from "@/services/client/client-service";
import type { Order, OrderHistoryStatus } from "@/lib/client/types";

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

function RowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_auto] sm:items-center sm:gap-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-100" />
      </div>
      <div className="h-4 w-2/3 rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-gray-100" />
        <div className="h-3 w-3/4 rounded bg-gray-100" />
      </div>
      <div className="space-y-2 sm:items-end sm:justify-self-end">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-3 w-16 rounded bg-gray-100" />
      </div>
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

// Construye la secuencia de páginas a mostrar (1-indexada) con elipsis.
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

  // Filtros
  const [sort, setSort] = useState<SortKey>("fecha-desc");
  const [localId, setLocalId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<OrderHistoryFilter>({});

  // Locales con pedidos en el historial (para filtro y nombres en las filas)
  const [restaurants, setRestaurants] = useState<OrderHistoryRestaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);

  useEffect(() => {
    setRestaurantsLoading(true);
    getOrderHistoryRestaurants()
      .then(setRestaurants)
      .catch(() => setRestaurants([]))
      .finally(() => setRestaurantsLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getOrderHistory({
      ...appliedFilter,
      ...sortMap[sort],
      page,
      size: PAGE_SIZE,
    })
      .then(({ orders: data, totalPages: total }) => {
        setOrders(data);
        setTotalPages(total);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudieron cargar los pedidos."),
      )
      .finally(() => setLoading(false));
  }, [appliedFilter, sort, page]);

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

  // Hasta que no terminen de cargar los locales, no se puede ordenar ni filtrar.
  const controlsDisabled = restaurantsLoading;
  const controlClasses =
    "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

  const pageNumbers = getPageNumbers(page + 1, totalPages);

  return (
    <div className="max-w-[1150px] mx-auto px-4 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">Historial de pedidos</h1>
        <p className="text-sm text-gray-500 mt-1">Consultá tus pedidos anteriores.</p>
      </section>

      {/* Barra de filtros */}
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
            disabled={controlsDisabled}
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

      {/* Resultados */}
      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
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
                key={order.id}
                className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-orange-50/40 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_auto] sm:items-center sm:gap-8"
              >
                {/* Fecha + total + estado */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-bold text-gray-900">{formatDate(order.creacion)}</span>
                    <StatusBadge status={order.estado} />
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-orange-700">
                    {formatPrice(order.total)}
                  </p>
                </div>

                {/* Local */}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 line-clamp-2">
                    {getRestaurantName(order.restaurantId)}
                  </p>
                </div>

                {/* Dirección de entrega del cliente */}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500">Envío a:</p>
                  <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">
                    {order.direccion?.trim() ? order.direccion : "Sin dirección registrada"}
                  </p>
                </div>

                {/* Ver detalles + id */}
                <div className="sm:justify-self-end sm:text-right">
                  <Link
                    href={`/client/order-history/${order.id}`}
                    className="text-sm font-semibold text-orange-700 transition-colors hover:text-orange-800 hover:underline"
                  >
                    Ver detalles
                  </Link>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Pedido <span className="font-semibold text-gray-600">#{order.id}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación numerada */}
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
