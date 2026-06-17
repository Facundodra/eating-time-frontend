"use client";

import {
  ArrowPathIcon,
  ArrowsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import type {
  OrderStatus,
  WorkbenchFilters,
  WorkbenchOrder,
  WorkbenchOrderRating,
  WorkbenchRatingValue,
} from "@/lib/restaurant/workbench/types";
import { RESTAURANT_WORKBENCH_REFRESH_EVENT } from "@/lib/restaurant/notifications";
import { getCurrentSession } from "@/services/shared/auth-service";
import {
  changeWorkbenchOrderStatus,
  confirmWorkbenchOrder,
  fetchWorkbenchOrders,
  getWorkbenchOrderCustomerRating,
  rejectWorkbenchOrder,
  submitWorkbenchOrderCustomerRating,
} from "@/services/restaurant/workbench-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";

type BoardStatus =
  | "PENDIENTE_CONFIRMACION_LOCAL"
  | "ACEPTADO_LOCAL"
  | "EN_CURSO_LOCAL"
  | "EN_CAMINO_LOCAL"
  | "FINALIZADO"
  | "RECHAZADO_LOCAL";

const boardColumns: Array<{ status: BoardStatus; title: string }> = [
  { status: "RECHAZADO_LOCAL", title: "Rechazado" },
  {
    status: "PENDIENTE_CONFIRMACION_LOCAL",
    title: "Pendiente confirmación",
  },
  { status: "ACEPTADO_LOCAL", title: "Aceptado" },
  { status: "EN_CURSO_LOCAL", title: "En curso" },
  { status: "EN_CAMINO_LOCAL", title: "En camino" },
  { status: "FINALIZADO", title: "Finalizado" },
];

const nextStatusByStatus: Partial<Record<OrderStatus, BoardStatus>> = {
  PENDIENTE_CONFIRMACION_LOCAL: "ACEPTADO_LOCAL",
  ACEPTADO_LOCAL: "EN_CURSO_LOCAL",
  EN_CURSO_LOCAL: "EN_CAMINO_LOCAL",
  EN_CAMINO_LOCAL: "FINALIZADO",
};

const statusLabels: Record<OrderStatus, string> = {
  EN_CARRITO: "En carrito",
  ETAPA_DE_PAGO: "En pago",
  PENDIENTE_CONFIRMACION_LOCAL: "Pendiente confirmación",
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En curso",
  EN_CAMINO_LOCAL: "En camino",
  FINALIZADO: "Finalizado",
  RECHAZADO_LOCAL: "Rechazado",
  CANCELADO_CLIENTE: "Cancelado",
};

const itemBadgeClassName: Record<BoardStatus, string> = {
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
};

type PendingOrderAction = {
  type: "accept" | "reject";
  order: WorkbenchOrder;
};

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const ratingOptions: Array<{
  activeClassName: string;
  icon: typeof HandThumbUpIcon;
  label: string;
  value: WorkbenchRatingValue;
}> = [
  {
    activeClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: HandThumbUpIcon,
    label: "Me gusta",
    value: "P",
  },
  {
    activeClassName:
      "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    icon: HandThumbDownIcon,
    label: "No me gusta",
    value: "N",
  },
];

function formatDate(dateStr: string) {
  if (!dateStr) return "-";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(dateStr: string) {
  if (!dateStr) return "--:--";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRatingTimestamp(dateStr: string | null | undefined) {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr.replace("T", " ");

  const pad = (value: number) => value.toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}.${milliseconds}`;
}

function formatPrice(price: number) {
  return `$ ${price.toLocaleString("es-UY")}`;
}

function formatBackendDateTime(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
}

function getDateInLastDayForTime(time: string, now: Date) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(now);

  date.setHours(hours, minutes, 0, 0);

  if (date.getTime() > now.getTime()) {
    date.setDate(date.getDate() - 1);
  }

  return date;
}

function getWorkbenchDateTimeRange(startTime: string, endTime: string) {
  if (!startTime && !endTime) return null;

  const now = new Date();
  const lowerLimit = new Date(now.getTime() - ONE_DAY_IN_MS);
  let startDate = startTime
    ? getDateInLastDayForTime(startTime, now)
    : lowerLimit;
  let endDate = endTime ? getDateInLastDayForTime(endTime, now) : now;

  // Si el rango horario cruza medianoche, la hora de inicio pertenece al dia anterior.
  if (startTime && endTime && startDate.getTime() > endDate.getTime()) {
    startDate = new Date(startDate.getTime() - ONE_DAY_IN_MS);
  }

  if (startDate.getTime() < lowerLimit.getTime()) startDate = lowerLimit;
  if (endDate.getTime() > now.getTime()) endDate = now;

  if (startDate.getTime() > endDate.getTime()) return null;

  return {
    startDateTime: formatBackendDateTime(startDate),
    endDateTime: formatBackendDateTime(endDate),
  };
}

function getCustomerLabel(order: WorkbenchOrder) {
  return order.customerName ?? "Cliente sin identificar";
}

function getRatingLabel(value: WorkbenchRatingValue | null | undefined) {
  if (value === "P") return "Me gusta";
  if (value === "N") return "No me gusta";
  return "Calificación registrada";
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

function isBoardStatus(status: OrderStatus): status is BoardStatus {
  return boardColumns.some((column) => column.status === status);
}

export default function RestaurantWorkbenchPage() {
  const [orders, setOrders] = useState<WorkbenchOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(
    null,
  );
  const [sortBy, setSortBy] = useState<"antiguedad" | "items">("antiguedad");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [startTimeFilter, setStartTimeFilter] = useState("");
  const [endTimeFilter, setEndTimeFilter] = useState("");
  const [draftOrderIdFilter, setDraftOrderIdFilter] = useState("");
  const [draftStartTimeFilter, setDraftStartTimeFilter] = useState("");
  const [draftEndTimeFilter, setDraftEndTimeFilter] = useState("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileBoardStatus, setMobileBoardStatus] = useState<BoardStatus>(
    "PENDIENTE_CONFIRMACION_LOCAL",
  );
  const [selectedOrder, setSelectedOrder] = useState<WorkbenchOrder | null>(
    null,
  );
  const [pendingAction, setPendingAction] = useState<PendingOrderAction | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function fetchOrders() {
      const session = await getCurrentSession();
      const restaurantId = session?.idTipoUsuario
        ? String(session.idTipoUsuario)
        : "";

      setIsLoading(true);
      setError(null);
      setActionError(null);

      if (!restaurantId) {
        if (!ignore) {
          setError("No se pudo obtener el ID del local.");
          setOrders([]);
          setIsLoading(false);
        }
        return;
      }

      const dateTimeRange = getWorkbenchDateTimeRange(
        startTimeFilter,
        endTimeFilter,
      );
      const workbenchFilters: WorkbenchFilters = {
        sortBy,
        direction,
        orderId: orderIdFilter || undefined,
        ...(dateTimeRange ?? {}),
      };

      try {
        const data = await fetchWorkbenchOrders(restaurantId, workbenchFilters);
        if (ignore) return;
        setOrders(data.filter((order) => isBoardStatus(order.status)));
      } catch (err) {
        if (ignore) return;
        setError(
          err instanceof Error ? err.message : "Error al cargar los pedidos.",
        );
        setOrders([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void fetchOrders();

    return () => {
      ignore = true;
    };
  }, [
    sortBy,
    direction,
    orderIdFilter,
    startTimeFilter,
    endTimeFilter,
    refreshKey,
  ]);

  useEffect(() => {
    function refreshWorkbenchFromNotification() {
      if (document.visibilityState !== "visible") return;
      if (processingOrderId !== null || pendingAction) return;

      setRefreshKey((currentKey) => currentKey + 1);
    }

    window.addEventListener(
      RESTAURANT_WORKBENCH_REFRESH_EVENT,
      refreshWorkbenchFromNotification,
    );

    return () => {
      window.removeEventListener(
        RESTAURANT_WORKBENCH_REFRESH_EVENT,
        refreshWorkbenchFromNotification,
      );
    };
  }, [pendingAction, processingOrderId]);

  const ordersByStatus = useMemo(() => {
    const grouped = new Map<BoardStatus, WorkbenchOrder[]>(
      boardColumns.map((column) => [column.status, []]),
    );

    orders.forEach((order) => {
      if (!isBoardStatus(order.status)) return;
      grouped.get(order.status)?.push(order);
    });

    return grouped;
  }, [orders]);

  function replaceOrder(updatedOrder: WorkbenchOrder) {
    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) => {
        if (currentOrder.id !== updatedOrder.id) return currentOrder;

        return {
          ...updatedOrder,
          customerName: updatedOrder.customerName ?? currentOrder.customerName,
          customerDocument:
            updatedOrder.customerDocument ?? currentOrder.customerDocument,
          customerEmail: updatedOrder.customerEmail ?? currentOrder.customerEmail,
          customerPhone: updatedOrder.customerPhone ?? currentOrder.customerPhone,
        };
      }),
    );
    setSelectedOrder((currentOrder) =>
      currentOrder?.id === updatedOrder.id
        ? {
            ...updatedOrder,
            customerName: updatedOrder.customerName ?? currentOrder.customerName,
            customerDocument:
              updatedOrder.customerDocument ?? currentOrder.customerDocument,
            customerEmail:
              updatedOrder.customerEmail ?? currentOrder.customerEmail,
            customerPhone:
              updatedOrder.customerPhone ?? currentOrder.customerPhone,
          }
        : currentOrder,
    );
  }

  const handleCustomerRatingSaved = useCallback((
    orderId: number,
    rating: WorkbenchOrderRating,
  ) => {
    const updateOrder = (currentOrder: WorkbenchOrder): WorkbenchOrder =>
      currentOrder.id === orderId
        ? {
            ...currentOrder,
            customerRating: rating,
            hasCustomerRating: true,
          }
        : currentOrder;

    setOrders((currentOrders) => currentOrders.map(updateOrder));
    setSelectedOrder((currentOrder) =>
      currentOrder ? updateOrder(currentOrder) : currentOrder,
    );
  }, []);

  async function handleAdvanceOrder(order: WorkbenchOrder) {
    const nextStatus = nextStatusByStatus[order.status];
    if (processingOrderId !== null) return;

    if (!nextStatus) return;

    if (order.status === "PENDIENTE_CONFIRMACION_LOCAL") {
      setActionError(null);
      setPendingAction({ type: "accept", order });
      return;
    }

    const session = await getCurrentSession();
    const localId = session?.idTipoUsuario ? String(session.idTipoUsuario) : "";

    if (!localId) {
      setActionError("No se pudo obtener el ID del local.");
      return;
    }

    setProcessingOrderId(order.id);
    setActionError(null);

    try {
      const updatedOrder = await changeWorkbenchOrderStatus(
        localId,
        order.id,
        nextStatus,
      );
      replaceOrder(updatedOrder ?? { ...order, status: nextStatus });
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el pedido.",
      );
    } finally {
      setProcessingOrderId(null);
    }
  }

  async function handleSubmitPendingAction(value: string) {
    if (!pendingAction || processingOrderId !== null) return;

    const session = await getCurrentSession();
    const localId = session?.idTipoUsuario ? String(session.idTipoUsuario) : "";

    if (!localId) {
      setActionError("No se pudo obtener el ID del local.");
      return;
    }

    setProcessingOrderId(pendingAction.order.id);
    setActionError(null);

    try {
      const trimmedValue = value.trim();
      const nextStatus =
        pendingAction.type === "accept"
          ? "ACEPTADO_LOCAL"
          : "RECHAZADO_LOCAL";
      const updatedOrder =
        pendingAction.type === "accept"
          ? await confirmWorkbenchOrder(
              localId,
              pendingAction.order.id,
              trimmedValue,
            )
          : await rejectWorkbenchOrder(
              localId,
              pendingAction.order.id,
              trimmedValue,
            );

      replaceOrder(
        updatedOrder ?? {
          ...pendingAction.order,
          status: nextStatus,
          estimatedTime:
            pendingAction.type === "accept"
              ? trimmedValue
              : pendingAction.order.estimatedTime,
          rejectionReason:
            pendingAction.type === "reject"
              ? trimmedValue
              : pendingAction.order.rejectionReason,
        },
      );
      setPendingAction(null);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el pedido.",
      );
    } finally {
      setProcessingOrderId(null);
    }
  }

  function handleRefresh() {
    setActionError(null);
    setPendingAction(null);
    setRefreshKey((currentKey) => currentKey + 1);
  }

  const hasActiveFilters =
    Boolean(orderIdFilter) || Boolean(startTimeFilter) || Boolean(endTimeFilter);
  const hasDraftFilters =
    Boolean(draftOrderIdFilter) ||
    Boolean(draftStartTimeFilter) ||
    Boolean(draftEndTimeFilter);
  const mobileBoardColumn =
    boardColumns.find((column) => column.status === mobileBoardStatus) ??
    boardColumns[0];
  const mobileColumnOrders =
    ordersByStatus.get(mobileBoardColumn.status) ?? [];

  function openMobileFilters() {
    setDraftOrderIdFilter(orderIdFilter);
    setDraftStartTimeFilter(startTimeFilter);
    setDraftEndTimeFilter(endTimeFilter);
    setIsMobileFiltersOpen(true);
  }

  function applyFilters() {
    setActionError(null);
    setPendingAction(null);
    setOrderIdFilter(draftOrderIdFilter.trim());
    setStartTimeFilter(draftStartTimeFilter);
    setEndTimeFilter(draftEndTimeFilter);
    setIsMobileFiltersOpen(false);
  }

  function clearFilters() {
    setActionError(null);
    setPendingAction(null);
    setOrderIdFilter("");
    setStartTimeFilter("");
    setEndTimeFilter("");
    setDraftOrderIdFilter("");
    setDraftStartTimeFilter("");
    setDraftEndTimeFilter("");
  }

  return (
    <section className="min-w-0 space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4 xl:hidden">
          <button
            type="button"
            onClick={openMobileFilters}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            aria-label="Abrir filtros"
          >
            <FunnelIcon className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-600 dark:bg-orange-400" />
            )}
          </button>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10"
              aria-label="Limpiar filtros"
            >
              <FunnelIcon className="h-5 w-5" />
              <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            aria-label="Actualizar pedidos"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <label htmlFor="workbench-sort-mobile" className="sr-only">
              Orden
            </label>
            <select
              id="workbench-sort-mobile"
              value={`${sortBy}-${direction}`}
              onChange={(event) => {
                const [nextSortBy, nextDirection] = event.target.value.split(
                  "-",
                ) as ["antiguedad" | "items", "asc" | "desc"];
                setSortBy(nextSortBy);
                setDirection(nextDirection);
              }}
              className="h-11 w-[125px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="antiguedad-desc">Mas recientes</option>
              <option value="antiguedad-asc">Mas antiguos</option>
              <option value="items-desc">Mas items</option>
              <option value="items-asc">Menos items</option>
            </select>
          </div>
        </div>

        <div className="hidden gap-4 xl:flex xl:items-end xl:justify-between">
          <div className="grid gap-4 xl:grid-cols-[160px_160px_160px_auto_auto] xl:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Nro. pedido
              </span>
              <input
                type="number"
                value={orderIdFilter}
                onChange={(event) => setOrderIdFilter(event.target.value)}
                placeholder="Ej: 5"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Creado despues de
              </span>
              <input
                type="time"
                value={startTimeFilter}
                onChange={(event) => setStartTimeFilter(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark] dark:focus:ring-orange-500/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Creado antes de
              </span>
              <input
                type="time"
                value={endTimeFilter}
                onChange={(event) => setEndTimeFilter(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark] dark:focus:ring-orange-500/20"
              />
            </label>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
                aria-label="Limpiar filtros"
              >
                <FunnelIcon className="h-5 w-5" />
                <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              aria-label="Actualizar pedidos"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>

          <label className="block w-full xl:w-[180px]">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Orden
            </span>
            <select
              value={`${sortBy}-${direction}`}
              onChange={(event) => {
                const [nextSortBy, nextDirection] = event.target.value.split(
                  "-",
                ) as ["antiguedad" | "items", "asc" | "desc"];
                setSortBy(nextSortBy);
                setDirection(nextDirection);
              }}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="antiguedad-desc">Mas recientes</option>
              <option value="antiguedad-asc">Mas antiguos</option>
              <option value="items-desc">Mas items</option>
              <option value="items-asc">Menos items</option>
            </select>
          </label>
        </div>

        {isMobileFiltersOpen ? (
          <div className="fixed inset-0 z-50 bg-slate-950/40 px-4 pt-20 backdrop-blur-sm xl:hidden">
            <div className="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-950 dark:text-white">
                    Filtros
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Se aplican contra los pedidos del backend.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-gray-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Cerrar filtros"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold text-slate-600 dark:text-slate-300">
                    Nro. pedido
                  </span>
                  <input
                    type="number"
                    value={draftOrderIdFilter}
                    onChange={(event) =>
                      setDraftOrderIdFilter(event.target.value)
                    }
                    placeholder="Ej: 5"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold text-slate-600 dark:text-slate-300">
                    Creado despues de
                  </span>
                  <input
                    type="time"
                    value={draftStartTimeFilter}
                    onChange={(event) =>
                      setDraftStartTimeFilter(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold text-slate-600 dark:text-slate-300">
                    Creado antes de
                  </span>
                  <input
                    type="time"
                    value={draftEndTimeFilter}
                    onChange={(event) =>
                      setDraftEndTimeFilter(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  />
                </label>
              </div>

              <div className="mt-5 flex gap-3 border-t border-gray-100 pt-4 dark:border-slate-800">
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
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {actionError}
        </div>
      ) : null}

      <div className="min-h-[420px] pb-4">
        {!isLoading && !error && orders.length === 0 ? (
          <p className="mb-4 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            No hay pedidos en las ultimas 24 horas.
          </p>
        ) : null}

        <section className="min-h-[360px] rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-950/50 xl:hidden">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <label htmlFor="workbench-mobile-board" className="sr-only">
              Bandeja
            </label>
            <select
              id="workbench-mobile-board"
              value={mobileBoardStatus}
              onChange={(event) =>
                setMobileBoardStatus(event.target.value as BoardStatus)
              }
              className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm font-black text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              {boardColumns.map((column) => (
                <option key={column.status} value={column.status}>
                  {column.title}
                </option>
              ))}
            </select>
            <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-xs font-black text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
              {mobileColumnOrders.length}
            </span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8">
                <LoadingIndicator label="Cargando pedidos..." />
              </div>
            ) : mobileColumnOrders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-3 py-8 text-center text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500">
                Sin pedidos
              </p>
            ) : (
              mobileColumnOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  status={mobileBoardColumn.status}
                  isProcessing={processingOrderId === order.id}
                  onAdvance={() => void handleAdvanceOrder(order)}
                  onReject={() => setPendingAction({ type: "reject", order })}
                  onOpenInfo={() => setSelectedOrder(order)}
                />
              ))
            )}
          </div>
        </section>

        <div className="hidden overflow-x-auto xl:block">
          <div className="grid min-w-[1320px] grid-cols-6 gap-4">
            {boardColumns.map((column) => {
              const columnOrders = ordersByStatus.get(column.status) ?? [];

              return (
                <section
                  key={column.status}
                  className="min-h-[360px] rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-950/50"
                >
                  <div className="mb-3 flex items-center justify-between gap-3 px-1">
                    <h2 className="text-sm font-black text-slate-700 dark:text-slate-200">
                      {column.title}
                    </h2>
                    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-xs font-black text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                      {columnOrders.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {isLoading ? (
                      <div className="py-8">
                        <LoadingIndicator label="Cargando pedidos..." />
                      </div>
                    ) : columnOrders.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-3 py-8 text-center text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500">
                        Sin pedidos
                      </p>
                    ) : (
                      columnOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          status={column.status}
                          isProcessing={processingOrderId === order.id}
                          onAdvance={() => void handleAdvanceOrder(order)}
                          onReject={() =>
                            setPendingAction({ type: "reject", order })
                          }
                          onOpenInfo={() => setSelectedOrder(order)}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {selectedOrder ? (
        <OrderInfoModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCustomerRatingSaved={handleCustomerRatingSaved}
          onReject={() =>
            setPendingAction({ type: "reject", order: selectedOrder })
          }
        />
      ) : null}

      {pendingAction ? (
        <OrderActionModal
          action={pendingAction}
          isProcessing={processingOrderId === pendingAction.order.id}
          onClose={() => setPendingAction(null)}
          onSubmit={(value) => void handleSubmitPendingAction(value)}
        />
      ) : null}
    </section>
  );
}

function OrderCard({
  isProcessing,
  onAdvance,
  onOpenInfo,
  onReject,
  order,
  status,
}: {
  isProcessing: boolean;
  onAdvance: () => void;
  onOpenInfo: () => void;
  onReject: () => void;
  order: WorkbenchOrder;
  status: BoardStatus;
}) {
  const nextStatus = nextStatusByStatus[order.status];
  const canReject = order.status === "PENDIENTE_CONFIRMACION_LOCAL";

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            PED-{order.id}
          </h3>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            {formatTime(order.createdAt)}
          </p>
        </div>
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-[11px] font-black",
            itemBadgeClassName[status],
          )}
        >
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="mt-4 min-h-[44px]">
        <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">
          {getCustomerLabel(order)}
        </p>
        <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
          {getOrderDescription(order)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-950 dark:text-white">
          {formatPrice(order.total)}
        </p>
        <div className="flex items-center gap-2">
          {canReject ? (
            <button
              type="button"
              onClick={onReject}
              disabled={isProcessing}
              aria-label="Mover pedido a rechazado"
              className="grid h-8 w-8 place-items-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenInfo}
            className="h-8 rounded-lg bg-orange-50 px-3 text-xs font-black text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20"
          >
            Ver info
          </button>
          {nextStatus ? (
            <button
              type="button"
              onClick={onAdvance}
              disabled={isProcessing}
              aria-label={`Mover pedido a ${statusLabels[nextStatus]}`}
              className="grid h-8 w-8 place-items-center rounded-lg border border-orange-100 text-orange-500 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-500/20 dark:hover:bg-orange-500/10"
            >
              {isProcessing ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function OrderInfoModal({
  onClose,
  onCustomerRatingSaved,
  onReject,
  order,
}: {
  onClose: () => void;
  onCustomerRatingSaved: (orderId: number, rating: WorkbenchOrderRating) => void;
  onReject: () => void;
  order: WorkbenchOrder;
}) {
  const [loadedRating, setLoadedRating] = useState<WorkbenchOrderRating | null>(
    order.customerRating,
  );
  const savedRating = loadedRating ?? order.customerRating;
  const canShowCustomerRating = order.status !== "RECHAZADO_LOCAL";
  const canRateCustomer = order.status === "FINALIZADO";
  const isRatingReadOnly = Boolean(savedRating);
  const ratingTimestamp = formatRatingTimestamp(savedRating?.creacion);
  const [selectedRating, setSelectedRating] =
    useState<WorkbenchRatingValue | null>(savedRating?.calificacion ?? null);
  const [ratingComment, setRatingComment] = useState(
    savedRating?.comentario ?? "",
  );
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  useEffect(() => {
    const initialRating = order.customerRating;
    setLoadedRating(initialRating);
    setSelectedRating(initialRating?.calificacion ?? null);
    setRatingComment(initialRating?.comentario ?? "");
    setRatingError(null);
    setIsRatingSubmitting(false);
  }, [order.customerRating, order.id]);

  useEffect(() => {
    if (order.customerRating) return;

    let isActive = true;

    async function loadSavedRating() {
      setIsRatingLoading(true);

      try {
        const rating = await getWorkbenchOrderCustomerRating(order.id);

        if (!isActive) return;

        if (rating) {
          setLoadedRating(rating);
          setSelectedRating(rating.calificacion);
          setRatingComment(rating.comentario ?? "");
          onCustomerRatingSaved(order.id, rating);
        }
      } catch (error) {
        if (!isActive) return;
        setRatingError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la calificacion del cliente.",
        );
      } finally {
        if (isActive) setIsRatingLoading(false);
      }
    }

    void loadSavedRating();

    return () => {
      isActive = false;
    };
  }, [onCustomerRatingSaved, order.customerRating, order.id]);

  async function handleSubmitCustomerRating(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (selectedRating == null || isRatingSubmitting || isRatingReadOnly) {
      return;
    }

    setIsRatingSubmitting(true);
    setRatingError(null);

    try {
      const rating = await submitWorkbenchOrderCustomerRating(order.id, {
        calificacion: selectedRating,
        comentario: ratingComment,
      });
      setLoadedRating(rating);
      setSelectedRating(rating.calificacion);
      setRatingComment(rating.comentario ?? "");
      onCustomerRatingSaved(order.id, rating);
    } catch (error) {
      setRatingError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la calificacion.",
      );
    } finally {
      setIsRatingSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Pedido
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
              PED-{order.id}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Cliente">{getCustomerLabel(order)}</DetailItem>
            {order.customerEmail ? (
              <DetailItem label="Correo">{order.customerEmail}</DetailItem>
            ) : null}
            {order.customerPhone ? (
              <DetailItem label="Telefono">{order.customerPhone}</DetailItem>
            ) : null}
            {order.customerDocument ? (
              <DetailItem label="Documento">{order.customerDocument}</DetailItem>
            ) : null}
            <DetailItem label="Estado">{statusLabels[order.status]}</DetailItem>
            <DetailItem label="Total">{formatPrice(order.total)}</DetailItem>
            <DetailItem label="Creado">{formatDate(order.createdAt)}</DetailItem>
            {order.address ? (
              <DetailItem label="Direccion">{order.address}</DetailItem>
            ) : null}
            {order.estimatedTime ? (
              <DetailItem label="Tiempo estimado">
                {order.estimatedTime}
              </DetailItem>
            ) : null}
          </div>

          {order.instructions ? (
            <DetailItem label="Indicaciones">{order.instructions}</DetailItem>
          ) : null}

          {order.comment ? (
            <DetailItem label="Comentario">{order.comment}</DetailItem>
          ) : null}

          {order.items.length > 0 ? (
            <div>
              <h3 className="mb-3 text-sm font-black text-slate-700 dark:text-slate-200">
                Items
              </h3>
              <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
                {order.items.map((item) => (
                  <div
                    key={`${item.id}-${item.name}`}
                    className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {item.total != null ? formatPrice(item.total) : "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {order.invoiceUrl ? (
            <a
              href={order.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-xl bg-orange-50 px-4 text-sm font-black text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20"
            >
              Ver factura
            </a>
          ) : null}

          {canShowCustomerRating ? (
            <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
                  Calificación del cliente
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {isRatingLoading
                    ? "Cargando calificacion guardada..."
                    : canRateCustomer || isRatingReadOnly
                      ? "Registra si la experiencia con este cliente fue positiva."
                      : "Disponible cuando el pedido este finalizado."}
                </p>
              </div>
              {isRatingReadOnly ? (
                <div className="shrink-0 text-right">
                  <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">
                    Calificado
                  </p>
                  {ratingTimestamp ? (
                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {ratingTimestamp}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {getRatingLabel(savedRating?.calificacion ?? selectedRating)}
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {isRatingLoading ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                Buscando calificacion registrada...
              </p>
            ) : isRatingReadOnly ? (
              <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {getRatingLabel(savedRating?.calificacion ?? selectedRating)}
                </p>
                {ratingTimestamp ? (
                  <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {ratingTimestamp}
                  </p>
                ) : null}
                {ratingComment ? (
                  <p className="mt-3 whitespace-pre-line text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {ratingComment}
                  </p>
                ) : null}
              </div>
            ) : canRateCustomer ? (
              <form onSubmit={handleSubmitCustomerRating} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {ratingOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = selectedRating === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isRatingSubmitting}
                        aria-pressed={isActive}
                        onClick={() => setSelectedRating(option.value)}
                        className={clsx(
                          "flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition disabled:cursor-default",
                          isActive
                            ? option.activeClassName
                            : "border-gray-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={ratingComment}
                  onChange={(event) => setRatingComment(event.target.value)}
                  placeholder="Agrega un comentario interno sobre el cliente."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                />

                {ratingError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {ratingError}
                  </p>
                ) : null}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={selectedRating == null || isRatingSubmitting}
                    className="h-10 rounded-xl bg-orange-600 px-4 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRatingSubmitting ? "Guardando..." : "Guardar calificacion"}
                  </button>
                </div>
              </form>
            ) : null}
            </div>
          ) : null}

          {order.status === "PENDIENTE_CONFIRMACION_LOCAL" ? (
            <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={onReject}
                className="h-10 rounded-xl bg-red-50 px-4 text-sm font-black text-red-500 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              >
                Rechazar pedido
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrderActionModal({
  action,
  isProcessing,
  onClose,
  onSubmit,
}: {
  action: PendingOrderAction;
  isProcessing: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const isAccept = action.type === "accept";
  const [value, setValue] = useState(isAccept ? "30-40 minutos" : "");
  const trimmedValue = value.trim();
  const canSubmit = trimmedValue.length > 0 && !isProcessing;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit(trimmedValue);
        }}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              PED-{action.order.id}
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
              {isAccept ? "Aceptar pedido" : "Rechazar pedido"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">
            {isAccept ? "Tiempo estimado" : "Motivo de rechazo"}
          </span>
          {isAccept ? (
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="30-40 minutos"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          ) : (
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="No tenemos stock del producto solicitado"
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          )}
        </label>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={clsx(
              "h-10 rounded-xl px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50",
              isAccept
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-red-500 hover:bg-red-600",
            )}
          >
            {isProcessing
              ? "Guardando..."
              : isAccept
                ? "Aceptar"
                : "Rechazar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DetailItem({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-black uppercase text-slate-400">
        {label}
      </span>
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {children}
      </div>
    </div>
  );
}
