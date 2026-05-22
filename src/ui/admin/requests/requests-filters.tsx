"use client";

type Props = {
  resultCount: number;
};

export default function RequestsFilters({ resultCount }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Filtros de búsqueda</h2>

        <span className="rounded-full bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-500">
          {resultCount} resultados
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FilterField label="Nombre del local">
          <input
            type="text"
            placeholder="Buscar por nombre"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-orange-500"
          />
        </FilterField>

        <FilterField label="Email">
          <input
            type="text"
            placeholder="Buscar por email"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-orange-500"
          />
        </FilterField>

        <FilterField label="Estado">
          <select className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500">
            <option>Todos</option>
            <option>Pendientes</option>
            <option>Aprobadas</option>
            <option>Rechazadas</option>
          </select>
        </FilterField>

        <FilterField label="Fecha solicitud">
          <input
            type="date"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
          />
        </FilterField>

        <FilterField label="Ordenar por">
          <select className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500">
            <option>Más recientes</option>
            <option>Más antiguos</option>
            <option>Nombre A-Z</option>
          </select>
        </FilterField>
      </div>
    </section>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}