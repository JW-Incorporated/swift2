function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function linePositions(body, token) {
  return [...String(body).matchAll(new RegExp(`^${escaped(token)}\\r?$`, 'gm'))].map(
    (match) => match.index,
  );
}

export function sectionBody(body, heading, nextHeadings = []) {
  const start = linePositions(body, heading)[0];
  if (start === undefined) return '';
  const contentStart = start + heading.length;
  const ends = nextHeadings.flatMap((token) => linePositions(body, token));
  ends.push(...[...body.matchAll(/^<!-- marjorie-build:/gm)].map((match) => match.index));
  const later = ends.filter((index) => index > contentStart);
  const end = later.length ? Math.min(...later) : body.length;
  return body.slice(contentStart, end).trim();
}
