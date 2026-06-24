"use client";

import Link from "next/link";

import type { RestaurantRequest } from "./requests-data";
import {
  getRequestStatusLabel,
  getRequestStatusStyle,
} from "./requests-status";

type RequestsTableProps = Readonly<{
  requests: RestaurantRequest[];
}>;

export default function RequestsTable({ requests }: RequestsTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="divide-y divide-slate-100 bg-white md:hidden dark:divide-slate-800 dark:bg-slate-900">
        {requests.map((request) => (
          <article
            key={request.id}
            className="px-4 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {request.restaurant}
                </h3>
                <p className="mt-0.5 break-all text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {request.email}
                </p>
              </div>

              <StatusBadge status={request.status} />
            </div>

            <dl className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-2 dark:divide-slate-800 dark:border-slate-800">
              <MobileRequestField label="Teléfono">
                {request.phone || <span className="text-slate-400">-</span>}
              </MobileRequestField>
              <MobileRequestField label="Fecha">
                {request.date || <span className="text-slate-400">-</span>}
              </MobileRequestField>
            </dl>

            <div className="grid min-w-0 grid-cols-[5.75rem_minmax(0,1fr)] items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Detalle
              </span>
              <RequestDetailLink requestId={request.id} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-white text-xs uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-5 py-4 font-bold">Local</th>
              <th className="px-5 py-4 font-bold">Contacto</th>
              <th className="px-5 py-4 font-bold">Fecha solicitud</th>
              <th className="px-5 py-4 font-bold">Estado</th>
              <th className="px-5 py-4 font-bold">Detalle</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {requests.map((request) => (
              <tr
                key={request.id}
                className="transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                  {request.restaurant}
                </td>

                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                  <div className="space-y-1">
                    <p className="break-all">{request.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {request.phone || "-"}
                    </p>
                  </div>
                </td>

                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                  {request.date}
                </td>

                <td className="px-5 py-4">
                  <StatusBadge status={request.status} />
                </td>

                <td className="px-5 py-4">
                  <RequestDetailLink requestId={request.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: RestaurantRequest["status"] }) {
  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${getRequestStatusStyle(
        status,
      )}`}
    >
      {getRequestStatusLabel(status)}
    </span>
  );
}

function RequestDetailLink({ requestId }: { requestId: number }) {
  return (
    <Link
      href={`/admin/requests/${encodeURIComponent(requestId.toString())}`}
      className="w-fit rounded-xl bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-500 transition hover:bg-orange-500 hover:text-white"
    >
      Ver solicitud
    </Link>
  );
}

function MobileRequestField({
  children,
  label,
}: Readonly<{
  children: React.ReactNode;
  label: string;
}>) {
  return (
    <div className="grid min-w-0 grid-cols-[5.75rem_minmax(0,1fr)] items-start gap-3 py-1.5">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-slate-700 dark:text-slate-300">
        {children}
      </dd>
    </div>
  );
}
