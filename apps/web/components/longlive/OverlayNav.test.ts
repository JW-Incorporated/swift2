import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

describe('#773 track overlays keep the global era navigation visible', () => {
  const nav = read('./OverlayNav.tsx');

  it('keeps the wordmark and responsive current-era label in the top-left group', () => {
    expect(nav).toContain('aria-label="Track overlay navigation"');
    expect(nav).toContain('sticky top-0');
    expect(nav).toContain('Long&nbsp;Live');
    expect(nav).toContain('onClick={goHome}');
    expect(nav).toContain('Era: {era.shortName}');
    expect(nav).toContain('Era: {era.name}');
    expect(nav).toContain('aria-label={`${era.name} — open the eras menu`}');
  });

  it('leaves the track stack before opening the era selector', () => {
    const handler = nav.slice(nav.indexOf('function openEraSelector()'), nav.indexOf('\n  return ('));
    expect(handler.indexOf('closeTrackGuide();')).toBeGreaterThan(-1);
    expect(handler.indexOf('setSelectorOpen(true);')).toBeGreaterThan(
      handler.indexOf('closeTrackGuide();'),
    );
  });

  it('wraps the mode rail below the primary row until the viewport can fit all controls', () => {
    expect(nav).toContain('order-3 flex basis-full justify-center lg:order-2 lg:basis-auto');
    expect(nav).toContain('order-2 ml-auto flex shrink-0 items-center gap-2 lg:order-3 lg:ml-0');
  });

  it('retains the established 44px shared close-button affordance from #525', () => {
    const closeStart = nav.indexOf('aria-label="Close"');
    const closeButton = nav.slice(closeStart, nav.indexOf('</button>', closeStart));
    expect(closeStart).toBeGreaterThan(-1);
    expect(closeButton).toContain(
      'className="era-icon-btn grid size-11 shrink-0 place-items-center rounded-full"',
    );
  });

  for (const file of ['./TrackGuide.tsx', './TrackDetail.tsx']) {
    it(`${file} supplies its active era to the shared navigation`, () => {
      expect(read(file)).toMatch(/<OverlayNav\s+[\s\S]*?era=\{era\}/);
    });
  }
});
