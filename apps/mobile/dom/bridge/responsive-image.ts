// Mirrors next/image's srcset generation (defaults: deviceSizes/imageSizes, q=75) against the
// site's own optimizer (`/_next/image`), so the app fetches the same cached variants the web does.
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const IMAGE_SIZES = [32, 48, 64, 96, 128, 256, 384];
const ALL_SIZES = [...IMAGE_SIZES, ...DEVICE_SIZES].sort((a, b) => a - b);
const QUALITY = 75;
const OPTIMIZABLE = /\.(png|jpe?g|webp|avif)$/i;

export interface ResponsiveInput {
  src: string;
  origin: string;
  width?: number;
  fill?: boolean;
  sizes?: string;
  unoptimized?: boolean;
}

export interface ResponsiveAttrs {
  src: string;
  srcSet: string;
  sizes?: string;
}

function widthsFor({ width, fill, sizes }: ResponsiveInput): { widths: number[]; kind: 'w' | 'x' } {
  if (sizes) {
    const ratios: number[] = [];
    for (const m of sizes.matchAll(/(^|\s)(1?\d?\d)vw/g)) ratios.push(parseInt(m[2]!, 10));
    if (ratios.length) {
      const min = Math.min(...ratios) * 0.01;
      return { widths: ALL_SIZES.filter((s) => s >= DEVICE_SIZES[0]! * min), kind: 'w' };
    }
    return { widths: ALL_SIZES, kind: 'w' };
  }
  if (typeof width !== 'number' || fill) return { widths: DEVICE_SIZES, kind: 'w' };
  const nearest = (w: number) => ALL_SIZES.find((s) => s >= w) ?? ALL_SIZES[ALL_SIZES.length - 1]!;
  return { widths: [...new Set([width, width * 2].map(nearest))], kind: 'x' };
}

/** The site-relative path to optimize, or null (svg/gif/third-party/already-optimized => leave the src alone). */
function sitePath(src: string, origin: string): string | null {
  const path = src.startsWith(`${origin}/`) ? src.slice(origin.length) : src;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('?')) return null;
  return OPTIMIZABLE.test(path) ? path : null;
}

export function responsiveAttrs(input: ResponsiveInput): ResponsiveAttrs | null {
  if (input.unoptimized) return null;
  const path = sitePath(input.src, input.origin);
  if (!path) return null;
  const { widths, kind } = widthsFor(input);
  if (widths.length === 0) return null;
  const url = (w: number) => `${input.origin}/_next/image?url=${encodeURIComponent(path)}&w=${w}&q=${QUALITY}`;
  return {
    src: url(widths[widths.length - 1]!),
    srcSet: widths.map((w, i) => `${url(w)} ${kind === 'w' ? w : i + 1}${kind}`).join(', '),
    sizes: kind === 'w' ? (input.sizes ?? '100vw') : undefined,
  };
}
