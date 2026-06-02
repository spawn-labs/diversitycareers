import { JOB_LISTING_DAYS, LISTING_DURATION_COPY } from "../lib/listing";

export function ListingDurationNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-sm text-muted">
        Listings run for <strong>{JOB_LISTING_DAYS} days</strong> after payment.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
      <p className="font-semibold">{JOB_LISTING_DAYS}-day listing included</p>
      <p className="mt-1">{LISTING_DURATION_COPY}</p>
    </div>
  );
}
