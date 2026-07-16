const formattedDatePattern = /^\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2})?$/;

export function formatRequestDate(value: string) {
  const dateValue = value.trim();

  if (!dateValue) {
    return "";
  }

  if (formattedDatePattern.test(dateValue)) {
    return dateValue;
  }

  const backendDateMatch = dateValue.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/,
  );

  if (backendDateMatch) {
    const [, year, month, day, hour, minute] = backendDateMatch;

    if (hour && minute) {
      return `${day}/${month}/${year} ${hour}:${minute}`;
    }

    return `${day}/${month}/${year}`;
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const hour = String(parsedDate.getHours()).padStart(2, "0");
  const minute = String(parsedDate.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hour}:${minute}`;
}
