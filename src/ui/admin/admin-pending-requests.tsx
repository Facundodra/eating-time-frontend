import Link from "next/link";

const pendingRequests = [
  {
    local: "La Pasta Nostra",
    email: "lapastanostra@email.com",
    date: "12/05/2026",
  },
  {
    local: "Sabor Criollo",
    email: "saborcriollo@email.com",
    date: "11/05/2026",
  },
  {
    local: "Wok Express",
    email: "wokexpress@email.com",
    date: "10/05/2026",
  },
];

export default function AdminPendingRequests() {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-950 dark:text-white">
            Solicitudes de locales pendientes
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Locales que requieren resolucion del administrador para quedar
            habilitados.
          </p>
        </div>
        <Link
          className="w-fit rounded-xl bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-500/10"
          href="/admin/solicitudes"
        >
          Ver todas
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
            <tr>
              <th className="px-5 py-4 font-bold">Local</th>
              <th className="px-5 py-4 font-bold">Email</th>
              <th className="px-5 py-4 font-bold">Fecha solicitud</th>
              <th className="px-5 py-4 font-bold">Estado</th>
              <th className="px-5 py-4 font-bold">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
            {pendingRequests.map((request) => (
              <tr key={request.email}>
                <td className="px-5 py-4 font-bold text-slate-950 dark:text-white">
                  {request.local}
                </td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                  {request.email}
                </td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                  {request.date}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 dark:bg-orange-500/10">
                    Pendiente
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Link
                    className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-500/10"
                    href="/admin/solicitudes"
                  >
                    Ver mas
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
