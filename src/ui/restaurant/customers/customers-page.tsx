"use client";

import {
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowsUpDownIcon,
  FunnelIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  OrderStatus,
  WorkbenchOrder,
  WorkbenchOrderRating,
  WorkbenchRatingValue,
} from "@/lib/restaurant/workbench/types";
import {
  fetchRestaurantOrders,
  getWorkbenchOrderCustomerRating,
} from "@/services/restaurant/workbench-service";
import { getCurrentSession } from "@/services/shared/auth-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

type RatingFilter = "all" | WorkbenchRatingValue | "unrated";
type SortKey =
  | "last-order-desc"
  | "last-order-asc"
  | "orders-desc"
  | "orders-asc"
  | "spent-desc"
  | "spent-asc"
  | "name-asc"
  | "name-desc"
  | "positive-desc"
  | "negative-desc"
  | "positive-rate-desc"
  | "negative-rate-desc";

type CustomerSummary = {
  customerDocument: string | null;
  customerId: number;
  customerName: string;
  lastOrder: WorkbenchOrder;
  negativeRatings: number;
  orders: WorkbenchOrder[];
  positiveRatings: number;
  totalOrders: number;
  totalSpent: number;
  unratedOrders: number;
};

const statusLabels: Record<OrderStatus, string> = {
  EN_CARRITO: "En carrito",
  ETAPA_DE_PAGO: "En pago",
  PENDIENTE_CONFIRMACION_LOCAL: "Pendiente confirmacion",
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En curso",
  EN_CAMINO_LOCAL: "En camino",
  FINALIZADO: "Finalizado",
  RECHAZADO_LOCAL: "Rechazado",
  CANCELADO_CLIENTE: "Cancelado",
};

const statusColors: Record<OrderStatus, string> = {
  EN_CARRITO:
    "bg-slate-50 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400",
  ETAPA_DE_PAGO:
    "bg-slate-50 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400",
  PENDIENTE_CONFIRMACION_LOCAL:
    "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300",
  ACEPTADO_LOCAL:
    "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  EN_CURSO_LOCAL:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  EN_CAMINO_LOCAL:
    "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300",
  FINALIZADO:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  RECHAZADO_LOCAL:
    "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300",
  CANCELADO_CLIENTE:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={clsx(
        "w-fit rounded-full px-3 py-1 text-xs font-extrabold",
        statusColors[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function RatingBadge({ value }: { value: WorkbenchRatingValue | null }) {
  if (value === "P") {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
        <HandThumbUpIcon className="h-3.5 w-3.5" />
        Positiva
      </span>
    );
  }

  if (value === "N") {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-extrabold text-red-500 dark:bg-red-500/10 dark:text-red-300">
        <HandThumbDownIcon className="h-3.5 w-3.5" />
        Negativa
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
      Sin calificar
    </span>
  );
}

function formatDateTimeLabel(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-UY")}`;
}

function getCustomerLabel(order: WorkbenchOrder) {
  return order.customerName ?? "Cliente sin identificar";
}

function formatCustomerIdLabel(customerId: number) {
  return customerId > 0 ? `#${customerId}` : "Sin ID";
}

function getCustomerDocument(order: WorkbenchOrder) {
  return order.customerDocument;
}

function getOrderDescription(order: WorkbenchOrder) {
  if (order.items.length > 0) {
    return order.items
      .slice(0, 2)
      .map((item) => `${item.quantity} ${item.name}`)
      .join(", ");
  }

  return order.comment ?? order.instructions ?? "Pedido sin detalle de items";
}

function getOrderRating(order: WorkbenchOrder) {
  return order.customerRating?.calificacion ?? null;
}

function hasRating(order: WorkbenchOrder) {
  return Boolean(order.customerRating);
}

function getRatedOrderCount(customer: CustomerSummary) {
  return customer.positiveRatings + customer.negativeRatings;
}

function getPositiveRatingRate(customer: CustomerSummary) {
  const ratedOrderCount = getRatedOrderCount(customer);
  return ratedOrderCount > 0 ? customer.positiveRatings / ratedOrderCount : 0;
}

function getNegativeRatingRate(customer: CustomerSummary) {
  const ratedOrderCount = getRatedOrderCount(customer);
  return ratedOrderCount > 0 ? customer.negativeRatings / ratedOrderCount : 0;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function matchesRatingFilter(order: WorkbenchOrder, filter: RatingFilter) {
  if (filter === "all") return true;
  if (filter === "unrated") return !hasRating(order);
  return getOrderRating(order) === filter;
}

function mergeOrderRating(
  order: WorkbenchOrder,
  rating: WorkbenchOrderRating | null,
): WorkbenchOrder {
  return {
    ...order,
    customerRating: rating,
    hasCustomerRating: Boolean(rating),
  };
}

async function hydrateCustomerRatings(
  orders: WorkbenchOrder[],
): Promise<WorkbenchOrder[]> {
  const ordersToHydrate = orders.filter(
    (order) => order.status === "FINALIZADO" && !order.customerRating,
  );

  if (ordersToHydrate.length === 0) return orders;

  const ratings = await Promise.allSettled(
    ordersToHydrate.map((order) => getWorkbenchOrderCustomerRating(order.id)),
  );
  const ratingsByOrderId = new Map<number, WorkbenchOrderRating | null>();

  ratings.forEach((result, index) => {
    const order = ordersToHydrate[index];

    if (result.status === "fulfilled") {
      ratingsByOrderId.set(order.id, result.value);
    }
  });

  if (ratingsByOrderId.size === 0) return orders;

  return orders.map((order) =>
    ratingsByOrderId.has(order.id)
      ? mergeOrderRating(order, ratingsByOrderId.get(order.id) ?? null)
      : order,
  );
}

function buildCustomerSummaries(orders: WorkbenchOrder[]) {
  const customers = new Map<number, CustomerSummary>();

  orders.forEach((order) => {
    const customerKey = order.customerId > 0 ? order.customerId : -order.id;
    const existing = customers.get(customerKey);
    const rating = getOrderRating(order);
    const customerDocument = getCustomerDocument(order);
    const createdAtTime = new Date(order.createdAt).getTime();
    const currentLastOrderTime = existing
      ? new Date(existing.lastOrder.createdAt).getTime()
      : Number.NEGATIVE_INFINITY;

    if (!existing) {
      customers.set(customerKey, {
        customerDocument,
        customerId: customerKey,
        customerName: getCustomerLabel(order),
        lastOrder: order,
        negativeRatings: rating === "N" ? 1 : 0,
        orders: [order],
        positiveRatings: rating === "P" ? 1 : 0,
        totalOrders: 1,
        totalSpent: order.total,
        unratedOrders: hasRating(order) ? 0 : 1,
      });
      return;
    }

    existing.orders.push(order);
    existing.totalOrders += 1;
    existing.totalSpent += order.total;
    existing.positiveRatings += rating === "P" ? 1 : 0;
    existing.negativeRatings += rating === "N" ? 1 : 0;
    existing.unratedOrders += hasRating(order) ? 0 : 1;
    existing.customerDocument = existing.customerDocument ?? customerDocument;
    if (order.customerName && existing.customerName === "Cliente sin identificar") {
      existing.customerName = order.customerName;
    }

    if (
      !Number.isNaN(createdAtTime) &&
      (Number.isNaN(currentLastOrderTime) || createdAtTime > currentLastOrderTime)
    ) {
      existing.lastOrder = order;
    }
  });

  return [...customers.values()].map((customer) => ({
    ...customer,
    orders: [...customer.orders].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    ),
  }));
}

function compareCustomerNames(first: CustomerSummary, second: CustomerSummary) {
  return (
    first.customerName.localeCompare(second.customerName, "es-UY", {
      numeric: true,
      sensitivity: "base",
    }) || first.customerId - second.customerId
  );
}

function sortCustomers(customers: CustomerSummary[], sort: SortKey) {
  return [...customers].sort((first, second) => {
    if (sort === "name-asc") {
      return compareCustomerNames(first, second);
    }

    if (sort === "name-desc") {
      return compareCustomerNames(second, first);
    }

    if (sort === "orders-desc") {
      return second.totalOrders - first.totalOrders;
    }

    if (sort === "orders-asc") {
      return first.totalOrders - second.totalOrders;
    }

    if (sort === "spent-desc") {
      return second.totalSpent - first.totalSpent;
    }

    if (sort === "spent-asc") {
      return first.totalSpent - second.totalSpent;
    }

    if (sort === "positive-desc") {
      return second.positiveRatings - first.positiveRatings;
    }

    if (sort === "negative-desc") {
      return second.negativeRatings - first.negativeRatings;
    }

    if (sort === "positive-rate-desc") {
      return (
        getPositiveRatingRate(second) - getPositiveRatingRate(first) ||
        second.positiveRatings - first.positiveRatings
      );
    }

    if (sort === "negative-rate-desc") {
      return (
        getNegativeRatingRate(second) - getNegativeRatingRate(first) ||
        second.negativeRatings - first.negativeRatings
      );
    }

    if (sort === "last-order-asc") {
      return (
        new Date(first.lastOrder.createdAt).getTime() -
        new Date(second.lastOrder.createdAt).getTime()
      );
    }

    return (
      new Date(second.lastOrder.createdAt).getTime() -
      new Date(first.lastOrder.createdAt).getTime()
    );
  });
}

async function loadRestaurantOrders(): Promise<WorkbenchOrder[]> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("No se encontro una sesion activa.");
  }

  const orders = await fetchRestaurantOrders(String(session.idTipoUsuario), {
    direction: "desc",
    sortBy: "antiguedad",
  });

  return hydrateCustomerRatings(orders);
}

function CustomerMobileCard({
  customer,
  onOpen,
}: {
  customer: CustomerSummary;
  onOpen: () => void;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-orange-600 dark:text-orange-400">
            Cliente {formatCustomerIdLabel(customer.customerId)}
          </p>
          <h3 className="mt-2 truncate text-base font-extrabold text-slate-950 dark:text-white">
            {customer.customerName}
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {customer.totalOrders} pedidos
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <DetailPreview label="Total gastado">
          {formatPrice(customer.totalSpent)}
        </DetailPreview>
        <DetailPreview label="Ultimo pedido">
          {formatDateTimeLabel(customer.lastOrder.createdAt)}
        </DetailPreview>
        <DetailPreview label="Positivas">
          {customer.positiveRatings}
        </DetailPreview>
        <DetailPreview label="Negativas">
          {customer.negativeRatings}
        </DetailPreview>
        <DetailPreview label="Sin calificar">
          {customer.unratedOrders}
        </DetailPreview>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
      >
        Ver pedidos
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </article>
  );
}

export default function RestaurantCustomersPage() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [sort, setSort] = useState<SortKey>("last-order-desc");
  const [draftCustomerSearch, setDraftCustomerSearch] = useState("");
  const [draftRatingFilter, setDraftRatingFilter] =
    useState<RatingFilter>("all");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSummary | null>(null);

  const loadOrders = useCallback(() => {
    return loadRestaurantOrders();
  }, []);

  const {
    data: loadedOrders,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadOrders);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = customerSearch.trim().toLowerCase();

    return (loadedOrders ?? []).filter((order) => {
      const customerLabel = getCustomerLabel(order).toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        customerLabel.includes(normalizedSearch) ||
        String(order.customerId).includes(normalizedSearch);

      return matchesSearch && matchesRatingFilter(order, ratingFilter);
    });
  }, [customerSearch, loadedOrders, ratingFilter]);

  const customers = useMemo(() => {
    return sortCustomers(buildCustomerSummaries(filteredOrders), sort);
  }, [filteredOrders, sort]);

  const isDataReady = Boolean(loadedOrders) && !isLoading && !loadError;
  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar los clientes.";
  const hasActiveFilters =
    Boolean(customerSearch.trim()) || ratingFilter !== "all";
  const hasDraftFilters =
    Boolean(draftCustomerSearch.trim()) || draftRatingFilter !== "all";

  function openMobileFilters() {
    setDraftCustomerSearch(customerSearch);
    setDraftRatingFilter(ratingFilter);
    setIsMobileFiltersOpen(true);
  }

  function applyFilters() {
    setCustomerSearch(draftCustomerSearch.trim());
    setRatingFilter(draftRatingFilter);
    setIsMobileFiltersOpen(false);
  }

  function clearFilters() {
    setCustomerSearch("");
    setRatingFilter("all");
    setDraftCustomerSearch("");
    setDraftRatingFilter("all");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 xl:hidden">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openMobileFilters}
              className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              <FunnelIcon className="h-4 w-4" />
              Filtros
              {hasActiveFilters ? (
                <span className="h-2 w-2 rounded-full bg-orange-600 dark:bg-orange-400" />
              ) : null}
            </button>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Limpiar filtros"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              >
                <FunnelIcon className="h-5 w-5" />
                <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={reload}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              aria-label="Actualizar clientes"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
              <label htmlFor="customer-sort-mobile" className="sr-only">
                Orden
              </label>
              <select
                id="customer-sort-mobile"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="h-11 w-[125px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="last-order-desc">Mas recientes</option>
                <option value="last-order-asc">Mas antiguos</option>
                <option value="name-asc">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="orders-desc">Mas pedidos</option>
                <option value="orders-asc">Menos pedidos</option>
                <option value="spent-desc">Mas gasto</option>
                <option value="spent-asc">Menos gasto</option>
                <option value="positive-desc">Mas positivas</option>
                <option value="negative-desc">Mas negativas</option>
              </select>
            </div>
          </div>

          {isMobileFiltersOpen ? (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 pb-4 pt-20 backdrop-blur-sm sm:items-center sm:pt-16">
              <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-xl sm:max-w-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      Filtros
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Ajusta la base de clientes visible.
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
                  <label htmlFor="customer-search-filter-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Cliente
                    </span>
                    <span className="relative block">
                      <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="customer-search-filter-mobile"
                        type="search"
                        value={draftCustomerSearch}
                        onChange={(event) =>
                          setDraftCustomerSearch(event.target.value)
                        }
                        placeholder="Nombre o ID"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pl-10 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                      />
                    </span>
                  </label>

                  <label htmlFor="customer-rating-filter-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Calificaciones
                    </span>
                    <select
                      id="customer-rating-filter-mobile"
                      value={draftRatingFilter}
                      onChange={(event) =>
                        setDraftRatingFilter(event.target.value as RatingFilter)
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                    >
                      <option value="all">Todas</option>
                      <option value="P">Solo positivas</option>
                      <option value="N">Solo negativas</option>
                      <option value="unrated">Sin calificar</option>
                    </select>
                  </label>
                </div>

                <div className="flex gap-3 border-t border-gray-200 px-5 py-4 dark:border-slate-800">
                  {hasDraftFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
                    >
                      Limpiar filtros
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="h-11 flex-1 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
                  >
                    Ver resultados
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden gap-4 xl:flex xl:items-end xl:justify-between">
          <div className="grid gap-4 xl:grid-cols-[240px_180px_auto_auto] xl:items-end">
            <label htmlFor="customer-search-filter" className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Cliente
              </span>
              <span className="relative block">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="customer-search-filter"
                  type="search"
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Nombre o ID"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pl-10 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                />
              </span>
            </label>

            <label htmlFor="customer-rating-filter" className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Calificaciones
              </span>
              <select
                id="customer-rating-filter"
                value={ratingFilter}
                onChange={(event) =>
                  setRatingFilter(event.target.value as RatingFilter)
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="all">Todas</option>
                <option value="P">Solo positivas</option>
                <option value="N">Solo negativas</option>
                <option value="unrated">Sin calificar</option>
              </select>
            </label>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Limpiar filtros"
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              >
                <FunnelIcon className="h-5 w-5" />
                <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={reload}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              aria-label="Actualizar clientes"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>

          <label htmlFor="customer-sort" className="block w-full xl:w-[200px]">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Orden
            </span>
            <select
              id="customer-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="last-order-desc">Mas recientes</option>
              <option value="last-order-asc">Mas antiguos</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="orders-desc">Mas pedidos</option>
              <option value="orders-asc">Menos pedidos</option>
              <option value="spent-desc">Mas gasto</option>
              <option value="spent-asc">Menos gasto</option>
              <option value="positive-desc">Mas positivas</option>
              <option value="negative-desc">Mas negativas</option>
            </select>
          </label>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Clientes con pedidos
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {filteredOrders.length} pedidos encontrados en {customers.length} clientes.
          </p>
        </div>

        <div className="p-3">
          {isLoading ? (
            <div className="py-8">
              <LoadingIndicator label="Cargando clientes..." />
            </div>
          ) : loadError ? (
            <PanelError message={loadErrorMessage} onRetry={reload} />
          ) : customers.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
              No hay clientes para mostrar con los filtros aplicados.
            </p>
          ) : null}

          {isDataReady && customers.length > 0 ? (
            <>
              <div className="grid gap-3 lg:hidden">
                {customers.map((customer) => (
                  <CustomerMobileCard
                    key={customer.customerId}
                    customer={customer}
                    onOpen={() => setSelectedCustomer(customer)}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <div className="min-w-[1120px] overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
                  <div className="grid grid-cols-[minmax(220px,1fr)_180px_140px_150px_150px_140px_150px] items-center gap-4 border-b border-gray-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <span>Nombre</span>
                    <span>Fecha de creacion</span>
                    <span>Total gastado</span>
                    <span>Calificaciones positivas</span>
                    <span>Calificaciones negativas</span>
                    <span>Total pedidos</span>
                    <span>Acciones</span>
                  </div>

                  {customers.map((customer) => (
                    <div
                      key={customer.customerId}
                      className="grid grid-cols-[minmax(220px,1fr)_180px_140px_150px_150px_140px_150px] items-center gap-4 border-b border-gray-100 px-4 py-4 text-sm last:border-b-0 dark:border-slate-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-extrabold text-slate-900 dark:text-white">
                          {customer.customerName}
                        </p>
                        <p className="mt-1 truncate text-xs font-extrabold text-orange-500">
                          {formatCustomerIdLabel(customer.customerId)}
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                          Ultimo: {formatDateTimeLabel(customer.lastOrder.createdAt)}
                        </p>
                      </div>
                      <div className="font-semibold text-slate-700 dark:text-slate-200">
                        {formatDateTimeLabel(customer.lastOrder.createdAt)}
                      </div>
                      <div className="font-extrabold text-slate-700 dark:text-slate-200">
                        {formatPrice(customer.totalSpent)}
                      </div>
                      <div>
                        <p className="font-extrabold text-emerald-400">
                          {customer.positiveRatings}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {formatPercent(getPositiveRatingRate(customer))}
                        </p>
                      </div>
                      <div>
                        <p className="font-extrabold text-red-500">
                          {customer.negativeRatings}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {formatPercent(getNegativeRatingRate(customer))}
                        </p>
                      </div>
                      <div className="font-extrabold text-slate-700 dark:text-slate-200">
                        {customer.totalOrders}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="flex h-10 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
                      >
                        Ver pedidos
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {selectedCustomer ? (
        <CustomerOrdersModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      ) : null}
    </section>
  );
}

function CustomerOrdersModal({
  customer,
  onClose,
}: {
  customer: CustomerSummary;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-400">
              Cliente {formatCustomerIdLabel(customer.customerId)}
              {customer.customerDocument ? ` / CI ${customer.customerDocument}` : ""}
            </p>
            <h2 className="mt-1 truncate text-xl font-black text-slate-950 dark:text-white">
              {customer.customerName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryMetric label="Pedidos" value={String(customer.totalOrders)} />
            <SummaryMetric label="Total" value={formatPrice(customer.totalSpent)} />
            <SummaryMetric
              label="Positivas"
              value={`${customer.positiveRatings} (${formatPercent(
                getPositiveRatingRate(customer),
              )})`}
            />
            <SummaryMetric
              label="Negativas"
              value={`${customer.negativeRatings} (${formatPercent(
                getNegativeRatingRate(customer),
              )})`}
            />
            <SummaryMetric
              label="Sin calificar"
              value={String(customer.unratedOrders)}
            />
            
          </div>

          <div>
            <h3 className="mb-3 text-sm font-black text-slate-700 dark:text-slate-200">
              Pedidos filtrados
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 dark:border-slate-800 lg:grid-cols-[110px_minmax(180px,1fr)_140px_130px]"
                >
                  <div>
                    <p className="font-black text-orange-600 dark:text-orange-400">
                      #{order.id}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {formatDateTimeLabel(order.createdAt)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">
                      {getOrderDescription(order)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center">
                    <RatingBadge value={getOrderRating(order)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailPreview({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <span className="block text-xs font-black uppercase text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="mt-1 block font-extrabold text-slate-800 dark:text-slate-100">
        {children}
      </span>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
      <span className="block text-xs font-black uppercase text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="mt-1 block text-sm font-extrabold text-slate-800 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}
