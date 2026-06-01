"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import type {
  OrderStatus,
  WorkbenchFilters,
  WorkbenchOrder,
} from "@/lib/restaurant/workbench/types";
import { getStoredSession } from "@/lib/shared/auth/session-store";
import {
  confirmWorkbenchOrder,
  fetchWorkbenchOrders,
  rejectWorkbenchOrder,
} from "@/services/restaurant/workbench-service";

type RestaurantWorkbenchPageMode = "workbench" | "orders";
type StatusFilter = "ALL" | "ACTIVE" | OrderStatus;

const statusLabels: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL: "Pendiente",
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En curso",
  EN_CAMINO_LOCAL: "En camino",
  FINALIZADO: "Finalizado",
  RECHAZADO_LOCAL: "Rechazado",
};

const statusColors: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  ACEPTADO_LOCAL:
    "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  EN_CURSO_LOCAL:
    "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  EN_CAMINO_LOCAL:
    "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  FINALIZADO:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  RECHAZADO_LOCAL:
    "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

const activeStatuses = new Set<OrderStatus>([
  "PENDIENTE_CONFIRMACION_LOCAL",
  "ACEPTADO_LOCAL",
  "EN_CURSO_LOCAL",
  "EN_CAMINO_LOCAL",
]);

const statusFilterLabels: Record<StatusFilter, string> = {
  ALL: "Todos",
  ACTIVE: "Activos",
  ...statusLabels,
};

const modeContent: Record<
  RestaurantWorkbenchPageMode,
  {
    description: string;
    emptyMessage: string;
    initialStatusFilter: StatusFilter;
    listTitle: string;
  }
> = {
  workbench: {
    description:
      "Gestiona los pedidos activos del local y confirma o rechaza los pendientes.",
    emptyMessage: "No hay pedidos activos para mostrar.",
    initialStatusFilter: "ACTIVE",
    listTitle: "Pedidos en operacion",
  },
  orders: {
    description:
      "Consulta el historial de pedidos del local y revisa el detalle de cada solicitud.",
    emptyMessage: "No hay pedidos para mostrar.",
    initialStatusFilter: "ALL",
    listTitle: "Pedidos del local",
  },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-extrabold",
        statusColors[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
        {value}
      </p>
    </article>
  );
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("es-UY", {
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

type RestaurantWorkbenchPageProps = {
  mode?: RestaurantWorkbenchPageMode;
};

export default function RestaurantWorkbenchPage({
  mode = "workbench",
}: RestaurantWorkbenchPageProps) {
  const content = modeContent[mode];
  const [orders, setOrders] = useState<WorkbenchOrder[] | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<
    "confirm" | "reject" | null
  >(null);
  const [sortBy, setSortBy] = useState<"antiguedad" | "items">("antiguedad");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [orderId, setOrderId] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    content.initialStatusFilter,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function fetchOrders() {
      const session = getStoredSession();
      const restaurantId = session?.idTipoUsuario
        ? String(session.idTipoUsuario)
        : "";

      if (!restaurantId) {
        if (!ignore) {
          setError("No se pudo obtener el ID del local.");
          setOrders([]);
        }
        return;
      }

      const workbenchFilters: WorkbenchFilters = {
        sortBy,
        direction,
        orderId: orderId || undefined,
        startDateTime: startDateTime || undefined,
        endDateTime: endDateTime || undefined,
      };

      try {
        const data = await fetchWorkbenchOrders(restaurantId, workbenchFilters);
        if (ignore) return;
        setOrders(data);
        setError(null);
      } catch (err) {
        if (ignore) return;
        setError(
          err instanceof Error ? err.message : "Error al cargar los pedidos.",
        );
        setOrders([]);
      }
    }

    void fetchOrders();

    return () => {
      ignore = true;
    };
  }, [sortBy, direction, orderId, startDateTime, endDateTime, refreshKey]);

  const filteredOrders = useMemo(() => {
    if (!orders) return null;

    if (statusFilter === "ALL") return orders;

    if (statusFilter === "ACTIVE") {
      return orders.filter((order) => activeStatuses.has(order.status));
    }

    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const orderCounts = useMemo(() => {
    const counters: Record<StatusFilter, number> = {
      ALL: orders?.length ?? 0,
      ACTIVE:
        orders?.filter((order) => activeStatuses.has(order.status)).length ?? 0,
      PENDIENTE_CONFIRMACION_LOCAL: 0,
      ACEPTADO_LOCAL: 0,
      EN_CURSO_LOCAL: 0,
      EN_CAMINO_LOCAL: 0,
      FINALIZADO: 0,
      RECHAZADO_LOCAL: 0,
    };

    orders?.forEach((order) => {
      counters[order.status] += 1;
    });

    return counters;
  }, [orders]);

  useEffect(() => {
    if (!filteredOrders) return;

    if (filteredOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }

    if (!filteredOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder =
    filteredOrders?.find((order) => order.id === selectedOrderId) ?? null;
  const canProcessSelectedOrder =
    selectedOrder?.status === "PENDIENTE_CONFIRMACION_LOCAL";

  async function handleOrderAction(action: "confirm" | "reject") {
    if (!selectedOrder || processingAction) return;

    const session = getStoredSession();
    const localId = session?.idTipoUsuario ? String(session.idTipoUsuario) : "";

    if (!localId) {
      setActionError("No se pudo obtener el ID del local.");
      return;
    }

    setProcessingAction(action);
    setActionMessage(null);
    setActionError(null);

    try {
      const nextStatus =
        action === "confirm"
          ? await confirmWorkbenchOrder(localId, selectedOrder.id)
          : await rejectWorkbenchOrder(localId, selectedOrder.id);

      setOrders((currentOrders) =>
        currentOrders?.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: nextStatus }
            : order,
        ) ?? null,
      );

      setActionMessage(
        action === "confirm"
          ? "El pedido fue confirmado correctamente."
          : "El pedido fue rechazado correctamente.",
      );
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el pedido. Intentalo nuevamente.",
      );
    } finally {
      setProcessingAction(null);
    }
  }

  function handleRefresh() {
    setActionMessage(null);
    setActionError(null);
    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleSelectOrder(nextOrderId: number) {
    setSelectedOrderId(nextOrderId);
    setActionMessage(null);
    setActionError(null);
  }

  return (
    <section className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
              {content.listTitle}
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
              {content.description}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:text-slate-200 dark:hover:border-orange-500/40 dark:hover:text-orange-300"
          >
            Actualizar
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Activos" value={orderCounts.ACTIVE} />
          <SummaryCard
            label="Pendientes"
            value={orderCounts.PENDIENTE_CONFIRMACION_LOCAL}
          />
          <SummaryCard label="Finalizados" value={orderCounts.FINALIZADO} />
          <SummaryCard label="Rechazados" value={orderCounts.RECHAZADO_LOCAL} />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Ordenar por
            </span>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "antiguedad" | "items")
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="antiguedad">Antiguedad</option>
              <option value="items">Cantidad de items</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Sentido
            </span>
            <select
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value as "asc" | "desc")
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="desc">Mas recientes</option>
              <option value="asc">Mas antiguos</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Estado
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              {Object.entries(statusFilterLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label} ({orderCounts[value as StatusFilter]})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Nro. de pedido
            </span>
            <input
              type="number"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Ej: 5"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Desde
            </span>
            <input
              type="datetime-local"
              value={startDateTime}
              onChange={(event) => setStartDateTime(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Hasta
            </span>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(event) => setEndDateTime(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
              Pedidos recientes
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Selecciona un pedido para ver el detalle y sus acciones.
            </p>
          </div>

          <div className="space-y-4 p-3 sm:p-4">
            {orders === null ? (
              <p className="px-4 py-8 text-center text-sm font-medium text-slate-400">
                Cargando...
              </p>
            ) : null}

            {filteredOrders !== null && filteredOrders.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                {content.emptyMessage}
              </p>
            ) : null}

            {filteredOrders?.map((order) => {
              const isSelected = order.id === selectedOrderId;

              return (
                <button
                  type="button"
                  key={order.id}
                  onClick={() => handleSelectOrder(order.id)}
                  className={clsx(
                    "grid w-full cursor-pointer gap-4 rounded-2xl border p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/40 md:grid-cols-[minmax(0,1fr)_auto] md:items-center dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10",
                    isSelected
                      ? "border-orange-200 bg-orange-50/40 dark:border-orange-500/30 dark:bg-orange-500/10"
                      : "border-transparent bg-white dark:bg-slate-900",
                  )}
                >
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      Pedido #{order.id}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {formatDate(order.createdAt)} - {formatPrice(order.total)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </button>
              );
            })}
          </div>
        </section>

        {selectedOrder ? (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Detalle del pedido #{selectedOrder.id}
              </h2>
            </div>

            <div className="space-y-4 p-5">
              {actionMessage ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {actionMessage}
                </div>
              ) : null}

              {actionError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  {actionError}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem label="Estado">
                  <StatusBadge status={selectedOrder.status} />
                </DetailItem>
                <DetailItem label="Total">
                  {formatPrice(selectedOrder.total)}
                </DetailItem>
                <DetailItem label="Creado">
                  {formatDate(selectedOrder.createdAt)}
                </DetailItem>
                <DetailItem label="Cliente ID">
                  {selectedOrder.customerId}
                </DetailItem>
              </div>

              {selectedOrder.discount != null ? (
                <DetailItem label="Descuento">
                  {selectedOrder.discount}%
                </DetailItem>
              ) : null}

              {selectedOrder.estimatedTime ? (
                <DetailItem label="Tiempo estimado">
                  {selectedOrder.estimatedTime}
                </DetailItem>
              ) : null}

              {selectedOrder.comment ? (
                <DetailItem label="Comentario">{selectedOrder.comment}</DetailItem>
              ) : null}

              {selectedOrder.address ? (
                <DetailItem label="Direccion">{selectedOrder.address}</DetailItem>
              ) : null}

              {selectedOrder.instructions ? (
                <DetailItem label="Indicaciones">
                  {selectedOrder.instructions}
                </DetailItem>
              ) : null}

              {selectedOrder.invoiceUrl ? (
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Factura
                  </span>
                  <a
                    href={selectedOrder.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-extrabold text-orange-600 transition hover:text-orange-700 dark:text-orange-300"
                  >
                    Ver factura
                  </a>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => void handleOrderAction("confirm")}
                  disabled={
                    !canProcessSelectedOrder || processingAction !== null
                  }
                  className="h-11 flex-1 rounded-xl bg-orange-500 px-4 text-sm font-extrabold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingAction === "confirm"
                    ? "Confirmando..."
                    : "Confirmar pedido"}
                </button>

                <button
                  type="button"
                  onClick={() => void handleOrderAction("reject")}
                  disabled={
                    !canProcessSelectedOrder || processingAction !== null
                  }
                  className="h-11 flex-1 rounded-xl bg-red-500/10 px-4 text-sm font-extrabold text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingAction === "reject"
                    ? "Rechazando..."
                    : "Rechazar pedido"}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Selecciona un pedido
              </h2>
              <p className="mt-2 max-w-[320px] text-sm font-medium text-slate-500 dark:text-slate-400">
                El detalle y las acciones disponibles se muestran en este panel.
              </p>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

function DetailItem({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
        {children}
      </div>
    </div>
  );
}
