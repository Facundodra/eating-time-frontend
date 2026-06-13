"use client";

import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
  WorkbenchLocalRating,
  WorkbenchOrder,
  WorkbenchOrderRating,
  WorkbenchRatingValue,
} from "@/lib/restaurant/workbench/types";
import { getCurrentSession } from "@/services/shared/auth-service";
import {
  changeWorkbenchOrderStatus,
  fetchWorkbenchOrders,
  confirmWorkbenchOrder,
  fetchRestaurantLocalRatings,
  getWorkbenchOrderCustomerRating,
  rejectWorkbenchOrder,
  submitWorkbenchOrderCustomerRating,
} from "@/services/restaurant/workbench-service";

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

const columnStatusClassName: Record<
  BoardStatus,
  { count: string; title: string }
> = {
  PENDIENTE_CONFIRMACION_LOCAL: {
    title: "text-[#633806]",
    count: "bg-[#FAEEDA] text-[#633806]",
  },
  ACEPTADO_LOCAL: {
    title: "text-[#0C447C]",
    count: "bg-[#E6F1FB] text-[#0C447C]",
  },
  EN_CURSO_LOCAL: {
    title: "text-[#534AB7]",
    count: "bg-[#EEEDFE] text-[#534AB7]",
  },
  EN_CAMINO_LOCAL: {
    title: "text-[#085041]",
    count: "bg-[#E1F5EE] text-[#085041]",
  },
  FINALIZADO: {
    title: "text-[#27500A]",
    count: "bg-[#EAF3DE] text-[#27500A]",
  },
  RECHAZADO_LOCAL: {
    title: "text-red-700 dark:text-red-300",
    count: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  },
};

type PendingOrderAction = {
  type: "accept" | "reject";
  order: WorkbenchOrder;
};

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

function getCustomerLabel(order: WorkbenchOrder) {
  if (order.customerName) return order.customerName;
  return order.customerId > 0
    ? `${order.customerId}`
    : "Cliente sin identificar";
}

function isFallbackCustomerName(value: string) {
  return value === "Cliente sin identificar" || value.startsWith("Cliente #");
}

function getCustomerNamesByOrderId(ratings: WorkbenchLocalRating[]) {
  const customerNames = new Map<number, string>();

  ratings.forEach((rating) => {
    if (rating.customerName) {
      customerNames.set(rating.orderId, rating.customerName);
    }
  });

  return customerNames;
}

function mergeOrderCustomerName(
  order: WorkbenchOrder,
  customerName: string | undefined,
): WorkbenchOrder {
  if (
    !customerName ||
    (order.customerName && !isFallbackCustomerName(order.customerName))
  ) {
    return order;
  }

  return {
    ...order,
    customerName,
  };
}

async function hydrateCustomerNames(
  restaurantId: string,
  orders: WorkbenchOrder[],
): Promise<WorkbenchOrder[]> {
  try {
    const ratings = await fetchRestaurantLocalRatings(restaurantId);
    const customerNamesByOrderId = getCustomerNamesByOrderId(ratings);

    if (customerNamesByOrderId.size === 0) return orders;

    return orders.map((order) =>
      mergeOrderCustomerName(order, customerNamesByOrderId.get(order.id)),
    );
  } catch (error) {
    console.warn(
      `No se pudieron cargar los nombres de clientes del local ${restaurantId}:`,
      error,
    );

    return orders;
  }
}

function getRatingLabel(value: WorkbenchRatingValue | null | undefined) {
  if (value === "P") return "Me gusta";
  if (value === "N") return "No me gusta";
  return "Calificacion registrada";
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
  const [orderId, setOrderId] = useState("");
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

      const workbenchFilters: WorkbenchFilters = {
        sortBy,
        direction,
        orderId: orderId || undefined,
      };

      try {
        const data = await fetchWorkbenchOrders(restaurantId, workbenchFilters);
        const ordersWithCustomerNames = await hydrateCustomerNames(
          restaurantId,
          data,
        );
        if (ignore) return;
        setOrders(
          ordersWithCustomerNames.filter((order) =>
            isBoardStatus(order.status),
          ),
        );
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
  }, [sortBy, direction, orderId, refreshKey]);

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
      currentOrders.map((currentOrder) =>
        currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder,
      ),
    );
    setSelectedOrder((currentOrder) =>
      currentOrder?.id === updatedOrder.id ? updatedOrder : currentOrder,
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

  return (
    <section className="min-w-0 space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[240px_160px_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-extrabold text-slate-600 dark:text-slate-300">
              Ordenar pedidos
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
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="antiguedad-desc">Mas recientes</option>
              <option value="antiguedad-asc">Mas antiguos</option>
              <option value="items-desc">Mas items</option>
              <option value="items-asc">Menos items</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-extrabold text-slate-600 dark:text-slate-300">
              Nro. pedido
            </span>
            <input
              type="number"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Ej: 5"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-11 w-fit items-center gap-2 self-end rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Actualizar
          </button>
        </div>
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

      <div className="min-h-[420px] overflow-x-auto pb-4">
        {!isLoading && !error && orders.length === 0 ? (
          <p className="mb-4 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            No hay pedidos en las ultimas 24 horas.
          </p>
        ) : null}

        <div className="grid min-w-[1320px] grid-cols-6 gap-4">
          {boardColumns.map((column) => {
            const columnOrders = ordersByStatus.get(column.status) ?? [];
            const columnClassName = columnStatusClassName[column.status];

            return (
              <section
                key={column.status}
                className="min-h-[360px] rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-950/50"
              >
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <h2
                    className={clsx(
                      "text-sm font-black",
                      columnClassName.title,
                    )}
                  >
                    {column.title}
                  </h2>
                  <span
                    className={clsx(
                      "grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-black shadow-sm",
                      columnClassName.count,
                    )}
                  >
                    {columnOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {isLoading ? (
                    <ColumnSkeleton />
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

function ColumnSkeleton() {
  return (
    <>
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="h-[132px] animate-pulse rounded-2xl bg-white shadow-sm dark:bg-slate-900"
        />
      ))}
    </>
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

          <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
                  Calificacion del cliente
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
            ) : canRateCustomer || isRatingReadOnly ? (
              <form onSubmit={handleSubmitCustomerRating} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {ratingOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = selectedRating === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isRatingReadOnly || isRatingSubmitting}
                        aria-pressed={isActive}
                        onClick={() => {
                          if (!isRatingReadOnly) {
                            setSelectedRating(option.value);
                          }
                        }}
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
                  readOnly={isRatingReadOnly}
                  placeholder="Agrega un comentario interno sobre el cliente."
                  rows={3}
                  className={clsx(
                    "w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20",
                    isRatingReadOnly &&
                      "cursor-default bg-slate-50 text-slate-800 focus:border-gray-200 focus:ring-0 dark:bg-slate-950 dark:text-slate-100",
                  )}
                />

                {ratingError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {ratingError}
                  </p>
                ) : null}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      selectedRating == null ||
                      isRatingSubmitting ||
                      isRatingReadOnly
                    }
                    className="h-10 rounded-xl bg-orange-600 px-4 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRatingSubmitting ? "Guardando..." : "Guardar calificacion"}
                  </button>
                </div>
              </form>
            ) : null}
          </div>

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
