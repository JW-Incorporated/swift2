import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CURRENT_ERA_NOW_GRAIN_MS,
  RAIL_PCT_DECIMALS,
  SCRUBBER_ANCHOR_CLASS,
  SCRUBBER_BASE_PT,
  SCRUBBER_CENTER_MEDIA_QUERY,
  SCRUBBER_RAIL_CLASS,
  SCRUBBER_SCRIM_CLASS,
  SCRUBBER_SHELL_CLASS,
  roundRailPct,
  scrubberAnchorPaddingTop,
  scrubberPillTransform,
  scrubberTooltipTransform,
  snapNow,
  nearestAnchorExact,
  labelForDate,
  UNKNOWN_DATE_LABEL,
  type ScrubberAnchor,
} from './timelineScrubberLayout';

describe('TimelineScrubber layout', () => {
  // Regression for the mobile rail drift: centering the rail inside an
  // `inset-y-0` box tracks the dynamic viewport, which resizes when the
  // mobile URL bar collapses/expands on scroll, so the rail slid down and
  // up with every scroll direction change. What carries the fix: the rail
  // is centered inside an ANCHOR that is top-anchored with a
  // small-viewport height (h-svh — constant regardless of browser
  // chrome), and the rail uses the same stable unit (svh, never plain
  // vh).
  it('anchors the rail to the small viewport so the URL bar cannot move it', () => {
    expect(SCRUBBER_ANCHOR_CLASS).toContain('top-0');
    expect(SCRUBBER_ANCHOR_CLASS).toContain('h-svh');
    expect(SCRUBBER_ANCHOR_CLASS).not.toContain('inset-y-0');
    expect(SCRUBBER_ANCHOR_CLASS).not.toContain('bottom-0');

    expect(SCRUBBER_RAIL_CLASS).toContain('svh');
    expect(SCRUBBER_RAIL_CLASS).not.toMatch(/\d+vh/); // svh only — no dynamic-viewport vh
  });

  // Joey follow-up to #2077: the rail must sit just below the TopBar by
  // default, not float centered. pt-20 (80px) clears the real rendered
  // TopBar height (65px: h-10 icon buttons + py-3 + border-b) plus the
  // era year label that reaches 9px above the rail's top. Centering is
  // the exception and needs BOTH dimensions (Codex P1 on #2079): a
  // width-only `sm:` gate re-centered short landscape phones, putting the
  // rail's top inside the TopBar. These are string pins — geometry-level
  // assertions (where the rail actually lands) would need render infra
  // (jsdom + providers) the repo deliberately doesn't have.
  it('top-aligns the rail below the TopBar; centers only when both dimensions fit', () => {
    expect(SCRUBBER_ANCHOR_CLASS).toContain('items-start');
    expect(SCRUBBER_ANCHOR_CLASS).toContain('pt-20');
    expect(SCRUBBER_ANCHOR_CLASS).toContain(
      '[@media_(min-width:640px)_and_(min-height:620px)]:items-center',
    );
    expect(SCRUBBER_ANCHOR_CLASS).toContain(
      '[@media_(min-width:640px)_and_(min-height:620px)]:pt-0',
    );
    // Width-only centering is the bug; make sure it cannot come back.
    expect(SCRUBBER_ANCHOR_CLASS).not.toContain('sm:items-center');
  });

  it('keeps the rail and its endpoint adornments inside short viewports', () => {
    expect(SCRUBBER_RAIL_CLASS).toContain('h-[min(74svh,calc(100svh-6rem))]');
    // The cap must stay unconditional: a width-gated cap (sm:h-[74svh])
    // would exempt exactly the short-landscape viewports that need it.
    expect(SCRUBBER_RAIL_CLASS).not.toContain('sm:h-');

    expect(scrubberPillTransform(0)).toBe('translateY(0)');
    expect(scrubberPillTransform(50)).toBe('translateY(-50%)');
    expect(scrubberPillTransform(100)).toBe('translateY(-100%)');
    expect(scrubberTooltipTransform(0)).toBe('translateY(0)');
    expect(scrubberTooltipTransform(100)).toBe('translateY(-100%)');

    const src = readFileSync(join(__dirname, 'TimelineScrubber.tsx'), 'utf8');
    expect(src).toContain('pillRef.current.style.transform = scrubberPillTransform(pct)');
  });

  // The opposite requirement for the legibility scrim (Codex P2 on #2077):
  // it must cover the FULL visible viewport, including the strip below
  // 100svh that appears while the URL bar is collapsed. So the SHELL
  // tracks the dynamic viewport (inset-y-0) and the scrim spans it —
  // never the svh anchor.
  it('lets the scrim cover the full dynamic viewport via the shell', () => {
    expect(SCRUBBER_SHELL_CLASS).toContain('fixed');
    expect(SCRUBBER_SHELL_CLASS).toContain('inset-y-0');
    expect(SCRUBBER_SCRIM_CLASS).toContain('inset-y-0');
    expect(SCRUBBER_SCRIM_CLASS).toContain('w-full');
  });

  // Constants alone cannot fail if the component stops using them. The
  // repo has no component-render setup (node test env, no jsdom or
  // testing-library, and the store needs providers), so pin the wiring
  // statically: each constant must appear as a className binding in the
  // component source, nested in the intended order, with no literal
  // vh/inset-y classes reintroduced alongside them.
  it('is actually wired into TimelineScrubber in shell > anchor > rail order', () => {
    const src = readFileSync(join(__dirname, 'TimelineScrubber.tsx'), 'utf8');

    const shellAt = src.indexOf('className={SCRUBBER_SHELL_CLASS}');
    const scrimAt = src.indexOf('className={SCRUBBER_SCRIM_CLASS}');
    const anchorAt = src.indexOf('className={SCRUBBER_ANCHOR_CLASS}');
    const railAt = src.indexOf('className={SCRUBBER_RAIL_CLASS}');

    expect(shellAt).toBeGreaterThan(-1);
    expect(scrimAt).toBeGreaterThan(shellAt);
    expect(anchorAt).toBeGreaterThan(scrimAt);
    expect(railAt).toBeGreaterThan(anchorAt);

    // No drifting unit smuggled back in as a literal class: the only vh-ish
    // sizing in the component must come from the pinned constants.
    expect(src).not.toMatch(/className="[^"]*\d+vh/);
    expect(src).not.toMatch(/className="[^"]*h-svh/); // svh sizing lives in the constants
  });
});

// Adversarial review finding #2 (2026-08-14): the last filter chip
// ("Videos") was unreachable because the rail's `pt-20` only ever accounted
// for TopBar, never FilterBar — on mobile the rail's clickable band (and its
// always-visible date pill) silently overlapped the filter row, so every tap
// on the last chip landed on the rail/pill and scrubbed the page instead.
describe('scrubberAnchorPaddingTop (finding #2, 2026-08-14)', () => {
  it('THE BUG, for contrast: pt-20 alone (80px) is shorter than TopBar + FilterBar', () => {
    const topBarHeight = 65;
    const filterBarHeight = 49; // measured, one-row chip layout
    expect(topBarHeight + filterBarHeight).toBeGreaterThan(SCRUBBER_BASE_PT);
  });

  it('clamps the rail below the live chrome when it exceeds the base pt-20', () => {
    expect(scrubberAnchorPaddingTop({ chromeHeight: 114, isCentered: false })).toBe(114);
  });

  it('defers to the CSS class when the live chrome fits inside pt-20', () => {
    expect(scrubberAnchorPaddingTop({ chromeHeight: 65, isCentered: false })).toBeUndefined();
    expect(scrubberAnchorPaddingTop({ chromeHeight: SCRUBBER_BASE_PT, isCentered: false })).toBeUndefined();
  });

  it('never clamps in centered mode — items-center governs position there, not padding', () => {
    expect(scrubberAnchorPaddingTop({ chromeHeight: 178, isCentered: true })).toBeUndefined();
  });

  it('is wired into TimelineScrubber via the same media query as SCRUBBER_ANCHOR_CLASS', () => {
    const src = readFileSync(join(__dirname, 'TimelineScrubber.tsx'), 'utf8');
    expect(src).toContain('window.matchMedia(SCRUBBER_CENTER_MEDIA_QUERY)');
    expect(src).toContain('scrubberAnchorPaddingTop({');
    expect(src).toContain('anchorPaddingTop != null ? { paddingTop: anchorPaddingTop } : undefined');
    // The media query string itself must actually match the class's own
    // breakpoint text, so the two conditions can never silently diverge.
    expect(SCRUBBER_ANCHOR_CLASS).toContain('min-width:640px');
    expect(SCRUBBER_ANCHOR_CLASS).toContain('min-height:620px');
    expect(SCRUBBER_CENTER_MEDIA_QUERY).toBe('(min-width: 640px) and (min-height: 620px)');
  });
});

// Adversarial review finding #3 (2026-08-14): a fresh load threw two
// hydration errors — TimelineScrubber's milestone-dot inline `top` style
// disagreed between server and client (`"1.14252%"` vs.
// `"1.1425251289221632%"`) because the current era's percentage is derived
// from `Date.now()`, evaluated microseconds apart by the SSR pass and the
// hydration pass. roundRailPct is the deterministic fix, applied at
// pctForDate — the single place every rendered rail percentage is produced.
describe('snapNow (finding #3, 2026-08-14)', () => {
  it('floors to the grain boundary', () => {
    expect(snapNow(1_000_000, 300_000)).toBe(900_000);
    expect(snapNow(900_000, 300_000)).toBe(900_000);
    expect(snapNow(1_199_999, 300_000)).toBe(900_000);
  });

  it('two calls milliseconds apart (SSR vs. hydration) snap to the same value in the common case', () => {
    const ssrNow = 1_000_000_000;
    const hydrationNow = ssrNow + 400; // realistic SSR->hydration gap
    expect(snapNow(ssrNow)).toBe(snapNow(hydrationNow));
  });

  it('defaults to the 5-minute grain', () => {
    expect(CURRENT_ERA_NOW_GRAIN_MS).toBe(5 * 60_000);
    expect(snapNow(CURRENT_ERA_NOW_GRAIN_MS + 1)).toBe(CURRENT_ERA_NOW_GRAIN_MS);
  });

  it('is wired into TimelineScrubber\'s `end` bound for the current era', () => {
    const src = readFileSync(join(__dirname, 'TimelineScrubber.tsx'), 'utf8');
    expect(src).toContain('Math.min(authoredEnd, snapNow(Date.now()))');
  });
});

describe('roundRailPct (finding #3, 2026-08-14)', () => {
  it('THE BUG, for contrast: two floats a hair apart print very differently at full precision', () => {
    const server = 1.14252;
    const client = 1.1425251289221632;
    expect(server).not.toBe(client);
    expect(`${server}%`).not.toBe(`${client}%`);
  });

  it('rounds two near-identical floats to the same fixed-precision value', () => {
    const server = 1.14252;
    const client = 1.1425251289221632;
    expect(roundRailPct(server)).toBe(roundRailPct(client));
  });

  it('rounds to RAIL_PCT_DECIMALS decimal places', () => {
    expect(RAIL_PCT_DECIMALS).toBe(4);
    expect(roundRailPct(1.1425251289221632)).toBe(1.1425);
    expect(roundRailPct(0)).toBe(0);
    expect(roundRailPct(100)).toBe(100);
  });

  it('is wired into TimelineScrubber at pctForDate, the single place a rail percentage is produced', () => {
    const src = readFileSync(join(__dirname, 'TimelineScrubber.tsx'), 'utf8');
    const pctForDateAt = src.indexOf('const pctForDate = useCallback(');
    const roundAt = src.indexOf('return roundRailPct(raw);');
    expect(pctForDateAt).toBeGreaterThan(-1);
    expect(roundAt).toBeGreaterThan(pctForDateAt);
  });
});

// Adversarial review finding #1 (2026-08-13): resolveAnchor (anchor-date.ts)
// correctly returns `displayDate: null` for a non-exact anchor, but the value
// was still reaching the scrubber's visible pill and `aria-valuetext` via the
// synthetic `sortDate` written into `data-ll-date` — reproduced on Midnights'
// karma-mv, where the card said "Date unknown" but the scrubber announced a
// month the record does not have. Positioning (data-ll-date) is allowed to
// use a synthetic date; only display/announcement is not.
describe('TimelineScrubber never displays or announces a synthetic anchor date', () => {
  it('labelForDate returns the honest fallback whenever exact is false, regardless of the formatted string', () => {
    expect(labelForDate('Apr 2023', false)).toBe(UNKNOWN_DATE_LABEL);
    expect(labelForDate('Jan 1989', false)).toBe(UNKNOWN_DATE_LABEL);
    expect(labelForDate('', false)).toBe(UNKNOWN_DATE_LABEL);
  });

  it('labelForDate passes the formatted string through only when exact is true', () => {
    expect(labelForDate('Apr 2023', true)).toBe('Apr 2023');
  });

  it('nearestAnchorExact defaults to exact when nothing has been measured yet (pre-measure fallback)', () => {
    expect(nearestAnchorExact([], Date.now())).toBe(true);
  });

  it('nearestAnchorExact reports the synthetic anchor as non-exact even when it is nearest', () => {
    // Reproduces the karma-mv shape: one real moment, one undated video whose
    // era-scatter anchor lands nearby. Scrubbing to right on top of the video
    // anchor must resolve to exact=false.
    const anchors: ScrubberAnchor[] = [
      { date: new Date('2023-04-01').getTime(), top: 100, exact: true }, // a real moment
      { date: new Date('2023-04-15').getTime(), top: 300, exact: false }, // karma-mv, era-scatter
    ];
    const karmaMvDate = anchors[1].date;
    expect(nearestAnchorExact(anchors, karmaMvDate)).toBe(false);
    // And the end-to-end honesty rule: whatever the caller formats that date
    // as, it can never reach the pill/aria-valuetext.
    const formatted = new Date(karmaMvDate).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
    expect(labelForDate(formatted, nearestAnchorExact(anchors, karmaMvDate))).toBe(UNKNOWN_DATE_LABEL);
  });

  it('nearestAnchorExact still reports exact for a position nearest a real anchor', () => {
    const anchors: ScrubberAnchor[] = [
      { date: new Date('2023-04-01').getTime(), top: 100, exact: true },
      { date: new Date('2023-04-15').getTime(), top: 300, exact: false },
    ];
    expect(nearestAnchorExact(anchors, anchors[0].date)).toBe(true);
  });

  it('nearestAnchorExact reports non-exact on a tie between a clamped doorway and a same-date exact anchor (debut geometry, re-review finding A)', () => {
    // Real shape: debut's `taylors-version` thread point predates the era,
    // so threadDoorwaysForEra clamps it to the era's own start (2006-10-24)
    // with displayDate: null (via: 'clamped') — sortDate ties exactly with
    // debut's real, exact release-day moment card. The clamp must not win
    // the tie just because it was measured first.
    const debutStart = new Date('2006-10-24').getTime();
    const anchors: ScrubberAnchor[] = [
      { date: debutStart, top: 100, exact: false }, // taylors-version doorway, clamped
      { date: debutStart, top: 140, exact: true }, // debut's real release-day moment
    ];
    expect(nearestAnchorExact(anchors, debutStart)).toBe(false);

    // Order-independent: the exact anchor measured first must not change it.
    const reordered: ScrubberAnchor[] = [anchors[1], anchors[0]];
    expect(nearestAnchorExact(reordered, debutStart)).toBe(false);
  });

  // Adversarial review finding #3, 2026-08-13: the DATE interpolation set
  // (what TimelineScrubber's dateForTop/exactForDate actually search) no
  // longer includes non-exact anchors at all — see TimelineScrubber.tsx's
  // exactAnchorsRef. That, not a change to nearestAnchorExact itself, is
  // what resolves the debut-era-start over-suppression above in practice:
  // once the clamped doorway is filtered out before this function ever sees
  // it, the tie in the test above cannot occur — only the real moment's
  // anchor remains, so it reports exact.
  it('reports exact once the caller excludes non-exact anchors before calling (the finding #3 fix)', () => {
    const debutStart = new Date('2006-10-24').getTime();
    const mixed: ScrubberAnchor[] = [
      { date: debutStart, top: 100, exact: false }, // taylors-version doorway, clamped
      { date: debutStart, top: 140, exact: true }, // debut's real release-day moment
    ];
    const exactOnly = mixed.filter((a) => a.exact);
    expect(nearestAnchorExact(exactOnly, debutStart)).toBe(true);
  });

  // Source-lock: the component's only two display surfaces for a resolved
  // date must route through labelForDate (never format a raw date directly),
  // and measure() must read data-ll-exact off the DOM rather than assuming
  // every anchor is real.
  it('TimelineScrubber routes every displayed/announced date through labelForDate', () => {
    const src = readFileSync(join(__dirname, 'TimelineScrubber.tsx'), 'utf8');
    const uses = src.match(/labelForDate\(fmtMonth\(pillDate\), exactForDate\(pillDate\)\)/g);
    // Once for aria-valuetext, once for the visible pill text — no third,
    // un-gated caller of fmtMonth(pillDate) may exist alongside them.
    expect(uses).toHaveLength(2);
    expect(src.match(/fmtMonth\(pillDate\)/g)).toHaveLength(2);
    expect(src).toContain("exact: el.dataset.llExact !== '0'");
  });
});
