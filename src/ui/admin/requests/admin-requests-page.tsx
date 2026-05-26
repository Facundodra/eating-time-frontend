import RequestsFilters from "./requests-filters";
import RequestsTable from "./requests-table";

export default function AdminRequestsPage() {
  return (
    <section className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Gestion y revision de solicitudes de registro de locales pendientes,
        aprobadas o rechazadas.
      </p>

      <RequestsFilters />
      <RequestsTable />
    </section>
  );
}
