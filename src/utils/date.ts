function parseDateId(dateId: string) {
  // Y/M/D split + local-midnight construction — new Date(dateId) parses as
  // UTC and can shift a day depending on the device's timezone offset.
  const [year, month, day] = dateId.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateLabel(dateId: string) {
  return parseDateId(dateId).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
