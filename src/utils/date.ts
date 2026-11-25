function parseDateId(dateId: string) {
  // Y/M/D split + local-midnight construction — new Date(dateId) parses as
  // UTC and can shift a day depending on the device's timezone offset.
  const [year, month, day] = dateId.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "Oct 12"; the year shows only when it isn't now's year
export function formatShortDate(dateId: string, now: Date): string {
  const date = parseDateId(dateId);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function formatDateLabel(dateId: string) {
  return parseDateId(dateId).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
