import clsx from "clsx";
import Link from "next/link";

const requests = [
  {
    restaurant: "La Pasta Nostra",
    email: "lapastanostra@email.com",
    phone: "099 123 456",
    date: "12/05/2026",
    status: "pending",
    statusLabel: "Pendiente",
  },
  {
    restaurant: "Sabor Criollo",
    email: "saborcriollo@email.com",
    phone: "098 456 789",
    date: "10/05/2026",
    status: "approved",
    statusLabel: "Aprobada",
  },
  {
    restaurant: "Wok Express",
    email: "wokexpress@email.com",
    phone: "091 852 741",
    date: "08/05/2026",
    status: "rejected",
    statusLabel: "Rechazada",
  },
];

const statusClassName = {
  pending:
    "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  approved:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

export default function RequestsTable() {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
            <tr>
              <th className="px-5 py-4 font-bold">Local</th>
              <th className="px-5 py-4 font-bold">Email</th>
              <th className="px-5 py-4 font-bold">Telefono</th>
              <th className="px-5 py-4 font-bold">Fecha solicitud</th>
              <th className="px-5 py-4 font-bold">Estado</th>
              <th className="px-5 py-4 font-bold">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
            {requests.map((request) => (
              <tr key={request.email}>
                <td className="px-5 py-5 font-bold text-slate-950 dark:text-white">
                  {request.restaurant}
                </td>
                <td className="px-5 py-5 text-slate-500 dark:text-slate-400">
                  {request.email}
                </td>
                <td className="px-5 py-5 text-slate-500 dark:text-slate-400">
                  {request.phone}
                </td>
                <td className="px-5 py-5 text-slate-500 dark:text-slate-400">
                  {request.date}
                </td>
                <td className="px-5 py-5">
                  <span
                    className={clsx(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      statusClassName[
                        request.status as keyof typeof statusClassName
                      ],
                    )}
                  >
                    {request.statusLabel}
                  </span>
                </td>
                <td className="px-5 py-5">
                  <Link
                    className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20"
                    href="/admin/requests"
                  >
                    Ver solicitud
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
