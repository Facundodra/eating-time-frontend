"use client";

import { useCallback, useState } from "react";

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
  const [filters, setFilters] = useState<StatisticsFilters>(
    getDefaultStatisticsFilters,
  );

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

  const loadErrorMessage =
    loadError?.message ?? "No se pudieron cargar las estadísticas.";

  return (
    <section className="min-w-0 space-y-6">
      <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
            Filtros
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ajustá el rango temporal y la granularidad de las series.
          </p>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-2">
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
