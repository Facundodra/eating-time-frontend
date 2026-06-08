import type { StatisticsFilters, StatisticsGranularity } from "./types";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateTimeLocalInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getDefaultStatisticsFilters(): StatisticsFilters {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  return {
    from: formatDateTimeLocalInput(from),
    to: formatDateTimeLocalInput(to),
    granularity: "dia",
    limit: 10,
    orderStatusDate: formatDateInput(to),
  };
}

export function toApiDateTime(value: string) {
  if (!value) {
    return value;
  }

  return value.length === 16 ? `${value}:00` : value;
}

export function formatCurrency(value: number) {
  return `$ ${value.toLocaleString("es-UY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatPeriodLabel(
  period: string,
  granularity: StatisticsGranularity,
) {
  if (granularity === "mes") {
    const [year, month] = period.split("-");
    return `${month}/${year}`;
  }

  const date = new Date(`${period}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return period;
  }

  return date.toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "short",
  });
}

export function getUniqueSortedPeriods(periods: string[]) {
  return [...new Set(periods)].sort();
}

export function getPromotionLabel(item: {
  type: "descuento" | "cupon";
  code: string | null;
  percentage: number | null;
  promotionId: number;
}) {
  if (item.type === "cupon" && item.code) {
    return `Cupón ${item.code}`;
  }

  if (item.percentage != null) {
    return `Descuento ${item.percentage}%`;
  }

  return item.type === "cupon"
    ? `Cupón #${item.promotionId}`
    : `Descuento #${item.promotionId}`;
}
