const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
];

const sortOptions = [
  { value: "newest", label: "Mas recientes" },
  { value: "oldest", label: "Mas antiguas" },
];

export default function RequestsFilters() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">
          Filtros de busqueda
        </h2>
        <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600 dark:bg-orange-500/10">
          12 resultados
        </span>
      </div>

      <form className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1.2fr_1.2fr_1.2fr_0.8fr]">
        <label className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Nombre del local
          </span>
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-500"
            placeholder="Buscar por nombre"
            type="text"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Email
          </span>
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-500"
            placeholder="Buscar por email"
            type="email"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Estado
          </span>
          <select className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950">
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Fecha solicitud
          </span>
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950"
            type="date"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Ordenar por
          </span>
          <select className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950">
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </form>
    </section>
  );
}
