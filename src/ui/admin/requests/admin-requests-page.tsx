"use client";

import RequestsFilters from "./requests-filters";
import RequestsTable from "./requests-table";
import { useRequests } from "./use-requests";

export default function AdminRequestsPage() {
  const { totals } = useRequests();

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          Solicitudes de locales
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Gestión y revisión de solicitudes de registro de locales pendientes,
          aprobadas o rechazadas.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard label="Pendientes" value={totals.pending} />
        <StatusCard label="Aprobadas" value={totals.approved} />
        <StatusCard label="Rechazadas" value={totals.rejected} />
      </div>

      <RequestsFilters resultCount={totals.all} />

      <RequestsTable />
    </section>
  );
}

function StatusCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>

      <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
    </article>
  );
}