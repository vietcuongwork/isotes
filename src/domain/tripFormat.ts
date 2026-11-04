// createdAt is in Unix seconds; the year shows only when it isn't now's year
export function formatTripCreatedDate(createdAt: number, now: Date): string {
  const created = new Date(createdAt * 1000);
  const isThisYear = created.getFullYear() === now.getFullYear();
  return created.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: isThisYear ? undefined : "numeric",
  });
}

export function formatTripDateLine(
  createdAt: number,
  currencyCode: string,
  now: Date,
): string {
  return `Created ${formatTripCreatedDate(createdAt, now)} · ${currencyCode}`;
}

export function formatExpenseCount(count: number): string {
  return `${count} ${count === 1 ? "expense" : "expenses"}`;
}
