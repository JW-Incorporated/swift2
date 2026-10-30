// Count ratchet for content types that publish text but have no media field
// yet (track guides, Era Secrets, On This Day). Adding a renderable media
// field to those schemas is a product decision, so until it is made the number
// of text-only rows is frozen: it can shrink, never grow. A new text-only row
// fails validate:content, and a row that gains media (or is removed) also
// fails until the ceiling is lowered to the actual count, so ceiling == count.
// Raising a ceiling to make a build pass is forbidden — add media to the row
// instead (docs/agents/content-shift.md).
// Limit: this is a count, so deleting one text-only row and adding another in
// the same change is not detectable here.
export const TEXT_ONLY_CEILING = {
  'track guides (no youtubeId or media)': 0,
  'Era Secrets': 56,
  'On This Day pool': 38,
};

export function textOnlyRatchetFindings(counts, ceilings = TEXT_ONLY_CEILING) {
  const findings = [];
  for (const [name, ceiling] of Object.entries(ceilings)) {
    const count = counts[name];
    if (count == null) continue;
    if (count > ceiling)
      findings.push({
        level: 'error',
        message: `${count} text-only ${name} row(s) exceeds the frozen ceiling of ${ceiling} (scripts/lib/text-only-ratchet.mjs) — every new row needs an image or video; do not raise the ceiling`,
      });
    else if (count < ceiling)
      findings.push({
        level: 'error',
        message: `${name} text-only count fell to ${count}; lower its ceiling in scripts/lib/text-only-ratchet.mjs from ${ceiling} to ${count}`,
      });
  }
  return findings;
}
