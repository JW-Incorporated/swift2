import { describe, expect, it } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { parseOpenBlockingItems, hoursSince } from './blocking-human-actions-check.mjs';

const SAMPLE = `# Human actions

## OPEN

### 58. Some non-blocking item — ~2 min

**Filed:** 2026-09-10

Body text.

### 56. [BLOCKING] Freeze social posting while the approval gate lands — ~2 min

**Filed:** 2026-09-10

Body text for 56.

### 51. [BLOCKING] URGENT — restore a secret — ~10 min

**Filed:** 2026-09-09

Body text for 51.

## DONE

### 40. [BLOCKING] An old, already-resolved item — ~5 min

**Filed:** 2026-08-01
`;

describe('parseOpenBlockingItems', () => {
  it('finds every [BLOCKING] item in the OPEN section, ignoring non-blocking items', () => {
    const items = parseOpenBlockingItems(SAMPLE);
    expect(items).toEqual([
      { number: '56', title: 'Freeze social posting while the approval gate lands — ~2 min', filed: '2026-09-10' },
      { number: '51', title: 'URGENT — restore a secret — ~10 min', filed: '2026-09-09' },
    ]);
  });

  it('never reads past the OPEN section — a DONE item never appears, however old', () => {
    const items = parseOpenBlockingItems(SAMPLE);
    expect(items.some((i: { number: string }) => i.number === '40')).toBe(false);
  });

  it('returns [] when there is no OPEN section at all', () => {
    expect(parseOpenBlockingItems('# Human actions\n\n## DONE\n')).toEqual([]);
  });
});

describe('hoursSince', () => {
  it('computes elapsed hours from a filed date to now', () => {
    expect(hoursSince('2026-09-09', new Date('2026-09-10T00:00:00Z'))).toBe(24);
    expect(hoursSince('2026-09-10', new Date('2026-09-10T12:00:00Z'))).toBe(12);
  });
});
