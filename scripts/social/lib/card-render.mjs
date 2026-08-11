// Renders a designed Long Live social card to a PNG buffer, in the same
// visual language as apps/web/app/opengraph-image.tsx (dark warm background,
// gold/era-accent eyebrow, big serif headline) but built for feed posts
// (portrait/square) rather than a single link-preview size, with three
// layouts so the library doesn't read as one template stamped repeatedly.
//
// No JSX here on purpose: this runs as a plain .mjs CLI (see render-card.mjs)
// without a bundler, so element trees are built with `h()`, matching
// satori's documented "React-elements-like object" input format (README:
// "Use without JSX" — pass {type, props: {children, style}} directly).
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { loadFonts } from './fonts.mjs';
import { ICONS } from './icons.mjs';

export const SIZES = {
  portrait: { width: 1080, height: 1350 }, // IG feed 4:5 — the default; most real estate for a hook.
  square: { width: 1080, height: 1080 }, // IG feed 1:1.
};

function h(type, props = {}, children) {
  return { type, props: { ...props, children } };
}

/** Headline shrinks as it gets longer so a long hook never overflows the card. */
function headlineFontSize(text, width) {
  const scale = width / 1080;
  const len = text.length;
  const base = len <= 16 ? 108 : len <= 26 ? 88 : len <= 40 ? 70 : len <= 60 ? 56 : 46;
  return Math.round(base * scale);
}

function quoteFontSize(text, width) {
  const scale = width / 1080;
  const len = text.length;
  const base = len <= 40 ? 76 : len <= 80 ? 60 : len <= 130 ? 48 : 38;
  return Math.round(base * scale);
}

function Wordmark({ palette, width, dark }) {
  const scale = width / 1080;
  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: Math.round(40 * scale),
        paddingTop: Math.round(22 * scale),
        borderTop: `${Math.max(1, Math.round(scale))}px solid ${dark ? 'rgba(255,255,255,0.28)' : palette.line}`,
      },
    },
    [
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: Math.round(24 * scale),
            letterSpacing: 1,
            color: dark ? 'rgba(255,255,255,0.82)' : palette.inkSoft,
          },
        },
        'longlivets.com',
      ),
      palette.name
        ? h(
            'div',
            {
              style: {
                display: 'flex',
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: Math.round(20 * scale),
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: dark ? palette.accent : palette.accent2,
              },
            },
            palette.name,
          )
        : null,
    ].filter(Boolean),
  );
}

function Eyebrow({ text, color, width }) {
  const scale = width / 1080;
  return h(
    'div',
    {
      style: {
        display: 'flex',
        fontFamily: 'Inter',
        fontWeight: 700,
        fontSize: Math.round(26 * scale),
        letterSpacing: 5,
        textTransform: 'uppercase',
        color,
      },
    },
    text,
  );
}

/**
 * Oversized, low-opacity lucide glyph bled off the corner — fills the
 * negative space a bottom-anchored card leaves up top with a motif tied to
 * the app's own nav icons (Eras=compass, Threads=layers, Mood=sparkles)
 * rather than a generic decorative shape.
 */
function WatermarkIcon({ icon, width, color, opacity = 0.16, rotate = -8 }) {
  const nodes = ICONS[icon];
  if (!nodes) return null;
  const size = width * 0.82;
  return h(
    'div',
    {
      style: {
        display: 'flex',
        position: 'absolute',
        width: size,
        height: size,
        top: -size * 0.22,
        right: -size * 0.22,
        opacity,
        transform: `rotate(${rotate}deg)`,
      },
    },
    h(
      'svg',
      {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: color,
        strokeWidth: 0.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      nodes.map(({ type, ...attrs }) => h(type, attrs)),
    ),
  );
}

function Rule({ color, width }) {
  const scale = width / 1080;
  return h('div', {
    style: {
      display: 'flex',
      width: Math.round(64 * scale),
      height: Math.round(6 * scale),
      borderRadius: Math.round(3 * scale),
      background: color,
      marginBottom: Math.round(20 * scale),
    },
  });
}

/**
 * Text-only card: bottom-anchored asymmetric layout (deliberately not
 * centered — a centered block on a flat color is the generic-template look
 * this exists to avoid). A soft radial glow in the era accent gives it
 * depth without relying on CSS filters/blur, which satori doesn't support.
 */
function textCard({ palette, width, height, eyebrow, headline, kicker, icon }) {
  const scale = width / 1080;
  return h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width,
        height,
        background: palette.bg,
        position: 'relative',
        overflow: 'hidden',
      },
    },
    [
      icon ? WatermarkIcon({ icon, width, color: palette.accent }) : null,
      // Decorative glow blobs — radial-gradient fades stand in for blur.
      h('div', {
        style: {
          display: 'flex',
          position: 'absolute',
          width: width * 0.9,
          height: width * 0.9,
          borderRadius: '50%',
          top: -width * 0.35,
          right: -width * 0.3,
          backgroundImage: `radial-gradient(circle, ${palette.glow} 0%, rgba(0,0,0,0) 70%)`,
        },
      }),
      h('div', {
        style: {
          display: 'flex',
          position: 'absolute',
          width: width * 0.7,
          height: width * 0.7,
          borderRadius: '50%',
          bottom: -width * 0.28,
          left: -width * 0.22,
          backgroundImage: `radial-gradient(circle, ${palette.surface2} 0%, rgba(0,0,0,0) 72%)`,
        },
      }),
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            flex: 1,
            padding: Math.round(84 * scale),
            position: 'relative',
          },
        },
        [
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', maxWidth: '92%' } },
            [
              Rule({ color: palette.accent, width }),
              Eyebrow({ text: eyebrow, color: palette.accent, width }),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontFamily: 'Playfair Display',
                    fontWeight: 900,
                    fontSize: headlineFontSize(headline, width),
                    lineHeight: 1.04,
                    letterSpacing: -1,
                    color: palette.ink,
                    marginTop: Math.round(18 * scale),
                  },
                },
                headline,
              ),
              kicker
                ? h(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: Math.round(32 * scale),
                        lineHeight: 1.3,
                        color: palette.inkSoft,
                        marginTop: Math.round(20 * scale),
                        maxWidth: '95%',
                      },
                    },
                    kicker,
                  )
                : null,
            ].filter(Boolean),
          ),
          Wordmark({ palette, width, dark: false }),
        ],
      ),
    ].filter(Boolean),
  );
}

/** Photo-background card: full-bleed image, bottom scrim, same content block
 * as the text card but always rendered light-on-dark since the scrim forces
 * a dark bottom regardless of era palette. */
function photoCard({ palette, width, height, eyebrow, headline, kicker, photoDataUri, credit }) {
  const scale = width / 1080;
  return h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width,
        height,
        background: palette.bg,
        position: 'relative',
        overflow: 'hidden',
      },
    },
    [
      h('img', {
        src: photoDataUri,
        width,
        height,
        style: { position: 'absolute', top: 0, left: 0, width, height, objectFit: 'cover' },
      }),
      // Full-height tint keeps the era's own color in the shadows instead of
      // a flat black scrim, then a stronger gradient near the bottom for
      // text legibility.
      h('div', {
        style: {
          display: 'flex',
          position: 'absolute',
          inset: 0,
          width,
          height,
          backgroundImage: `linear-gradient(180deg, ${hexToRgba(palette.bg, 0.15)} 0%, ${hexToRgba(palette.bg, 0.05)} 38%, ${hexToRgba(palette.bg, 0.55)} 62%, ${hexToRgba(palette.bg, 0.97)} 100%)`,
        },
      }),
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            flex: 1,
            padding: Math.round(84 * scale),
            position: 'relative',
          },
        },
        [
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', maxWidth: '94%' } },
            [
              Rule({ color: palette.accent, width }),
              Eyebrow({ text: eyebrow, color: palette.accent, width }),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontFamily: 'Playfair Display',
                    fontWeight: 900,
                    fontSize: headlineFontSize(headline, width),
                    lineHeight: 1.04,
                    letterSpacing: -1,
                    color: '#ffffff',
                    marginTop: Math.round(18 * scale),
                  },
                },
                headline,
              ),
              kicker
                ? h(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: Math.round(32 * scale),
                        lineHeight: 1.3,
                        color: 'rgba(255,255,255,0.82)',
                        marginTop: Math.round(20 * scale),
                        maxWidth: '95%',
                      },
                    },
                    kicker,
                  )
                : null,
            ].filter(Boolean),
          ),
          Wordmark({ palette, width, dark: true }),
          credit
            ? h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: Math.round(16 * scale),
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: Math.round(10 * scale),
                  },
                },
                credit,
              )
            : null,
        ].filter(Boolean),
      ),
    ],
  );
}

/**
 * Single big stat column: a giant Playfair numeral over a tracked uppercase
 * label. Two of these side by side (with a divider) is how the fashion card
 * shows "12 eras / 12 looks" as one payload instead of two competing lines.
 */
function StatColumn({ palette, value, label, fontSize, labelSize }) {
  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
    [
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontFamily: 'Playfair Display',
            fontWeight: 900,
            fontSize,
            lineHeight: 1,
            color: palette.accent,
          },
        },
        value,
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: labelSize,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: palette.ink,
            marginTop: Math.round(labelSize * 0.4),
          },
        },
        label,
      ),
    ],
  );
}

/**
 * The proof-element centerpiece for the `thread` variant: one concrete,
 * real-data stat (or a pair of them) inside a bordered panel, with an
 * optional sentence-case detail line underneath spelling out the rest of
 * the number (e.g. how many are *confirmed*, not just planted). This is the
 * "would a scroller know what this is" payload the old bottom-anchored
 * text card didn't have room for.
 */
function StatPanel({ palette, width, stat, stat2, detail }) {
  const scale = width / 1080;
  const bigSize = Math.round((stat2 ? 168 : 264) * scale);
  const labelSize = Math.round(28 * scale);
  const detailSize = Math.round(27 * scale);
  return h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        padding: `${Math.round(68 * scale)}px ${Math.round(72 * scale)}px`,
        borderRadius: Math.round(28 * scale),
        border: `${Math.max(1, Math.round(scale))}px solid ${hexToRgba(palette.accent, 0.4)}`,
        background: hexToRgba(palette.surface2, 0.55),
      },
    },
    [
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: stat2 ? Math.round(56 * scale) : 0,
          },
        },
        stat2
          ? [
              StatColumn({ palette, ...stat, fontSize: bigSize, labelSize }),
              h('div', {
                style: {
                  display: 'flex',
                  width: Math.max(1, Math.round(scale)),
                  height: bigSize * 0.7,
                  background: hexToRgba(palette.accent, 0.35),
                },
              }),
              StatColumn({ palette, ...stat2, fontSize: bigSize, labelSize }),
            ]
          : [StatColumn({ palette, ...stat, fontSize: bigSize, labelSize })],
      ),
      detail
        ? h(
            'div',
            {
              style: {
                display: 'flex',
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: detailSize,
                letterSpacing: 0.5,
                textAlign: 'center',
                color: palette.inkSoft,
                marginTop: Math.round(28 * scale),
                maxWidth: Math.round(width * 0.62),
              },
            },
            detail,
          )
        : null,
    ].filter(Boolean),
  );
}

/**
 * Thread intro card: fixes the WS2 design-review fail on the original
 * bottom-anchored `text` layout (~70% empty canvas, all copy crammed small
 * in the bottom quarter, a meaningless era tag in the corner). The thread
 * name now runs large in the top third, a real-data proof stat is the
 * centerpiece (not a decorative glyph), and there's no era tag — a thread
 * spans eras, so tagging it with one was arbitrary. Still shares the
 * brand skeleton (eyebrow, serif headline, wordmark) with the other
 * variants.
 */
function threadCard({ palette, width, height, eyebrow, headline, kicker, stat, stat2, detail, icon }) {
  const scale = width / 1080;
  return h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width,
        height,
        background: palette.bg,
        position: 'relative',
        overflow: 'hidden',
      },
    },
    [
      icon ? WatermarkIcon({ icon, width, color: palette.accent, opacity: 0.08, rotate: 12 }) : null,
      // Glow centered behind the stat panel (not tucked in a corner) so the
      // proof element reads as the card's focal point.
      h('div', {
        style: {
          display: 'flex',
          position: 'absolute',
          width: width * 0.95,
          height: width * 0.95,
          borderRadius: '50%',
          top: height * 0.56 - (width * 0.95) / 2,
          left: width * 0.5 - (width * 0.95) / 2,
          backgroundImage: `radial-gradient(circle, ${palette.glow} 0%, rgba(0,0,0,0) 68%)`,
        },
      }),
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            padding: `${Math.round(72 * scale)}px ${Math.round(84 * scale)}px 0`,
            position: 'relative',
          },
        },
        [
          Rule({ color: palette.accent, width }),
          Eyebrow({ text: eyebrow, color: palette.accent, width }),
          h(
            'div',
            {
              style: {
                display: 'flex',
                fontFamily: 'Playfair Display',
                fontWeight: 900,
                fontSize: headlineFontSize(headline, width),
                lineHeight: 1.02,
                letterSpacing: -1,
                color: palette.ink,
                marginTop: Math.round(16 * scale),
              },
            },
            headline,
          ),
          kicker
            ? h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: Math.round(30 * scale),
                    lineHeight: 1.3,
                    color: palette.inkSoft,
                    marginTop: Math.round(14 * scale),
                    maxWidth: '92%',
                  },
                },
                kicker,
              )
            : null,
        ].filter(Boolean),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: `0 ${Math.round(56 * scale)}px`,
          },
        },
        StatPanel({ palette, width, stat, stat2, detail }),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            padding: `0 ${Math.round(84 * scale)}px ${Math.round(64 * scale)}px`,
            position: 'relative',
          },
        },
        // name: null strips the era tag the design review flagged — a thread
        // runs across every era, so pinning it to one was arbitrary.
        Wordmark({ palette: { ...palette, name: null }, width, dark: false }),
      ),
    ].filter(Boolean),
  );
}

function QuoteGlyph({ palette, width }) {
  const scale = width / 1080;
  return h(
    'div',
    {
      style: {
        display: 'flex',
        fontFamily: 'Playfair Display',
        fontWeight: 900,
        fontSize: Math.round(340 * scale),
        lineHeight: 0.6,
        color: palette.accent,
        opacity: 0.35,
        marginBottom: Math.round(-24 * scale),
      },
    },
    '“',
  );
}

/** Quote card: centered composition (the one variant that IS centered — the
 * asymmetric text/photo cards plus this centered one keep the library from
 * reading as a single stamped template). Oversized quote glyph anchors it. */
function quoteCard({ palette, width, height, eyebrow, headline, kicker }) {
  const scale = width / 1080;
  return h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height,
        background: palette.bg,
        padding: Math.round(96 * scale),
        position: 'relative',
      },
    },
    [
      h('div', {
        style: {
          display: 'flex',
          position: 'absolute',
          width: width * 0.85,
          height: width * 0.85,
          borderRadius: '50%',
          top: height * 0.5 - (width * 0.85) / 2,
          left: width * 0.5 - (width * 0.85) / 2,
          backgroundImage: `radial-gradient(circle, ${palette.glow} 0%, rgba(0,0,0,0) 68%)`,
        },
      }),
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            maxWidth: '88%',
          },
        },
        [
          QuoteGlyph({ palette, width }),
          eyebrow ? Eyebrow({ text: eyebrow, color: palette.accent, width }) : null,
          h(
            'div',
            {
              style: {
                display: 'flex',
                fontFamily: 'Playfair Display',
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: quoteFontSize(headline, width),
                lineHeight: 1.18,
                textAlign: 'center',
                color: palette.ink,
                marginTop: eyebrow ? Math.round(28 * scale) : 0,
              },
            },
            `"${headline}"`,
          ),
          kicker
            ? h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: Math.round(28 * scale),
                    letterSpacing: 1,
                    color: palette.accent2,
                    marginTop: Math.round(32 * scale),
                  },
                },
                `— ${kicker}`,
              )
            : null,
          h(
            'div',
            {
              style: {
                display: 'flex',
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: Math.round(22 * scale),
                letterSpacing: 1,
                color: palette.inkSoft,
                marginTop: Math.round(48 * scale),
              },
            },
            'longlivets.com',
          ),
        ].filter(Boolean),
      ),
    ],
  );
}

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(0,0,0,${alpha})`;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * @param {object} opts
 * @param {'text'|'photo'|'quote'|'thread'} opts.variant
 * @param {object} opts.palette from era-palette.mjs's eraPalette()
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {string} [opts.eyebrow]
 * @param {string} opts.headline
 * @param {string} [opts.kicker]
 * @param {string} [opts.photoDataUri] required for variant 'photo'
 * @param {string} [opts.credit]
 * @param {'sparkles'|'layers'|'compass'} [opts.icon] oversized watermark glyph (variant 'text'/'thread' only)
 * @param {{value:string,label:string}} [opts.stat] required for variant 'thread' — the real-data proof number
 * @param {{value:string,label:string}} [opts.stat2] optional second stat, variant 'thread' (renders as a two-up pair)
 * @param {string} [opts.detail] variant 'thread' only — sentence-case line under the stat panel
 * @returns {Promise<Buffer>} PNG bytes
 */
export async function renderCardPng(opts) {
  const {
    variant,
    palette,
    width,
    height,
    eyebrow = '',
    headline,
    kicker,
    photoDataUri,
    credit,
    icon,
    stat,
    stat2,
    detail,
  } = opts;
  if (!headline) throw new Error('headline is required');
  let tree;
  if (variant === 'photo') {
    if (!photoDataUri) throw new Error('variant "photo" requires photoDataUri');
    tree = photoCard({ palette, width, height, eyebrow, headline, kicker, photoDataUri, credit });
  } else if (variant === 'quote') {
    tree = quoteCard({ palette, width, height, eyebrow, headline, kicker });
  } else if (variant === 'text') {
    tree = textCard({ palette, width, height, eyebrow, headline, kicker, icon });
  } else if (variant === 'thread') {
    if (!stat) throw new Error('variant "thread" requires stat: {value, label}');
    tree = threadCard({ palette, width, height, eyebrow, headline, kicker, stat, stat2, detail, icon });
  } else {
    throw new Error(`Unknown variant "${variant}". Expected "text", "photo", "quote", or "thread".`);
  }

  const svg = await satori(tree, { width, height, fonts: loadFonts() });
  const resvg = new Resvg(svg, { font: { loadSystemFonts: false } });
  const rendered = resvg.render();
  // resvg's default PNG encoder is fast but doesn't compress hard; re-encoding
  // losslessly through sharp at max effort routinely cuts photo-card output
  // 3-4x with zero quality difference (measured: a 1080x1350 photo card went
  // 1.5MB -> 388KB), which is what keeps these under the ~1.5MB library
  // budget without giving up PNG (Instagram's publish API is fine with it —
  // apps/web/public/eras/*.png already ships PNG in production).
  return sharp(rendered.asPng()).png({ compressionLevel: 9, effort: 10 }).toBuffer();
}
