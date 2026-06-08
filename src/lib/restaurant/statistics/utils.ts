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
    return `Descuento ${item.percentage}% (#${item.promotionId})`;
  }

  return item.type === "cupon"
    ? `Cupón #${item.promotionId}`
    : `Descuento #${item.promotionId}`;
}

function summarizeDishNames(names: string[], maxVisible = 2) {
  if (names.length === 0) {
    return "";
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length <= maxVisible) {
    return names.join(", ");
  }

  const visible = names.slice(0, maxVisible).join(", ");
  return `${visible} +${names.length - maxVisible}`;
}

export function buildPromotionDisplayLabel(
  item: {
    type: "descuento" | "cupon";
    promotionId: number;
    code: string | null;
    percentage: number | null;
  },
  options?: {
    discountDishes?: string[];
    couponCode?: string | null;
    couponDescription?: string | null;
  },
) {
  if (item.type === "cupon") {
    const code = item.code ?? options?.couponCode ?? `#${item.promotionId}`;
    const percentage =
      item.percentage != null ? ` · ${item.percentage}%` : "";
    const description = options?.couponDescription?.trim();
    return description
      ? `Cupón ${code}${percentage} · ${description}`
      : `Cupón ${code}${percentage}`;
  }

  const percentage = item.percentage;
  const percentageLabel =
    percentage != null ? `${percentage}%` : `#${item.promotionId}`;
  const dishes = summarizeDishNames(options?.discountDishes ?? []);

  if (dishes) {
    return `Descuento ${percentageLabel} · ${dishes}`;
  }

  return `Descuento ${percentageLabel} · promo #${item.promotionId}`;
}
