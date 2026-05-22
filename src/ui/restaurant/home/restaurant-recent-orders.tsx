import Link from "next/link";

const orders = [
  {
    id: "#1248",
    customer: "Martina Diaz",
    time: "20:14",
    items: 4,
    total: "$ 1.280",
    status: "pending",
    statusLabel: "Pendiente",
  },
  {
    id: "#1247",
    customer: "Federico Ruiz",
    time: "20:05",
    items: 2,
    total: "$ 740",
    status: "accepted",
    statusLabel: "Aceptado",
  },
  {
    id: "#1246",
    customer: "Lucia Moreira",
    time: "19:52",
    items: 5,
    total: "$ 1.690",
    status: "inProgress",
    statusLabel: "En curso",
  },
];

const statusClassName = {
  pending: "bg-orange-50 text-orange-600 dark:bg-orange-500/10",
  accepted: "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
  inProgress: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
};

export default function RestaurantRecentOrders() {
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
        <table className="w-full min-w-[820px] text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
            <tr>
              <th className="px-5 py-4 font-bold">Pedido</th>
              <th className="px-5 py-4 font-bold">Cliente</th>
              <th className="px-5 py-4 font-bold">Hora</th>
              <th className="px-5 py-4 font-bold">Items</th>
              <th className="px-5 py-4 font-bold">Total</th>
              <th className="px-5 py-4 font-bold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-5 py-4 font-bold text-slate-950 dark:text-white">
                  {order.id}
                </td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                  {order.customer}
                </td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                  {order.time}
                </td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                  {order.items}
                </td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                  {order.total}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      statusClassName[
                        order.status as keyof typeof statusClassName
                      ]
                    }`}
                  >
                    {order.statusLabel}
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
