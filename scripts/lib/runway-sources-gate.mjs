// Validation for the optional `sources` list on a RUNWAY_LOOKS entry (#5173).
// Absent is fine (existing looks have none yet); when present each entry needs
// a non-empty title and an https URL. Returns error strings, empty when valid.
export function runwaySourceErrors(sources) {
  if (sources === undefined) return [];
  if (!Array.isArray(sources)) return ['sources must be an array when present'];
  const errors = [];
  sources.forEach((s, i) => {
    const at = `sources[${i}]`;
    if (!s || typeof s.title !== 'string' || s.title.trim() === '') errors.push(`${at} missing a non-empty title`);
    if (!s || typeof s.url !== 'string' || !/^https:\/\/\S+$/.test(s.url)) {
      errors.push(`${at} url must be an https URL (got "${s?.url}")`);
    }
  });
  return errors;
}
