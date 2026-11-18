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
  'bostonglobe.com': 'The Boston Globe',
  'wbur.org': 'WBUR',
  'stereogum.com': 'Stereogum',
  'wwd.com': 'WWD',
  'tennessean.com': 'The Tennessean',
  'pollstar.com': 'Pollstar',
  'graziamagazine.com': 'Grazia',
  'gofugyourself.com': 'Go Fug Yourself',
  'instyle.com': 'InStyle',
  'harpersbazaar.com': "Harper's Bazaar",
  'thezoereport.com': 'The Zoe Report',
  'nbcnewyork.com': 'NBC New York',
  'iheart.com': 'iHeartRadio',
  'news.google.com': 'Google News',
  'ew.com': 'Entertainment Weekly',
  'pagesix.com': 'Page Six',
  'glamour.com': 'Glamour',
  'teenvogue.com': 'Teen Vogue',
  'harpersbazaar.co.uk': "Harper's Bazaar",
  'nme.com': 'NME',
  'pitchfork.com': 'Pitchfork',
  'consequence.net': 'Consequence',
  'vulture.com': 'Vulture',
  'forbes.com': 'Forbes',
  'time.com': 'TIME',
  'newsweek.com': 'Newsweek',
  'washingtonpost.com': 'The Washington Post',
  'latimes.com': 'Los Angeles Times',
  'wsj.com': 'The Wall Street Journal',
  'abcnews.go.com': 'ABC News',
  'cbsnews.com': 'CBS News',
  'today.com': 'TODAY',
  'hellomagazine.com': 'HELLO!',
  'independent.co.uk': 'The Independent',
  'dailymail.co.uk': 'Daily Mail',
  'mirror.co.uk': 'The Mirror',
  'thesun.co.uk': 'The Sun',
  'buzzfeed.com': 'BuzzFeed',
  'huffpost.com': 'HuffPost',
  'espn.com': 'ESPN',
  'nfl.com': 'NFL',
  'kansascity.com': 'The Kansas City Star',
  'instagram.com': 'Instagram',
  'x.com': 'X',
  'twitter.com': 'X',
  'tiktok.com': 'TikTok',
  'reddit.com': 'Reddit',
  'facebook.com': 'Facebook',
};

/** Exact host first, then each parent domain, so `news.pollstar.com` and a
 * station subdomain on `iheart.com` resolve to their outlet. */
function knownLabel(host: string): string | undefined {
  const parts = host.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const known = KNOWN_HOSTS[parts.slice(i).join('.')];
    if (known) return known;
  }
  return undefined;
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
 *   checks KNOWN_HOSTS (and its parent domains), falls back to the bare host.
 * - Never returns "". Unparseable URL -> "Source".
 */
export function outletLabel(source: { name?: string | null; url: string }): string {
  const trimmedName = source.name?.trim();
  if (trimmedName) return trimmedName;

  let host: string;
  try {
    host = new URL(source.url).hostname.toLowerCase();
  } catch {
    return 'Source';
  }

  const regHost = registrableHost(host);
  return knownLabel(regHost) ?? (regHost || 'Source');
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