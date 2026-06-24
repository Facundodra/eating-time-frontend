"use client";

import {
  ArrowPathIcon,
  ArrowsUpDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

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
  onRefresh: () => void;
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
  onRefresh,
}: Props) {
  const [draftRestaurant, setDraftRestaurant] = useState(filterRestaurant);
  const [draftEmail, setDraftEmail] = useState(filterEmail);
  const [draftStatus, setDraftStatus] =
    useState<RequestStatusFilter>(filterStatus);
  const [draftDate, setDraftDate] = useState(filterDate);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const hasActiveFilters =
    filterRestaurant.trim() !== "" ||
    filterEmail.trim() !== "" ||
    filterStatus !== "all" ||
    filterDate !== "";
  const hasDraftFilters =
    draftRestaurant.trim() !== "" ||
    draftEmail.trim() !== "" ||
    draftStatus !== "all" ||
    draftDate !== "";

  function openMobileFilters() {
    setDraftRestaurant(filterRestaurant);
    setDraftEmail(filterEmail);
    setDraftStatus(filterStatus);
    setDraftDate(filterDate);
    setIsMobileFiltersOpen(true);
  }

  function applyFilters() {
    onFilterRestaurantChange(draftRestaurant.trim());
    onFilterEmailChange(draftEmail.trim());
    onFilterStatusChange(draftStatus);
    onFilterDateChange(draftDate);
    setIsMobileFiltersOpen(false);
  }

  function clearFilters() {
    onFilterRestaurantChange("");
    onFilterEmailChange("");
    onFilterStatusChange("all");
    onFilterDateChange("");
    setDraftRestaurant("");
    setDraftEmail("");
    setDraftStatus("all");
    setDraftDate("");
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-4 xl:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openMobileFilters}
            aria-label="Abrir filtros"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
          >
            <FunnelIcon className="h-4 w-4" />
            {hasActiveFilters ? (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-600 dark:bg-orange-400" />
            ) : null}
          </button>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              aria-label="Limpiar filtros"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              <FunnelIcon className="h-5 w-5" />
              <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            aria-label="Actualizar solicitudes"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:ml-auto sm:flex-none">
            <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <label htmlFor="request-sort-mobile" className="sr-only">
              Orden
            </label>
            <select
              id="request-sort-mobile"
              value={sortBy}
              onChange={(event) => onSortByChange(event.target.value as SortBy)}
              className="h-11 min-w-0 max-w-full flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 sm:w-[125px] sm:flex-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="name-asc">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {isMobileFiltersOpen ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 pb-4 pt-20 backdrop-blur-sm sm:items-center sm:pt-16">
            <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-xl sm:max-w-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                    Filtros
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Ajusta la lista de solicitudes visible.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  aria-label="Cerrar filtros"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:text-orange-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-orange-400"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 px-5 py-5">
                <FilterField label="Local" htmlFor="request-restaurant-mobile">
                  <span className="relative block">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      id="request-restaurant-mobile"
                      type="search"
                      placeholder="Nombre del local"
                      value={draftRestaurant}
                      onChange={(event) =>
                        setDraftRestaurant(event.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pl-10 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                    />
                  </span>
                </FilterField>

                <FilterField label="Email" htmlFor="request-email-mobile">
                  <input
                    id="request-email-mobile"
                    type="search"
                    placeholder="Email del local"
                    value={draftEmail}
                    onChange={(event) => setDraftEmail(event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
                  />
                </FilterField>

                <FilterField label="Estado" htmlFor="request-status-mobile">
                  <select
                    id="request-status-mobile"
                    value={draftStatus}
                    onChange={(event) =>
                      setDraftStatus(event.target.value as RequestStatusFilter)
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="approved">Aceptadas</option>
                    <option value="rejected">Rechazadas</option>
                  </select>
                </FilterField>

                <FilterField label="Fecha solicitud" htmlFor="request-date-mobile">
                  <input
                    id="request-date-mobile"
                    type="date"
                    value={draftDate}
                    onChange={(event) => setDraftDate(event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
                  />
                </FilterField>
              </div>

              <div className="flex gap-3 border-t border-gray-200 px-5 py-4 dark:border-slate-800">
                {hasDraftFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
                  >
                    Limpiar filtros
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={applyFilters}
                  className="h-11 flex-1 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
                >
                  Ver resultados
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {resultCount} {resultCount === 1 ? "resultado" : "resultados"}
        </p>
      </div>

      <div className="hidden gap-4 xl:flex xl:items-end xl:justify-between">
        <div className="grid gap-4 xl:grid-cols-[220px_220px_180px_180px_auto_auto] xl:items-end">
          <FilterField label="Nombre del local">
            <input
              type="search"
              placeholder="Buscar por nombre"
              value={filterRestaurant}
              onChange={(event) => onFilterRestaurantChange(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
            />
          </FilterField>

          <FilterField label="Email">
            <input
              type="search"
              placeholder="Buscar por email"
              value={filterEmail}
              onChange={(event) => onFilterEmailChange(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-orange-500/20"
            />
          </FilterField>

          <FilterField label="Estado">
            <select
              value={filterStatus}
              onChange={(event) =>
                onFilterStatusChange(event.target.value as RequestStatusFilter)
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
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
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
            />
          </FilterField>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Limpiar filtros"
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              >
                <FunnelIcon className="h-5 w-5" />
                <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              aria-label="Actualizar solicitudes"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
        </div>

        <FilterField label="Orden" className="block w-full xl:w-[200px]">
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortBy)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
          >
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguos</option>
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
  className = "space-y-2",
  htmlFor,
}: Readonly<{
  label: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}>) {
  return (
    <label className={className} htmlFor={htmlFor}>
      <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      {children}
    </label>
  );
}
