import Link from "next/link";

import type { RestaurantDashboardOrder } from "@/lib/restaurant/dashboard/types";
import type { OrderStatus } from "@/lib/restaurant/workbench/types";

const statusClassName: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL:
    "bg-orange-50 text-orange-600 dark:bg-orange-500/10",
  ACEPTADO_LOCAL: "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
  EN_CURSO_LOCAL: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  EN_CAMINO_LOCAL: "bg-purple-50 text-purple-600 dark:bg-purple-500/10",
  FINALIZADO: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  RECHAZADO_LOCAL: "bg-red-50 text-red-500 dark:bg-red-500/10",
};

type RestaurantRecentOrdersProps = {
  isLoading: boolean;
  orders: RestaurantDashboardOrder[];
};

export default function RestaurantRecentOrders({
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
          className="w-fit rounded-xl bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10"
          href="/restaurant/workbench"
        >
          Ver mesa completa
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
            <tr>
              <th className="px-5 py-4 font-bold">Pedido</th>
              <th className="px-5 py-4 font-bold">Cliente</th>
              <th className="px-5 py-4 font-bold">Hora</th>
              <th className="px-5 py-4 font-bold">Total</th>
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

            {!isLoading && orders.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-8 text-center font-medium text-slate-400"
                  colSpan={5}
                >
                  No hay pedidos recientes para mostrar.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-4 font-bold text-slate-950 dark:text-white">
                      #{order.id}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {order.customerLabel}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {order.time}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
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
