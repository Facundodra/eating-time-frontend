"use client";

import { ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  OrderStatus,
  WorkbenchFilters,
  WorkbenchOrder,
} from "@/lib/restaurant/workbench/types";
import { fetchRestaurantOrders } from "@/services/restaurant/workbench-service";
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
  EN_CARRITO: "bg-slate-50 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400",
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
  RECHAZADO_LOCAL: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300",
  CANCELADO_CLIENTE:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const sortOptions: Record<SortKey, WorkbenchFilters> = {
  "antiguedad-desc": { sortBy: "antiguedad", direction: "desc" },
  "antiguedad-asc": { sortBy: "antiguedad", direction: "asc" },
  "items-desc": { sortBy: "items", direction: "desc" },
  "items-asc": { sortBy: "items", direction: "asc" },
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
  return order.customerName ?? `Cliente #${order.customerId}`;
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

async function loadRestaurantOrders(
  filters: WorkbenchFilters,
): Promise<WorkbenchOrder[]> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("No se encontro una sesion activa.");
  }

  return fetchRestaurantOrders(String(session.idTipoUsuario), filters);
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
  const [selectedOrder, setSelectedOrder] = useState<WorkbenchOrder | null>(null);

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
              onChange={(event) => setStatusFilter(event.target.value as OrderFilter)}
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
            className="h-12 w-fit self-end rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10"
          >
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
            Consulta el historial de pedidos y abre el detalle sin modificar su estado.
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
          onClose={() => setSelectedOrder(null)}
        />
      ) : null}
    </section>
  );
}

function OrderDetailModal({
  onClose,
  order,
}: {
  onClose: () => void;
  order: WorkbenchOrder;
}) {
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
