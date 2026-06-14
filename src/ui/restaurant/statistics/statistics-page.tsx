"use client";

import {
  ArrowsUpDownIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useMemo, useState } from "react";

import { useAsyncData } from "@/hooks/shared/use-async-data";
import type { StatisticsFilters } from "@/lib/restaurant/statistics/types";
import { getDefaultStatisticsFilters } from "@/lib/restaurant/statistics/utils";
import { fetchRestaurantStatistics } from "@/services/restaurant/statistics-service";
import LoadingIndicator from "@/ui/shared/feedback/loading-indicator";
import PanelError from "@/ui/shared/feedback/panel-error";

import ChartPanel from "./chart-panel";
import {
  DishSalesEvolutionChart,
  OrderStatusChart,
  PopularityRatingChart,
  PromotionsChart,
  RevenueChart,
  TopSellingDishesChart,
} from "./statistics-charts";

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20";

export default function RestaurantStatisticsPage() {
  const defaultFilters = useMemo(() => getDefaultStatisticsFilters(), []);
  const [filters, setFilters] = useState<StatisticsFilters>(defaultFilters);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const loadStatistics = useCallback(
    () => fetchRestaurantStatistics(filters),
    [filters],
  );

  const {
    data: statistics,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncData(loadStatistics);

  function updateFilter<K extends keyof StatisticsFilters>(
    key: K,
    value: StatisticsFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters((current) => ({
      ...defaultFilters,
      granularity: current.granularity,
    }));
  }

  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar las estadísticas.";

  const hasActiveFilters =
    filters.from !== defaultFilters.from ||
    filters.to !== defaultFilters.to ||
    filters.limit !== defaultFilters.limit ||
    filters.orderStatusDate !== defaultFilters.orderStatusDate;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 xl:hidden">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-extrabold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              <FunnelIcon className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-orange-600 dark:bg-orange-400" />
              )}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Limpiar filtros"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
              >
                <FunnelIcon className="h-5 w-5" />
                <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
              </button>
            )}

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <ArrowsUpDownIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
              <label htmlFor="statistics-granularity-mobile" className="sr-only">
                Granularidad
              </label>
              <select
                id="statistics-granularity-mobile"
                value={filters.granularity}
                onChange={(event) =>
                  updateFilter(
                    "granularity",
                    event.target.value as StatisticsFilters["granularity"],
                  )
                }
                className="h-11 w-[125px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-500/20"
              >
                <option value="dia">Por dia</option>
                <option value="mes">Por mes</option>
              </select>
            </div>
          </div>

          {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 pb-4 pt-20 backdrop-blur-sm sm:items-center sm:pt-16">
              <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-xl sm:max-w-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                      Filtros
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Ajusta el rango y los paneles de estadisticas.
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
                  <label htmlFor="statistics-from-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Desde
                    </span>
                    <input
                      id="statistics-from-mobile"
                      type="datetime-local"
                      value={filters.from}
                      onChange={(event) => updateFilter("from", event.target.value)}
                      className={INPUT_CLASS}
                    />
                  </label>

                  <label htmlFor="statistics-to-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Hasta
                    </span>
                    <input
                      id="statistics-to-mobile"
                      type="datetime-local"
                      value={filters.to}
                      onChange={(event) => updateFilter("to", event.target.value)}
                      className={INPUT_CLASS}
                    />
                  </label>

                  <label htmlFor="statistics-limit-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Top de platos
                    </span>
                    <input
                      id="statistics-limit-mobile"
                      type="number"
                      min={1}
                      max={20}
                      value={filters.limit}
                      onChange={(event) =>
                        updateFilter("limit", Number(event.target.value) || 10)
                      }
                      className={INPUT_CLASS}
                    />
                  </label>

                  <label htmlFor="statistics-order-status-date-mobile" className="block">
                    <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Fecha pedidos del dia
                    </span>
                    <input
                      id="statistics-order-status-date-mobile"
                      type="date"
                      value={filters.orderStatusDate}
                      onChange={(event) =>
                        updateFilter("orderStatusDate", event.target.value)
                      }
                      className={INPUT_CLASS}
                    />
                  </label>
                </div>

                <div className="flex gap-3 border-t border-gray-200 px-5 py-4 dark:border-slate-800">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
                    >
                      Limpiar filtros
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="h-11 flex-1 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-700"
                  >
                    Ver resultados
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 hidden xl:block">
          <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
            Filtros
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ajustá el rango temporal y la granularidad de las series.
          </p>
        </div>

        <div className="hidden gap-4 xl:grid xl:grid-cols-[190px_190px_180px_190px_180px_auto] xl:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Desde
            </span>
            <input
              type="datetime-local"
              value={filters.from}
              onChange={(event) => updateFilter("from", event.target.value)}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Hasta
            </span>
            <input
              type="datetime-local"
              value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Granularidad
            </span>
            <select
              value={filters.granularity}
              onChange={(event) =>
                updateFilter(
                  "granularity",
                  event.target.value as StatisticsFilters["granularity"],
                )
              }
              className={INPUT_CLASS}
            >
              <option value="dia">Por día</option>
              <option value="mes">Por mes</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Top de platos
            </span>
            <input
              type="number"
              min={1}
              max={20}
              value={filters.limit}
              onChange={(event) =>
                updateFilter("limit", Number(event.target.value) || 10)
              }
              className={INPUT_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Fecha pedidos del día
            </span>
            <input
              type="date"
              value={filters.orderStatusDate}
              onChange={(event) =>
                updateFilter("orderStatusDate", event.target.value)
              }
              className={INPUT_CLASS}
            />
          </label>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              aria-label="Limpiar filtros"
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-400"
            >
              <FunnelIcon className="h-5 w-5" />
              <XMarkIcon className="absolute right-2 top-2 h-3 w-3 stroke-[3]" />
            </button>
          )}
        </div>
      </div>

      {isLoading && !statistics && (
        <div className="py-12">
          <LoadingIndicator label="Cargando estadísticas..." />
        </div>
      )}

      {!isLoading && loadError && (
        <PanelError message={loadErrorMessage} onRetry={reload} />
      )}

      {statistics && (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartPanel
            title="Platos más vendidos"
            description="Cantidad de ventas por plato en pedidos ya confirmados por el local."
            isLoading={isLoading}
            isEmpty={statistics.topSellingDishes.items.length === 0}
          >
            <TopSellingDishesChart report={statistics.topSellingDishes} />
          </ChartPanel>

          <ChartPanel
            title="Estado de pedidos del día"
            description="Distribución por estado operativo de los pedidos creados en la fecha seleccionada."
            isLoading={isLoading}
            isEmpty={statistics.orderStatus.total === 0}
            emptyMessage="No hay pedidos registrados para la fecha seleccionada."
          >
            <OrderStatusChart report={statistics.orderStatus} />
          </ChartPanel>

          <div className="xl:col-span-2">
            <ChartPanel
              title="Evolución de ventas por plato"
              description="Comparación temporal de los platos más vendidos del período."
              isLoading={isLoading}
              isEmpty={statistics.dishSalesEvolution.series.length === 0}
            >
              <DishSalesEvolutionChart report={statistics.dishSalesEvolution} />
            </ChartPanel>
          </div>

          <div className="xl:col-span-2">
            <ChartPanel
              title="Ingresos por día o mes"
              description="Facturación del local según pedidos confirmados por el local."
              isLoading={isLoading}
              isEmpty={statistics.revenue.points.length === 0}
            >
              <RevenueChart report={statistics.revenue} />
            </ChartPanel>
          </div>

          <ChartPanel
            title="Promociones más utilizadas"
            description="Descuentos y cupones con mayor cantidad de usos."
            isLoading={isLoading}
            isEmpty={statistics.promotions.items.length === 0}
          >
            <PromotionsChart report={statistics.promotions} />
          </ChartPanel>

          <ChartPanel
            title="Popularidad y valoración"
            description="Comparación entre cantidad vendida y valoración promedio por plato."
            isLoading={isLoading}
            isEmpty={statistics.popularityRating.items.length === 0}
          >
            <PopularityRatingChart report={statistics.popularityRating} />
          </ChartPanel>
        </div>
      )}
    </section>
  );
}
