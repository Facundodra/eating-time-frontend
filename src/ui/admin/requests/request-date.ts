const requestDateFormatter = new Intl.DateTimeFormat("es-UY", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatRequestDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = parseRequestDate(value);

  if (!date) {
    return value;
  }

  return requestDateFormatter.format(date);
}

function parseRequestDate(value: string) {
  const normalizedValue = value.trim();
  const dateParts = normalizedValue.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/,
  );

  if (dateParts) {
    const [, day, month, year, hour = "00", minute = "00"] = dateParts;
    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    );

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const isoDate = new Date(normalizedValue);

  return Number.isNaN(isoDate.getTime()) ? null : isoDate;
}
