"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type {
  OrderStatus,
  WorkbenchOrder,
} from "@/lib/restaurant/workbench/types";
import { fetchWorkbenchOrders } from "@/services/restaurant/workbench-service";
import { getCurrentSession } from "@/services/shared/auth-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

const activeOrderStatuses: OrderStatus[] = [
  "PENDIENTE_CONFIRMACION_LOCAL",
  "ACEPTADO_LOCAL",
  "EN_CURSO_LOCAL",
  "EN_CAMINO_LOCAL",
];

const statusLabels: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL: "Pendiente",
  ACEPTADO_LOCAL: "Aceptado",
  EN_CURSO_LOCAL: "En curso",
  EN_CAMINO_LOCAL: "En camino",
  FINALIZADO: "Finalizado",
  RECHAZADO_LOCAL: "Rechazado",
  CANCELADO_CLIENTE: "Cancelado",
};

const statusClassName: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL:
    "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  ACEPTADO_LOCAL:
    "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  EN_CURSO_LOCAL:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  EN_CAMINO_LOCAL:
    "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  FINALIZADO:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  RECHAZADO_LOCAL: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  CANCELADO_CLIENTE:
    "bg-gray-100 text-gray-500 dark:bg-gray-500/10 dark:text-gray-400",
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number) {
  return `$ ${price.toLocaleString("es-UY")}`;
}

function getPendingOrders(orders: WorkbenchOrder[]) {
  return orders
    .filter((order) => activeOrderStatuses.includes(order.status))
    .slice(0, 3);
}

export default function RestaurantRecentOrders() {
  const loadRecentOrders = useCallback(async () => {
    const session = await getCurrentSession();
    const restaurantId = session?.idTipoUsuario
      ? String(session.idTipoUsuario)
      : "";

    if (!restaurantId) {
      throw new Error("No se pudo obtener el ID del local.");
    }

    return fetchWorkbenchOrders(restaurantId, {
      sortBy: "antiguedad",
      direction: "desc",
    });
  }, []);

  const {
    data: orders,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadRecentOrders);

  // El card del home queda visible siempre; solo la bandeja de pedidos cambia
  // entre loading, error, vacio o datos reales segun la respuesta del backend.
  const pendingOrders = useMemo(() => getPendingOrders(orders ?? []), [orders]);
  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar los pedidos pendientes.";

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-950 dark:text-white">
            Pedidos recientes
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pedidos del dia que requieren seguimiento operativo.
          </p>
        </div>
        <Link
          className="w-fit rounded-xl bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
          href="/restaurant/workbench"
        >
          Ver mesa completa
        </Link>
      </div>

      <div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
            <tr>
              <th className="px-5 py-4 font-bold">Pedido</th>
              <th className="hidden px-5 py-4 font-bold md:table-cell">Cliente</th>
              <th className="px-5 py-4 font-bold">Hora</th>
              <th className="hidden px-5 py-4 font-bold md:table-cell">Items</th>
              <th className="hidden px-5 py-4 font-bold md:table-cell">Total</th>
              <th className="px-5 py-4 font-bold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
            {isLoading && (
              <tr>
                <td className="px-5 py-10" colSpan={6}>
                  <LoadingIndicator label="Cargando pedidos pendientes..." />
                </td>
              </tr>
            )}

            {!isLoading && loadError && (
              <tr>
                <td className="px-5 py-5" colSpan={6}>
                  <PanelError message={loadErrorMessage} onRetry={reload} />
                </td>
              </tr>
            )}

            {!isLoading && !loadError && pendingOrders.length === 0 && (
              <tr>
                <td
                  className="px-5 py-10 text-center text-sm font-medium text-slate-400 dark:text-slate-500"
                  colSpan={6}
                >
                  No hay pedidos pendientes por revisar.
                </td>
              </tr>
            )}

            {!isLoading && !loadError && pendingOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-5 py-4 font-bold text-slate-950 dark:text-white">
                  #{order.id}
                </td>
                <td className="hidden px-5 py-4 text-slate-500 md:table-cell dark:text-slate-400">
                  Cliente #{order.customerId}
                </td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                  {formatTime(order.createdAt)}
                </td>
                <td className="hidden px-5 py-4 text-slate-500 md:table-cell dark:text-slate-400">
                  -
                </td>
                <td className="hidden px-5 py-4 text-slate-500 md:table-cell dark:text-slate-400">
                  {formatPrice(order.total)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      statusClassName[order.status]
                    }`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
