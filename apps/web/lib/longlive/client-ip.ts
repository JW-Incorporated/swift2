// Shared trusted-IP resolver for per-route rate limiting.
//
// Trust ONLY the header layer Vercel's own edge controls, never whatever a
// client hands us (#1973). `x-forwarded-for` is a client-EXTENDABLE chain —
// each proxy APPENDS its own hop, it never overwrites earlier entries — so
// the FIRST (leftmost) value is attacker-supplied; sending a random XFF per
// request used to buy a fresh, never-limited rate-limit bucket every time on
// any route using the leftmost value. `x-real-ip` is set by Vercel's edge
// network from the actual peer of the request that reached it, not
// forwarded through from a client-sent header of the same name, so it's the
// trustworthy value; the rightmost `x-forwarded-for` entry (the hop
// Vercel's own edge appended) is the fallback if `x-real-ip` is ever absent.
//
// Originally fixed in /api/feedback (#1973, 2026-08). 2026-09-02 security
// audit follow-up (kanban t_07025f1e) found the fix had not been propagated
// to every other public route — several still keyed rate limiting off the
// spoofable leftmost XFF hop. Extracted here so every route shares one
// implementation instead of drifting again.
export function trustedClientIp(req: Request): string {
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const hops = xff.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return 'unknown';
}
