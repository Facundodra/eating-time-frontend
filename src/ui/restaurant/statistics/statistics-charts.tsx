"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";

import type {
  DishSalesEvolutionReport,
  OrderStatusReport,
  PopularityRatingReport,
  PromotionsReport,
  RevenueReport,
  TopSellingDishesReport,
} from "@/lib/restaurant/statistics/types";
import {
  formatCurrency,
  formatPeriodLabel,
  getPromotionLabel,
  getUniqueSortedPeriods,
} from "@/lib/restaurant/statistics/utils";

const SERIES_COLORS = [
  "#ea580c",
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
];

const ORDER_STATUS_COLORS: Record<string, string> = {
  COMPLETADOS: "#10b981",
  PENDIENTES: "#f59e0b",
  RECHAZADOS: "#ef4444",
  CANCELADOS: "#94a3b8",
};

const chartSx = {
  "& .MuiChartsAxis-tickLabel": {
    fontSize: 11,
  },
  "& .MuiChartsLegend-label": {
    fontSize: 12,
  },
};

type TopSellingDishesChartProps = {
  report: TopSellingDishesReport;
};

export function TopSellingDishesChart({ report }: TopSellingDishesChartProps) {
  const labels = report.items.map((item) => item.name);
  const quantities = report.items.map((item) => item.quantitySold);

  return (
    <BarChart
      layout="horizontal"
      height={Math.max(280, report.items.length * 42)}
      yAxis={[{ scaleType: "band", data: labels }]}
      series={[
        {
          data: quantities,
          label: "Cantidad vendida",
          color: SERIES_COLORS[0],
        },
      ]}
      margin={{ left: 120, right: 24, top: 24, bottom: 24 }}
      sx={chartSx}
    />
  );
}

type DishSalesEvolutionChartProps = {
  report: DishSalesEvolutionReport;
};

export function DishSalesEvolutionChart({
  report,
}: DishSalesEvolutionChartProps) {
  const periods = getUniqueSortedPeriods(
    report.series.flatMap((series) => series.points.map((point) => point.period)),
  );
  const xLabels = periods.map((period) =>
    formatPeriodLabel(period, report.granularity),
  );

  return (
    <LineChart
      height={340}
      xAxis={[{ scaleType: "point", data: xLabels }]}
      series={report.series.map((series, index) => ({
        data: periods.map((period) => {
          const point = series.points.find((entry) => entry.period === period);
          return point?.quantity ?? 0;
        }),
        label: series.name,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        curve: "linear",
        showMark: periods.length <= 20,
      }))}
      margin={{ left: 56, right: 24, top: 24, bottom: 56 }}
      sx={chartSx}
    />
  );
}

type RevenueChartProps = {
  report: RevenueReport;
};

export function RevenueChart({ report }: RevenueChartProps) {
  const xLabels = report.points.map((point) =>
    formatPeriodLabel(point.period, report.granularity),
  );
  const revenues = report.points.map((point) => point.revenue);

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Total del período:{" "}
        <span className="font-extrabold text-slate-900 dark:text-white">
          {formatCurrency(report.periodTotal)}
        </span>
      </p>
      <LineChart
        height={340}
        xAxis={[{ scaleType: "point", data: xLabels }]}
        series={[
          {
            data: revenues,
            label: "Ingresos",
            color: SERIES_COLORS[0],
            area: true,
            curve: "linear",
            showMark: report.points.length <= 20,
          },
        ]}
        margin={{ left: 72, right: 24, top: 24, bottom: 56 }}
        sx={chartSx}
      />
    </div>
  );
}

type OrderStatusChartProps = {
  report: OrderStatusReport;
};

export function OrderStatusChart({ report }: OrderStatusChartProps) {
  const pieData = report.slices
    .filter((slice) => slice.count > 0)
    .map((slice) => ({
      id: slice.category,
      value: slice.count,
      label: slice.label,
      color: ORDER_STATUS_COLORS[slice.category] ?? SERIES_COLORS[0],
    }));

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Total del día ({report.date}):{" "}
        <span className="font-extrabold text-slate-900 dark:text-white">
          {report.total} pedidos
        </span>
      </p>
      <PieChart
        height={320}
        series={[
          {
            data: pieData,
            innerRadius: 40,
            paddingAngle: 2,
            cornerRadius: 4,
            highlightScope: { fade: "global", highlight: "item" },
          },
        ]}
        margin={{ top: 24, bottom: 24, left: 24, right: 120 }}
        sx={chartSx}
      />
    </div>
  );
}

type PromotionsChartProps = {
  report: PromotionsReport;
};

export function PromotionsChart({ report }: PromotionsChartProps) {
  const labels = report.items.map((item) => getPromotionLabel(item));
  const uses = report.items.map((item) => item.uses);

  return (
    <BarChart
      height={Math.max(280, report.items.length * 48)}
      xAxis={[{ scaleType: "band", data: labels }]}
      series={[
        {
          data: uses,
          label: "Usos",
          color: SERIES_COLORS[1],
        },
      ]}
      margin={{ left: 56, right: 24, top: 24, bottom: 72 }}
      sx={chartSx}
    />
  );
}

type PopularityRatingChartProps = {
  report: PopularityRatingReport;
};

export function PopularityRatingChart({ report }: PopularityRatingChartProps) {
  const labels = report.items.map((item) => item.name);
  const quantities = report.items.map((item) => item.quantitySold);
  const ratings = report.items.map((item) => item.averageRating);
  const chartHeight = Math.max(220, report.items.length * 36);

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Valoración global del local:{" "}
        <span className="font-extrabold text-slate-900 dark:text-white">
          {report.globalRestaurantRating.toFixed(2)} / 5
        </span>
      </p>

      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Cantidad vendida
        </p>
        <BarChart
          layout="horizontal"
          height={chartHeight}
          yAxis={[{ scaleType: "band", data: labels }]}
          series={[
            {
              data: quantities,
              label: "Ventas",
              color: SERIES_COLORS[0],
            },
          ]}
          margin={{ left: 120, right: 24, top: 8, bottom: 8 }}
          sx={chartSx}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Valoración promedio
        </p>
        <BarChart
          layout="horizontal"
          height={chartHeight}
          yAxis={[{ scaleType: "band", data: labels }]}
          xAxis={[{ min: 0, max: 5 }]}
          series={[
            {
              data: ratings,
              label: "Valoración",
              color: SERIES_COLORS[2],
            },
          ]}
          margin={{ left: 120, right: 24, top: 8, bottom: 8 }}
          sx={chartSx}
        />
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Compará platos muy vendidos con baja valoración o platos bien valorados
        pero poco pedidos.
      </p>
    </div>
  );
}
