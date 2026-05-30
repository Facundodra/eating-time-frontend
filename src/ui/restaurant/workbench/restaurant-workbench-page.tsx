"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

import { getStoredSession } from "@/lib/auth/session-store";
import type { OrderStatus, WorkbenchFilters, WorkbenchOrder } from "@/lib/local-workbench/types";
import { fetchWorkbenchOrders } from "@/services/local-workbench-service";

const statusLabels: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL: "Pendiente",
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En curso",
  EN_CAMINO_LOCAL: "En camino",
  FINALIZADO: "Finalizado",
  RECHAZADO_LOCAL: "Rechazado",
};

const statusColors: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  ACEPTADO_LOCAL: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  EN_CURSO_LOCAL: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  EN_CAMINO_LOCAL: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  FINALIZADO: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  RECHAZADO_LOCAL: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={clsx("rounded-full px-3 py-1 text-xs font-extrabold", statusColors[status])}>
      {statusLabels[status]}
    </span>
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

export default function RestaurantWorkbenchPage() {
  const [orders, setOrders] = useState<WorkbenchOrder[] | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [sortBy, setSortBy] = useState<"antiguedad" | "items">("antiguedad");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [orderId, setOrderId] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchOrders() {
      const session = getStoredSession();
      const localId = session?.idTipoUsuario ? String(session.idTipoUsuario) : "";

      if (!localId) {
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
        const data = await fetchWorkbenchOrders(localId, workbenchFilters);
        if (ignore) return;
        setOrders(data);
        setError(null);
      } catch {
        if (ignore) return;
        setError("Error al cargar los pedidos.");
        setOrders([]);
      }
    }

    void fetchOrders();

    return () => {
      ignore = true;
    };
  }, [sortBy, direction, orderId, startDateTime, endDateTime]);

  const selectedOrder = orders?.find((o) => o.id === selectedOrderId) ?? null;

  return (
    <section className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Ordenar por
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "antiguedad" | "items")}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="antiguedad">Antigüedad</option>
              <option value="items">Cantidad de ítems</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Sentido
            </span>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "asc" | "desc")}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="desc">Más recientes</option>
              <option value="asc">Más antiguos</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Nº de pedido
            </span>
            <input
              type="number"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
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
              onChange={(e) => setStartDateTime(e.target.value)}
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
              onChange={(e) => setEndDateTime(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </label>
        </div>
      </div>

      {/* Orders grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(420px,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
              Pedidos recientes
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Pedidos de las últimas 24 horas. Selecciona uno para ver el detalle.
            </p>
          </div>

          <div className="space-y-4 p-3">
            {orders === null && (
              <p className="px-4 py-8 text-center text-sm font-medium text-slate-400">
                Cargando...
              </p>
            )}
            {orders !== null && orders.length === 0 && (
              <p className="px-4 py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                No hay pedidos para mostrar.
              </p>
            )}
            {orders?.map((order) => {
              const isSelected = order.id === selectedOrderId;

              return (
                <button
                  type="button"
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
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
                      {formatDate(order.createdAt)} — {formatPrice(order.total)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Detail panel */}
        {selectedOrder && (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-5 py-5 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Detalle del pedido #{selectedOrder.id}
              </h2>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Estado
                  </span>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Total
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {formatPrice(selectedOrder.total)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Creado
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Cliente ID
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {selectedOrder.customerId}
                  </p>
                </div>
              </div>

              {selectedOrder.discount != null && (
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Descuento
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {selectedOrder.discount}%
                  </p>
                </div>
              )}

              {selectedOrder.estimatedTime && (
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Tiempo estimado
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {selectedOrder.estimatedTime}
                  </p>
                </div>
              )}

              {selectedOrder.comment && (
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Comentario
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {selectedOrder.comment}
                  </p>
                </div>
              )}

              {selectedOrder.address && (
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Dirección
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {selectedOrder.address}
                  </p>
                </div>
              )}

              {selectedOrder.instructions && (
                <div>
                  <span className="mb-1 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Indicaciones
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {selectedOrder.instructions}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
