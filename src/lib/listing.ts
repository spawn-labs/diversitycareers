export const JOB_LISTING_DAYS = 60;

export function formatExpiryDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function daysRemaining(expiresAt?: string, paidAt?: string, createdAt?: string): number | null {
  const expiry = expiresAt
    ? new Date(expiresAt).getTime()
    : new Date(
        (paidAt ?? createdAt ?? new Date().toISOString()),
      ).getTime() +
      JOB_LISTING_DAYS * 24 * 60 * 60 * 1000;
  const ms = expiry - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export const LISTING_DURATION_COPY = `Paid listings stay live for ${JOB_LISTING_DAYS} days from the date payment is received.`;
