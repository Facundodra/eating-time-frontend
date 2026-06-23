"use client";

import useMediaQuery from "@mui/material/useMediaQuery";
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
  buildWorkbenchAlignedOrderStatusSlices,
  formatCurrency,
  formatPeriodLabel,
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
  PENDIENTES: "#f59e0b",
  ACEPTADOS: "#10b981",
  EN_CURSO: "#6366f1",
  EN_CAMINO: "#a855f7",
  COMPLETADOS: "#64748b",
  RECHAZADOS: "#ef4444",
  CANCELADOS: "#94a3b8",
  REJECTED_OR_CANCELLED: "#ef4444",
};

const chartHeight = 340;
const mobileChartHeight = 300;
const horizontalBarRowHeight = 44;
const mobileHorizontalBarRowHeight = 40;
const compactLabelMaxLength = 22;
const mobileLabelMaxLength = 14;

const chartSx = {
  "& .MuiChartsAxis-tickLabel": {
    fill: "rgb(100 116 139)",
    fontSize: 11,
    fontWeight: 600,
  },
  "& .MuiChartsLegend-label": {
    fill: "rgb(71 85 105)",
    fontSize: 12,
    fontWeight: 700,
  },
  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
    stroke: "rgb(203 213 225)",
  },
  "& .MuiChartsGrid-line": {
    stroke: "rgb(226 232 240)",
    strokeDasharray: "4 4",
  },
  "& .MuiChartsTooltip-root": {
    fontSize: 12,
  },
};

const bottomLegend = {
  legend: {
    direction: "horizontal" as const,
    position: { vertical: "bottom" as const, horizontal: "center" as const },
  },
};

const rightLegend = {
  legend: {
    direction: "vertical" as const,
    position: { vertical: "middle" as const, horizontal: "end" as const },
  },
};

const mobileBottomLegend = {
  legend: {
    direction: "horizontal" as const,
    position: { vertical: "bottom" as const, horizontal: "center" as const },
  },
};

function useMobileCharts() {
  return useMediaQuery("(max-width: 767px)", { noSsr: true });
}

function compactLabel(label: string, maxLength = compactLabelMaxLength) {
  return label.length > maxLength ? `${label.slice(0, maxLength - 3)}...` : label;
}

function buildTickInterval(length: number, maxVisibleTicks = 10) {
  if (length <= maxVisibleTicks) return undefined;

  const step = Math.ceil(length / maxVisibleTicks);
  return (_value: unknown, index: number) =>
    index === 0 || index === length - 1 || index % step === 0;
}

function formatCompactNumber(value: unknown) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("es-UY", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatCompactCurrency(value: unknown) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("es-UY", {
    currency: "UYU",
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency",
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

type TopSellingDishesChartProps = {
  report: TopSellingDishesReport;
};

export function TopSellingDishesChart({ report }: TopSellingDishesChartProps) {
  const isMobile = useMobileCharts();
  const labels = report.items.map((item) => item.name);
  const quantities = report.items.map((item) => item.quantitySold);

  return (
    <BarChart
      layout="horizontal"
      height={Math.max(
        isMobile ? 260 : 300,
        report.items.length *
          (isMobile ? mobileHorizontalBarRowHeight : horizontalBarRowHeight),
      )}
      borderRadius={6}
      grid={{ vertical: true }}
      hideLegend
      yAxis={[
        {
          data: labels,
          scaleType: "band",
          tickLabelPlacement: "middle",
          valueFormatter: (value) =>
            compactLabel(String(value), isMobile ? mobileLabelMaxLength : compactLabelMaxLength),
          width: isMobile ? 96 : 144,
        },
      ]}
      xAxis={[{ valueFormatter: (value: unknown) => formatCompactNumber(value) }]}
      series={[
        {
          data: quantities,
          label: "Cantidad vendida",
          color: SERIES_COLORS[0],
          valueFormatter: (value) =>
            `${value ?? 0} ${(value ?? 0) === 1 ? "venta" : "ventas"}`,
        },
      ]}
      margin={{
        left: isMobile ? 4 : 12,
        right: isMobile ? 12 : 28,
        top: 16,
        bottom: isMobile ? 28 : 32,
      }}
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
  const isMobile = useMobileCharts();
  const periods = getUniqueSortedPeriods(
    report.series.flatMap((series) => series.points.map((point) => point.period)),
  );
  const xLabels = periods.map((period) =>
    formatPeriodLabel(period, report.granularity),
  );

  return (
    <LineChart
      height={isMobile ? mobileChartHeight : chartHeight}
      grid={{ horizontal: true, vertical: true }}
      slotProps={bottomLegend}
      xAxis={[
        {
          data: xLabels,
          height: "auto",
          scaleType: "point",
          tickLabelInterval: buildTickInterval(xLabels.length, isMobile ? 5 : 10),
        },
      ]}
      yAxis={[
        {
          valueFormatter: (value: unknown) => formatCompactNumber(value),
          width: isMobile ? 36 : 48,
        },
      ]}
      series={report.series.map((series, index) => ({
        data: periods.map((period) => {
          const point = series.points.find((entry) => entry.period === period);
          return point?.quantity ?? 0;
        }),
        label: series.name,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        curve: "linear",
        showMark: periods.length <= 20,
        valueFormatter: (value) =>
          `${value ?? 0} ${(value ?? 0) === 1 ? "venta" : "ventas"}`,
      }))}
      margin={{
        left: isMobile ? 4 : 12,
        right: isMobile ? 12 : 28,
        top: 20,
        bottom: isMobile ? 88 : 72,
      }}
      sx={chartSx}
    />
  );
}

type RevenueChartProps = {
  report: RevenueReport;
};

export function RevenueChart({ report }: RevenueChartProps) {
  const isMobile = useMobileCharts();
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
        height={isMobile ? mobileChartHeight : chartHeight}
        grid={{ horizontal: true, vertical: true }}
        hideLegend
        xAxis={[
          {
            data: xLabels,
            height: "auto",
            scaleType: "point",
            tickLabelInterval: buildTickInterval(xLabels.length, isMobile ? 5 : 10),
          },
        ]}
        yAxis={[
          {
            valueFormatter: (value: unknown) => formatCompactCurrency(value),
            width: isMobile ? 58 : 72,
          },
        ]}
        series={[
          {
            data: revenues,
            label: "Ingresos",
            color: SERIES_COLORS[0],
            area: true,
            curve: "linear",
            showMark: report.points.length <= 20,
            valueFormatter: (value) => formatCurrency(value ?? 0),
          },
        ]}
        margin={{
          left: isMobile ? 4 : 12,
          right: isMobile ? 12 : 28,
          top: 20,
          bottom: isMobile ? 56 : 64,
        }}
        sx={chartSx}
      />
    </div>
  );
}

type OrderStatusChartProps = {
  report: OrderStatusReport;
};

export function OrderStatusChart({ report }: OrderStatusChartProps) {
  const isMobile = useMobileCharts();
  const pieData = buildWorkbenchAlignedOrderStatusSlices(report.slices).map(
    (slice) => ({
      id: slice.id,
      value: slice.count,
      label: slice.label,
      color: ORDER_STATUS_COLORS[slice.id] ?? SERIES_COLORS[0],
    }),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Total del día ({report.date}):{" "}
        <span className="font-extrabold text-slate-900 dark:text-white">
          {report.total} pedidos
        </span>
      </p>
      <PieChart
        height={isMobile ? 360 : 340}
        slotProps={isMobile ? mobileBottomLegend : rightLegend}
        series={[
          {
            arcLabel: (item) =>
              report.total > 0 && item.value / report.total >= 0.08
                ? `${Math.round((item.value / report.total) * 100)}%`
                : "",
            arcLabelMinAngle: 18,
            cornerRadius: 5,
            data: pieData,
            faded: { additionalRadius: -8, color: "rgb(203 213 225)" },
            highlightScope: { fade: "global", highlight: "item" },
            innerRadius: isMobile ? 54 : 72,
            outerRadius: isMobile ? 92 : 122,
            paddingAngle: 2,
            valueFormatter: (item) =>
              `${item.value} ${item.value === 1 ? "pedido" : "pedidos"}`,
          },
        ]}
        margin={
          isMobile
            ? { top: 8, bottom: 96, left: 8, right: 8 }
            : { top: 12, bottom: 12, left: 24, right: 164 }
        }
        sx={chartSx}
      />
    </div>
  );
}

type PromotionsChartProps = {
  report: PromotionsReport;
};

export function PromotionsChart({ report }: PromotionsChartProps) {
  const isMobile = useMobileCharts();
  const labels = report.items.map((item) => item.label);
  const uses = report.items.map((item) => item.uses);
  const maxLabelLength = labels.reduce(
    (max, label) => Math.max(max, label.length),
    0,
  );

  return (
    <div className="space-y-4">
      <BarChart
        layout="horizontal"
        height={Math.max(
          isMobile ? 240 : 260,
          report.items.length * (isMobile ? 42 : 48),
        )}
        borderRadius={6}
        grid={{ vertical: true }}
        hideLegend
        yAxis={[
          {
            data: labels,
            scaleType: "band",
            valueFormatter: (value) =>
              compactLabel(String(value), isMobile ? 16 : 28),
            width: isMobile
              ? 104
              : Math.min(220, Math.max(144, maxLabelLength * 6)),
          },
        ]}
        xAxis={[
          {
            tickMinStep: 1,
            valueFormatter: (value: unknown) => formatCompactNumber(value),
          },
        ]}
        series={[
          {
            data: uses,
            label: "Usos",
            color: SERIES_COLORS[1],
            valueFormatter: (value) =>
              `${value ?? 0} ${(value ?? 0) === 1 ? "uso" : "usos"}`,
          },
        ]}
        margin={{
          left: isMobile ? 4 : 12,
          right: isMobile ? 12 : 28,
          top: 12,
          bottom: isMobile ? 28 : 32,
        }}
        sx={chartSx}
      />
      <ul className="space-y-2 border-t border-gray-100 pt-4 dark:border-slate-800">
        {report.items.map((item) => (
          <li
            key={`${item.type}-${item.promotionId}`}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {item.label}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {item.uses} {item.uses === 1 ? "uso" : "usos"} ·{" "}
              {formatCurrency(item.discountedAmount)} descontados
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type PopularityRatingChartProps = {
  report: PopularityRatingReport;
};

export function PopularityRatingChart({ report }: PopularityRatingChartProps) {
  const isMobile = useMobileCharts();
  const labels = report.items.map((item) => item.name);
  const quantities = report.items.map((item) => item.quantitySold);
  const ratings = report.items.map((item) => item.averageRating);
  const popularityChartHeight = Math.max(
    isMobile ? 220 : 240,
    report.items.length * (isMobile ? 36 : 40),
  );

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
          height={popularityChartHeight}
          borderRadius={6}
          grid={{ vertical: true }}
          hideLegend
          yAxis={[
            {
              data: labels,
              scaleType: "band",
              valueFormatter: (value) =>
                compactLabel(String(value), isMobile ? mobileLabelMaxLength : compactLabelMaxLength),
              width: isMobile ? 96 : 144,
            },
          ]}
          xAxis={[{ valueFormatter: (value: unknown) => formatCompactNumber(value) }]}
          series={[
            {
              data: quantities,
              label: "Ventas",
              color: SERIES_COLORS[0],
              valueFormatter: (value) =>
                `${value ?? 0} ${(value ?? 0) === 1 ? "venta" : "ventas"}`,
            },
          ]}
          margin={{
            left: isMobile ? 4 : 12,
            right: isMobile ? 12 : 28,
            top: 8,
            bottom: 28,
          }}
          sx={chartSx}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Valoración promedio
        </p>
        <BarChart
          layout="horizontal"
          height={popularityChartHeight}
          borderRadius={6}
          grid={{ vertical: true }}
          hideLegend
          yAxis={[
            {
              data: labels,
              scaleType: "band",
              valueFormatter: (value) =>
                compactLabel(String(value), isMobile ? mobileLabelMaxLength : compactLabelMaxLength),
              width: isMobile ? 96 : 144,
            },
          ]}
          xAxis={[{ max: 5, min: 0, tickNumber: 6 }]}
          series={[
            {
              data: ratings,
              label: "Valoración",
              color: SERIES_COLORS[2],
              valueFormatter: (value) => `${(value ?? 0).toFixed(2)} / 5`,
            },
          ]}
          margin={{
            left: isMobile ? 4 : 12,
            right: isMobile ? 12 : 28,
            top: 8,
            bottom: 28,
          }}
          sx={chartSx}
        />
      </div>

    </div>
  );
}
