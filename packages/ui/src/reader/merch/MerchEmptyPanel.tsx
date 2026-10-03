/**
 * Merch page redesign (PLAN.md, "Placeholders for the two empty buckets"):
 * the honest empty-state treatment for `officialStore` / `fanMade`, both
 * genuinely empty in `merch.ts` until real curated data exists. Mirrors the
 * mockup's `.empty` block — a dashed panel, never a fabricated product.
 */
export function MerchEmptyPanel({ message }: { message: string }) {
  return (
    <div className="grid place-items-center border border-dashed border-[color:var(--merch-line-strong)] px-6 py-12 text-center text-sm leading-relaxed text-[color:var(--merch-muted)]">
      {message}
    </div>
  );
}
