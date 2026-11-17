// W2a: outletLabel + dedupeSourcesByOutlet. The live source rows written at
// write-knowledge.ts:226 carry `name: ""` when outletName is empty, so the
// UI renders a bare ExternalLink icon with no words. This helper derives a
// readable label from the URL host so both the UI (display) and the worker
// (write-time) can fill in a real outlet name for new rows.

const KNOWN_HOSTS: Record<string, string> = {
  'people.com': 'People',
  'tmz.com': 'TMZ',
  'npr.org': 'NPR',
  'vogue.com': 'Vogue',
  'reuters.com': 'Reuters',
  'yahoo.com': 'Yahoo',
  'billboard.com': 'Billboard',
  'theankler.com': 'The Ankler',
  'eonline.com': 'E! News',
  'rollingstone.com': 'Rolling Stone',
  'variety.com': 'Variety',
  'nypost.com': 'New York Post',
  'usmagazine.com': 'Us Weekly',
  'etonline.com': 'ET',
  'cosmopolitan.com': 'Cosmopolitan',
  'elle.com': 'ELLE',
  'si.com': 'Sports Illustrated',
  'nbcnews.com': 'NBC News',
  'cnn.com': 'CNN',
  'bbc.com': 'BBC',
  'bbc.co.uk': 'BBC',
  'nytimes.com': 'The New York Times',
  'theguardian.com': 'The Guardian',
  'apnews.com': 'AP News',
  'usatoday.com': 'USA Today',
  'hollywoodreporter.com': 'The Hollywood Reporter',
  'deadline.com': 'Deadline',
  'thewrap.com': 'TheWrap',
  'cinemablend.com': 'CinemaBlend',
  'complex.com': 'Complex',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'taylorswift.com': 'taylorswift.com',
};

function titleCase(s: string): string {
  return s
    .replace(/(^|[a-z])([A-Z])/g, '$1 $2')
    .replace(/[-._]+/g, ' ')
    .trim()
    .split(' ')
    .map(w => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Strip subdomain prefixes (www., m., amp.) and return the registrable host
 * portion used for the KNOWN_HOSTS lookup.
 */
function registrableHost(hostname: string): string {
  // Remove www., m., amp. prefixes
  let host = hostname;
  for (const prefix of ['www.', 'm.', 'amp.']) {
    if (host.startsWith(prefix)) {
      host = host.slice(prefix.length);
      break;
    }
  }
  return host;
}

/**
 * Derive a human-readable outlet label from a source.
 * - If `name` is non-empty after trim, returns it.
 * - Otherwise derives from the URL host: strips www./m./amp. prefixes,
 *   checks KNOWN_HOSTS, falls back to title-cased registrable name.
 * - Never returns "". Unparseable URL -> "Source".
 */
export function outletLabel(source: { name?: string; url: string }): string {
  const trimmedName = source.name?.trim();
  if (trimmedName) return trimmedName;

  let host: string;
  try {
    host = new URL(source.url).hostname;
  } catch {
    return 'Source';
  }

  const regHost = registrableHost(host);
  const known = KNOWN_HOSTS[regHost];
  if (known) return known;

  // Fall back to title-cased host, stripping the TLD for readability
  const withoutTld = regHost.replace(/\.[^.]+$/, '');
  const label = titleCase(withoutTld);
  return label || 'Source';
}

/**
 * Deduplicate a list of sources by outletLabel (case-insensitive), keeping
 * the first occurrence per outlet and preserving original order.
 */
export function dedupeSourcesByOutlet<T extends { name?: string; url: string }>(
  sources: readonly T[],
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const s of sources) {
    const label = outletLabel(s).toLowerCase();
    if (!seen.has(label)) {
      seen.add(label);
      result.push(s);
    }
  }
  return result;
}