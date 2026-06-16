"use client";

import {
  ArrowPathIcon,
  ArrowRightIcon,
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

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  OrderStatus,
  WorkbenchFilters,
  WorkbenchLocalRating,
  WorkbenchOrder,
  WorkbenchOrderRating,
  WorkbenchRatingValue,
} from "@/lib/restaurant/workbench/types";
import {
  fetchRestaurantLocalRatings,
  fetchRestaurantOrders,
  getWorkbenchOrderCustomerRating,
  submitWorkbenchOrderCustomerRating,
} from "@/services/restaurant/workbench-service";
import { getCurrentSession } from "@/services/shared/auth-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

type OrderFilter = "all" | OrderStatus;
type SortKey = "antiguedad-desc" | "antiguedad-asc" | "items-desc" | "items-asc";

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

const sortOptions: Record<SortKey, WorkbenchFilters> = {
  "antiguedad-desc": { sortBy: "antiguedad", direction: "desc" },
  "antiguedad-asc": { sortBy: "antiguedad", direction: "asc" },
  "items-desc": { sortBy: "items", direction: "desc" },
  "items-asc": { sortBy: "items", direction: "asc" },
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

function getRatingLabel(value: WorkbenchRatingValue | null | undefined) {
  if (value === "P") return "Positiva";
  if (value === "N") return "Negativa";
  return "Sin calificar";
}

function formatRatingTimestamp(value: string | null | undefined) {
  return value ? formatDateTimeLabel(value) : null;
}

function getCustomerLabel(order: WorkbenchOrder) {
  if (order.customerName) return order.customerName;
  return order.customerId > 0 ? `${order.customerId}` : "Cliente sin identificar";
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

function getOrderDescription(order: WorkbenchOrder) {
  if (order.items.length > 0) {
    return order.items
      .slice(0, 2)
      .map((item) => `${item.quantity} ${item.name}`)
      .join(", ");
  }

  return order.comment ?? order.instructions ?? "Pedido sin detalle de items";
}

function itemCountLabel(order: WorkbenchOrder) {
  return `${order.itemCount} ${order.itemCount === 1 ? "item" : "items"}`;
}

function filterOrders(orders: WorkbenchOrder[], filter: OrderFilter) {
  if (filter === "all") return orders;
  return orders.filter((order) => order.status === filter);
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

async function loadRestaurantOrders(
  filters: WorkbenchFilters,
): Promise<WorkbenchOrder[]> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("No se encontro una sesion activa.");
  }

  const restaurantId = String(session.idTipoUsuario);
  const orders = await fetchRestaurantOrders(restaurantId, filters);

  return hydrateCustomerNames(restaurantId, orders);
}

function OrderMobileCard({
  onOpen,
  order,
}: {
  onOpen: () => void;
  order: WorkbenchOrder;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-orange-600 dark:text-orange-400">
            Pedido #{order.id}
          </p>
          <h3 className="mt-2 truncate text-base font-extrabold text-slate-950 dark:text-white">
            {getCustomerLabel(order)}
          </h3>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        {getOrderDescription(order)}
      </p>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <DetailPreview label="Creado">
          {formatDateTimeLabel(order.createdAt)}
        </DetailPreview>
        <DetailPreview label="Items">{itemCountLabel(order)}</DetailPreview>
        <DetailPreview label="Total">{formatPrice(order.total)}</DetailPreview>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
      >
        Ver pedido
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </article>
  );
}

export default function RestaurantOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderFilter>("all");
  const [sort, setSort] = useState<SortKey>("antiguedad-desc");
  const [orderId, setOrderId] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<WorkbenchOrder | null>(
    null,
  );

  const loadOrders = useCallback(() => {
    const sortFilter = sortOptions[sort];

    return loadRestaurantOrders({
      ...sortFilter,
      orderId: orderId || undefined,
      startDateTime: startDateTime || undefined,
      endDateTime: endDateTime || undefined,
    });
  }, [endDateTime, orderId, sort, startDateTime]);

  const {
    data: loadedOrders,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadOrders);

  const filteredOrders = useMemo(() => {
    return filterOrders(loadedOrders ?? [], statusFilter);
  }, [loadedOrders, statusFilter]);

  const isDataReady = Boolean(loadedOrders) && !isLoading && !loadError;
  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar los pedidos.";

  function handleCustomerRatingSaved(
    orderId: number,
    rating: WorkbenchOrderRating,
  ) {
    setSelectedOrder((currentOrder) =>
      currentOrder?.id === orderId
        ? {
            ...currentOrder,
            customerRating: rating,
            hasCustomerRating: true,
          }
        : currentOrder,
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[190px_220px_160px_200px_200px_auto]">
          <label htmlFor="order-status-filter" className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Estado
            </span>
            <select
              id="order-status-filter"
              value={statusFilter}
              disabled={!isDataReady}
              onChange={(event) =>
                setStatusFilter(event.target.value as OrderFilter)
              }
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="all">Todos</option>
              <option value="PENDIENTE_CONFIRMACION_LOCAL">Pendientes</option>
              <option value="ACEPTADO_LOCAL">Aceptados</option>
              <option value="EN_CURSO_LOCAL">En curso</option>
              <option value="EN_CAMINO_LOCAL">En camino</option>
              <option value="FINALIZADO">Finalizados</option>
              <option value="RECHAZADO_LOCAL">Rechazados</option>
              <option value="CANCELADO_CLIENTE">Cancelados</option>
            </select>
          </label>

          <label htmlFor="order-sort" className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Ordenar
            </span>
            <select
              id="order-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="antiguedad-desc">Mas recientes</option>
              <option value="antiguedad-asc">Mas antiguos</option>
              <option value="items-desc">Mas items</option>
              <option value="items-asc">Menos items</option>
            </select>
          </label>

          <label htmlFor="order-id-filter" className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Nro. pedido
            </span>
            <input
              id="order-id-filter"
              type="number"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Ej: 5"
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>

          <label htmlFor="order-start-filter" className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Desde
            </span>
            <input
              id="order-start-filter"
              type="datetime-local"
              value={startDateTime}
              onChange={(event) => setStartDateTime(event.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>

          <label htmlFor="order-end-filter" className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Hasta
            </span>
            <input
              id="order-end-filter"
              type="datetime-local"
              value={endDateTime}
              onChange={(event) => setEndDateTime(event.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>

          <button
            type="button"
            onClick={reload}
            className="flex h-12 w-fit items-center justify-center gap-2 self-end rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Pedidos recibidos
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Consulta el historial de pedidos y abre el detalle sin modificar su
            estado.
          </p>
        </div>

        <div className="p-3">
          {isLoading ? (
            <div className="py-8">
              <LoadingIndicator label="Cargando pedidos..." />
            </div>
          ) : loadError ? (
            <PanelError message={loadErrorMessage} onRetry={reload} />
          ) : filteredOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
              No hay pedidos para mostrar.
            </p>
          ) : null}

          {isDataReady && filteredOrders.length > 0 ? (
            <>
              <div className="grid gap-3 lg:hidden">
                {filteredOrders.map((order) => (
                  <OrderMobileCard
                    key={order.id}
                    order={order}
                    onOpen={() => setSelectedOrder(order)}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <div className="min-w-[980px] overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
                  <div className="grid grid-cols-[110px_minmax(170px,1fr)_minmax(220px,1.3fr)_150px_120px_130px_140px] items-center gap-4 border-b border-gray-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <span>Pedido</span>
                    <span>Cliente</span>
                    <span>Detalle</span>
                    <span>Estado</span>
                    <span>Items</span>
                    <span>Total</span>
                    <span>Acciones</span>
                  </div>

                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-[110px_minmax(170px,1fr)_minmax(220px,1.3fr)_150px_120px_130px_140px] items-center gap-4 border-b border-gray-100 px-4 py-4 text-sm last:border-b-0 dark:border-slate-800"
                    >
                      <div className="font-black text-orange-600 dark:text-orange-400">
                        #{order.id}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-extrabold text-slate-900 dark:text-white">
                          {getCustomerLabel(order)}
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                          {formatDateTimeLabel(order.createdAt)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-extrabold text-slate-900 dark:text-white">
                          {getOrderDescription(order)}
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                          {order.address ?? "Sin direccion"}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="font-extrabold text-slate-700 dark:text-slate-200">
                        {itemCountLabel(order)}
                      </div>
                      <div className="font-extrabold text-slate-700 dark:text-slate-200">
                        {formatPrice(order.total)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="flex h-10 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
                      >
                        Ver pedido
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

      {selectedOrder ? (
        <OrderDetailModal
          order={selectedOrder}
          onCustomerRatingSaved={handleCustomerRatingSaved}
          onClose={() => setSelectedOrder(null)}
        />
      ) : null}
    </section>
  );
}

function OrderDetailModal({
  onCustomerRatingSaved,
  onClose,
  order,
}: {
  onCustomerRatingSaved: (orderId: number, rating: WorkbenchOrderRating) => void;
  onClose: () => void;
  order: WorkbenchOrder;
}) {
  const [showRating, setShowRating] = useState(false);
  const [loadedRating, setLoadedRating] = useState<WorkbenchOrderRating | null>(
    order.customerRating,
  );
  const savedRating = loadedRating ?? order.customerRating;
  const hasSavedCustomerRating = order.hasCustomerRating || Boolean(savedRating);
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
  const canRateCustomer = order.status === "FINALIZADO";

  useEffect(() => {
    const initialRating = order.customerRating;
    setLoadedRating(initialRating);
    setSelectedRating(initialRating?.calificacion ?? null);
    setRatingComment(initialRating?.comentario ?? "");
    setRatingError(null);
    setIsRatingSubmitting(false);
    setShowRating(Boolean(initialRating));
  }, [order.customerRating, order.id]);

  async function handleOpenRating() {
    setShowRating(true);
    setRatingError(null);

    if (savedRating || isRatingLoading) return;

    setIsRatingLoading(true);

    try {
      const rating = await getWorkbenchOrderCustomerRating(order.id);

      if (rating) {
        setLoadedRating(rating);
        setSelectedRating(rating.calificacion);
        setRatingComment(rating.comentario ?? "");
        onCustomerRatingSaved(order.id, rating);
      }
    } catch (error) {
      setRatingError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la calificacion del cliente.",
      );
    } finally {
      setIsRatingLoading(false);
    }
  }

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
            <DetailItem label="Estado">
              <StatusBadge status={order.status} />
            </DetailItem>
            <DetailItem label="Total">{formatPrice(order.total)}</DetailItem>
            <DetailItem label="Creado">
              {formatDateTimeLabel(order.createdAt)}
            </DetailItem>
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
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
                  Calificación del cliente
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {canRateCustomer || isRatingReadOnly
                    ? "Registra si la experiencia con este cliente fue positiva."
                    : "Disponible cuando el pedido este finalizado."}
                </p>
              </div>
              {canRateCustomer || isRatingReadOnly ? (
                <button
                  type="button"
                  onClick={() => void handleOpenRating()}
                  className="h-10 shrink-0 rounded-xl bg-orange-50 px-4 text-sm font-black text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20"
                >
                  {hasSavedCustomerRating ? "Ver calificación" : "Calificar"}
                </button>
              ) : null}
            </div>

            {showRating ? (
              isRatingLoading ? (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  Buscando calificacion registrada...
                </p>
              ) : (
                <form onSubmit={handleSubmitCustomerRating} className="space-y-3">
                  {isRatingReadOnly ? (
                    <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                      <p>{getRatingLabel(savedRating?.calificacion ?? selectedRating)}</p>
                      {ratingTimestamp ? (
                        <p className="mt-1 text-xs text-slate-400">
                          {ratingTimestamp}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

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

                  {!isRatingReadOnly ? (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={selectedRating == null || isRatingSubmitting}
                        className="h-10 rounded-xl bg-orange-600 px-4 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRatingSubmitting
                          ? "Guardando..."
                          : "Guardar calificacion"}
                      </button>
                    </div>
                  ) : null}
                </form>
              )
            ) : null}
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
  children: ReactNode;
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
