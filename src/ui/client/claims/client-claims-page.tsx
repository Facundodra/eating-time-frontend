"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  ArrowsUpDownIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  HashtagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import type { OrderClaim, OrderClaimStatus } from "@/lib/client/types";
import {
  getClientClaimRestaurants,
  getClientClaims,
  type ClientClaimFilter,
  type ClientClaimRestaurant,
} from "@/services/client/claim-service";
import ViewClaimModal from "@/ui/client/complaints/view-claim-modal";

const PAGE_SIZE = 10;

type SortKey = "estado-desc" | "fecha-desc" | "fecha-asc";

const statusLabels: Record<OrderClaimStatus, string> = {
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

const statusColors: Record<OrderClaimStatus, string> = {
  PENDIENTE:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200",
  APROBADO:
    "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300",
  RECHAZADO: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
};

const statusOptions: Array<[OrderClaimStatus, string]> = [
  ["PENDIENTE", statusLabels.PENDIENTE],
  ["APROBADO", statusLabels.APROBADO],
  ["RECHAZADO", statusLabels.RECHAZADO],
];

const sortMap: Record<
  SortKey,
  Pick<ClientClaimFilter, "ordenarPor" | "direccion">
> = {
  "estado-desc": { ordenarPor: "estado", direccion: "desc" },
  "fecha-desc": { ordenarPor: "fecha", direccion: "desc" },
  "fecha-asc": { ordenarPor: "fecha", direccion: "asc" },
};

function StatusBadge({ status }: { status: OrderClaimStatus }) {
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

function formatPrice(price: number | null | undefined) {
  if (price == null) return "—";
  return `$${price.toLocaleString("es-UY")}`;
}

function truncateText(text: string, maxLength = 120) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
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

function RowSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center sm:gap-8">
      <div className="space-y-2">
        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-800" />
        <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-slate-800/70" />
      </div>
      <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-800" />
      <div className="h-3 w-full rounded bg-gray-100 dark:bg-slate-800/70" />
      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-slate-800 sm:justify-self-end" />
    </div>
  );
}

export default function ClientClaimsPage() {
  const [claims, setClaims] = useState<OrderClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sort, setSort] = useState<SortKey>("estado-desc");
  const [localId, setLocalId] = useState("");
  const [status, setStatus] = useState("");
  const [pedidoId, setPedidoId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState<ClientClaimFilter>({});
  const [restaurants, setRestaurants] = useState<ClientClaimRestaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<OrderClaim | null>(null);

  useEffect(() => {
    let ignore = false;

    setRestaurantsLoading(true);
    setRestaurantsError(false);

    getClientClaimRestaurants()
      .then((data) => {
        if (!ignore) setRestaurants(data);
      })
      .catch(() => {
        if (!ignore) {
          setRestaurants([]);
          setRestaurantsError(true);
        }
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

    async function loadClaims() {
      setLoading(true);
      setError(null);

      try {
        const { claims: data, totalPages: total } = await getClientClaims({
          ...appliedFilter,
          ...sortMap[sort],
          page,
          size: PAGE_SIZE,
        });

        if (ignore) return;

        setClaims(data);
        setTotalPages(total);
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los reclamos.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadClaims();

    return () => {
      ignore = true;
    };
  }, [appliedFilter, sort, page]);

  function applyFilters() {
    const next: ClientClaimFilter = {};

    if (localId !== "") next.localId = Number(localId);
    if (status !== "") next.estado = status as OrderClaimStatus;
    if (pedidoId.trim() !== "") next.pedidoId = Number(pedidoId);
    if (desde) next.desde = toStartOfDay(desde);
    if (hasta) next.hasta = toEndOfDay(hasta);

    setPage(0);
    setAppliedFilter(next);
  }

  function clearFilters() {
    setLocalId("");
    setStatus("");
    setPedidoId("");
    setDesde("");
    setHasta("");
    setPage(0);
    setAppliedFilter({});
    setIsMobileFiltersOpen(false);
  }

  function goToPage(target: number) {
    setPage(target);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const controlsDisabled = restaurantsLoading;
  const controlClasses =
    "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-900 dark:disabled:text-slate-500";
  const mobileControlClasses =
    "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-900 dark:disabled:text-slate-500";
  const hasActiveFilters =
    localId !== "" ||
    status !== "" ||
    pedidoId !== "" ||
    desde !== "" ||
    hasta !== "";
  const actionClasses =
    "text-sm font-semibold text-indigo-700 transition-colors hover:text-indigo-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-indigo-300 dark:hover:text-indigo-200";
  const pageNumbers = getPageNumbers(page + 1, totalPages);

  return (
    <div className="space-y-6">
      {selectedClaim ? (
        <ViewClaimModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
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
          Seguimiento de reclamos
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Consultá el estado de tus reclamos y la respuesta de cada local.
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
              <label htmlFor="client-claims-sort-mobile" className="sr-only">
                Orden
              </label>
              <select
                id="client-claims-sort-mobile"
                value={sort}
                onChange={(event) => {
                  setPage(0);
                  setSort(event.target.value as SortKey);
                }}
                className="h-11 w-[150px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="estado-desc">Pendientes</option>
                <option value="fecha-desc">Más recientes</option>
                <option value="fecha-asc">Más antiguos</option>
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
                      Ajusta el listado de reclamos visible.
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
                  <label htmlFor="client-claims-local-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Local
                    </span>
                    <select
                      id="client-claims-local-mobile"
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

                  <label htmlFor="client-claims-status-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Estado
                    </span>
                    <select
                      id="client-claims-status-mobile"
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

                  <label htmlFor="client-claims-order-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Pedido #
                    </span>
                    <input
                      id="client-claims-order-mobile"
                      className={mobileControlClasses}
                      disabled={controlsDisabled}
                      inputMode="numeric"
                      onChange={(event) => setPedidoId(event.target.value)}
                      placeholder="Ej: 42"
                      type="text"
                      value={pedidoId}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label htmlFor="client-claims-from-mobile" className="block">
                      <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        Desde
                      </span>
                      <input
                        id="client-claims-from-mobile"
                        className={mobileControlClasses}
                        disabled={controlsDisabled}
                        onChange={(event) => setDesde(event.target.value)}
                        type="date"
                        value={desde}
                      />
                    </label>

                    <label htmlFor="client-claims-to-mobile" className="block">
                      <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        Hasta
                      </span>
                      <input
                        id="client-claims-to-mobile"
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

        <div className="hidden gap-5 xl:grid xl:grid-cols-[minmax(12rem,1fr)_14rem_12rem_auto_auto_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <select
              aria-label="Ordenar reclamos"
              className={controlClasses}
              onChange={(event) => {
                setPage(0);
                setSort(event.target.value as SortKey);
              }}
              value={sort}
            >
              <option value="estado-desc">Estado: pendientes primero</option>
              <option value="fecha-desc">Fecha: más recientes</option>
              <option value="fecha-asc">Fecha: más antiguos</option>
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

          <div className="flex min-w-0 items-center gap-2">
            <HashtagIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <input
              aria-label="Filtrar por pedido"
              className="h-10 w-24 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
              disabled={controlsDisabled}
              inputMode="numeric"
              onChange={(event) => setPedidoId(event.target.value)}
              placeholder="Pedido"
              type="text"
              value={pedidoId}
            />
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
      ) : claims.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10 text-gray-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
            No se encontraron reclamos para los filtros aplicados.
          </p>
          <Link
            className="mt-4 inline-block text-sm font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-300"
            href="/client/order-history"
          >
            Ir al historial de pedidos
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
            {claims.map((claim) => (
              <div
                className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-orange-50/40 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center sm:gap-8 dark:hover:bg-orange-500/5"
                key={claim.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatDate(claim.creacion)}
                    </span>
                    <StatusBadge status={claim.estado} />
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-orange-700 dark:text-orange-300">
                    Pedido #{claim.pedidoId}
                    {claim.pedidoTotal != null
                      ? ` · ${formatPrice(claim.pedidoTotal)}`
                      : null}
                  </p>
                  {claim.estado === "APROBADO" ? (
                    <p className="mt-2 w-fit rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-bold text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200">
                      Voucher disponible en Mi billetera
                    </p>
                  ) : null}
                </div>

                <div className="min-w-0">
                  <p className="line-clamp-2 font-semibold text-gray-900 dark:text-white">
                    {claim.localNombre ?? `Local #${claim.localId ?? "—"}`}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-500">
                    Tu reclamo
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-slate-400">
                    {truncateText(claim.descripcion)}
                  </p>
                </div>

                <div className="sm:justify-self-end sm:text-right">
                  <button
                    className={actionClasses}
                    onClick={() => setSelectedClaim(claim)}
                    type="button"
                  >
                    Ver reclamo
                  </button>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                    Reclamo{" "}
                    <span className="font-semibold text-gray-600 dark:text-slate-300">
                      #{claim.id}
                    </span>
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
