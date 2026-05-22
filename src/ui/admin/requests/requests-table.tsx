"use client";

import Link from "next/link";
import { useRequests } from "./use-requests";
import {
  getRequestStatusLabel,
  getRequestStatusStyle,
} from "./requests-status";;

export default function RequestsTable() {
  const { requests } = useRequests();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-4 font-bold">Local</th>
              <th className="px-5 py-4 font-bold">Email</th>
              <th className="px-5 py-4 font-bold">Teléfono</th>
              <th className="px-5 py-4 font-bold">Fecha solicitud</th>
              <th className="px-5 py-4 font-bold">Estado</th>
              <th className="px-5 py-4 font-bold">Detalle</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 bg-slate-950">
            {requests.map((request) => (
              <tr
                key={request.email}
                className="transition hover:bg-slate-900/70"
              >
                <td className="px-5 py-4 font-bold text-white">
                  {request.restaurant}
                </td>

                <td className="px-5 py-4 text-slate-300">{request.email}</td>

                <td className="px-5 py-4 text-slate-300">{request.phone}</td>

                <td className="px-5 py-4 text-slate-300">{request.date}</td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${getRequestStatusStyle(
                      request.status,
                    )}`}
                  >
                    {getRequestStatusLabel(request.status)}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <Link
                    href={`/admin/requests/${encodeURIComponent(
                      request.email,
                    )}`}
                    className="rounded-xl bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-500 transition hover:bg-orange-500 hover:text-white"
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