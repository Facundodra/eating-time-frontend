import Link from "next/link";

import type { RestaurantDashboardOrder } from "@/lib/restaurant/dashboard/types";
import type { OrderStatus } from "@/lib/restaurant/workbench/types";

const statusClassName: Record<OrderStatus, string> = {
  EN_CARRITO:
    "bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400",
  ETAPA_DE_PAGO:
    "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
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

type RestaurantRecentOrdersProps = {
  error?: string | null;
  isLoading: boolean;
  orders: RestaurantDashboardOrder[];
};

export default function RestaurantRecentOrders({
  error,
  isLoading,
  orders,
}: RestaurantRecentOrdersProps) {
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
          className="w-fit text-sm font-bold text-orange-600 transition hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
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
              <th className="hidden px-5 py-4 font-bold md:table-cell">
                Cliente
              </th>
              <th className="px-5 py-4 font-bold">Hora</th>
              <th className="hidden px-5 py-4 font-bold md:table-cell">
                Total
              </th>
              <th className="px-5 py-4 font-bold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td
                  className="px-5 py-8 text-center font-medium text-slate-400"
                  colSpan={5}
                >
                  Cargando pedidos...
                </td>
              </tr>
            ) : null}

            {!isLoading && error ? (
              <tr>
                <td
                  className="px-5 py-8 text-center font-medium text-red-500"
                  colSpan={5}
                >
                  {error}
                </td>
              </tr>
            ) : null}

            {!isLoading && !error && orders.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-8 text-center font-medium text-slate-400"
                  colSpan={5}
                >
                  No hay pedidos recientes para mostrar.
                </td>
              </tr>
            ) : null}

            {!isLoading && !error
              ? orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-4 font-bold text-slate-950 dark:text-white">
                      #{order.id}
                    </td>
                    <td className="hidden px-5 py-4 text-slate-500 md:table-cell dark:text-slate-400">
                      {order.customerLabel}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {order.time}
                    </td>
                    <td className="hidden px-5 py-4 text-slate-500 md:table-cell dark:text-slate-400">
                      {order.total}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClassName[order.status]}`}
                      >
                        {order.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
