"use client";

import type { RequestStatusFilter } from "./requests-data";

type SortBy = "recent" | "oldest" | "name-asc";

type Props = Readonly<{
  resultCount: number;
  filterRestaurant: string;
  onFilterRestaurantChange: (value: string) => void;
  filterEmail: string;
  onFilterEmailChange: (value: string) => void;
  filterStatus: RequestStatusFilter;
  onFilterStatusChange: (value: RequestStatusFilter) => void;
  filterDate: string;
  onFilterDateChange: (value: string) => void;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
}>;

export default function RequestsFilters({
  resultCount,
  filterRestaurant,
  onFilterRestaurantChange,
  filterEmail,
  onFilterEmailChange,
  filterStatus,
  onFilterStatusChange,
  filterDate,
  onFilterDateChange,
  sortBy,
  onSortByChange,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">
          Filtros de busqueda
        </h2>

        <span className="rounded-full bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-500">
          {resultCount} resultados
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FilterField label="Nombre del local">
          <input
            type="text"
            placeholder="Buscar por nombre"
            value={filterRestaurant}
            onChange={(event) => onFilterRestaurantChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </FilterField>

        <FilterField label="Email">
          <input
            type="text"
            placeholder="Buscar por email"
            value={filterEmail}
            onChange={(event) => onFilterEmailChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </FilterField>

        <FilterField label="Estado">
          <select
            value={filterStatus}
            onChange={(event) =>
              onFilterStatusChange(event.target.value as RequestStatusFilter)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aceptadas</option>
            <option value="rejected">Rechazadas</option>
          </select>
        </FilterField>

        <FilterField label="Fecha solicitud">
          <input
            type="date"
            value={filterDate}
            onChange={(event) => onFilterDateChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </FilterField>

        <FilterField label="Ordenar por">
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortBy)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="recent">Mas recientes</option>
            <option value="oldest">Mas antiguos</option>
            <option value="name-asc">Nombre A-Z</option>
          </select>
        </FilterField>
      </div>
    </section>
  );
}

function FilterField({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
