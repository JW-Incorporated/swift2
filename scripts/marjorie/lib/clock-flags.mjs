// CI validation of the committed operational switch; host capability is tagged.
export function flagProblems({ live, since, now, previous, changedAt = now }) {
  const problems = [];
  if (typeof live !== 'boolean') problems.push('CLOCK_LIVE must be boolean');
  if (!live && since !== '') problems.push('off must clear CLOCK_LIVE_SINCE');
  if (live) {
    const at = typeof since === 'string' ? Date.parse(since) : NaN;
    if (!Number.isFinite(at) || at > now) problems.push('live needs a valid non-future CLOCK_LIVE_SINCE');
    if (previous && !previous.live && (since === previous.since || at < changedAt - 30 * 60_000)) problems.push('activation must set a fresh CLOCK_LIVE_SINCE');
  }
  return problems;
}
