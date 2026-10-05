// Which image URLs the offline art cache wants from a loaded content bundle (pure; see art-cache.ts).

/** The absolute first-party URL, or null (third-party, protocol-relative, not a string). */
function firstParty(url: unknown, origin: string): string | null {
  if (typeof url !== 'string' || !url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return `${origin}${url}`;
  return url.startsWith(`${origin}/`) ? url : null;
}

/** True for an absolute https URL that is not on the first-party origin (http would be blocked by iOS ATS anyway). */
export function isThirdParty(url: unknown, origin: string): url is string {
  return typeof url === 'string' && url.startsWith('https://') && !url.startsWith(`${origin}/`);
}

export interface CollectOpts {
  /** Only this era's primary images (`content:<era>`); omitted = covers + every era's first-party primaries (the base set). */
  eraId?: string;
  /** Also take third-party primary images (https only). */
  includeThirdParty?: boolean;
}

/** Era covers + primary moment images of a loaded bundle (`files` is manifest key -> validated content). */
export function collectArtUrls(files: Record<string, unknown>, origin: string, opts: CollectOpts = {}): string[] {
  const out = new Set<string>();
  const add = (u: unknown) => {
    const abs = firstParty(u, origin) ?? (opts.includeThirdParty && isThirdParty(u, origin) ? u : null);
    if (abs) out.add(abs);
  };
  if (opts.eraId === undefined) {
    const eras = files.eras;
    if (Array.isArray(eras)) for (const e of eras) add((e as { image?: unknown } | null)?.image);
  }
  for (const [key, file] of Object.entries(files)) {
    if (!key.startsWith('content:') || (opts.eraId !== undefined && key !== `content:${opts.eraId}`)) continue;
    const items = (file as { items?: unknown } | null)?.items;
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      const images = (it as { images?: unknown } | null)?.images;
      if (!Array.isArray(images)) continue;
      for (const im of images as Array<{ kind?: unknown; url?: unknown } | null>) if (im?.kind === 'primary') add(im.url);
    }
  }
  return [...out];
}
