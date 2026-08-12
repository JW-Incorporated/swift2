import { describe, expect, it } from 'vitest';

import { PROMPT_COUNT, suggestedPrompts } from './clownbot-prompts';
import { LORE, loreById } from './clownbot-lore';

const NOW = new Date('2026-08-11T12:00:00Z');

describe('suggested prompts follow the landing rule (research finding #9)', () => {
  it('returns a full set', () => {
    expect(suggestedPrompts(NOW).length).toBe(PROMPT_COUNT);
  });

  it('every prompt invites a stance or a job, never a summary', () => {
    const verbs = /\b(decode|rank|take a side|draft|autopsy|commit|argue|tell me|what does|so what)\b/i;
    for (const p of suggestedPrompts(NOW, 0, 50)) {
      expect(verbs.test(p.text), `not a job: ${p.text}`).toBe(true);
    }
  });

  it('every prompt traces to a real lore item', () => {
    for (const p of suggestedPrompts(NOW, 0, 50)) {
      expect(loreById(p.sourceId), `orphan prompt: ${p.id}`).toBeDefined();
    }
  });

  it('is answerable — every backing item carries receipts', () => {
    for (const p of suggestedPrompts(NOW, 0, 50)) {
      expect(loreById(p.sourceId)!.sources.length).toBeGreaterThan(0);
    }
  });

  it('never returns duplicates within one set', () => {
    const set = suggestedPrompts(NOW, 0, PROMPT_COUNT);
    expect(new Set(set.map((p) => p.id)).size).toBe(set.length);
  });
});

describe('retirement', () => {
  it('retires prompts on a debunked item unless the item IS the correction', () => {
    const ids = new Set(suggestedPrompts(NOW, 0, 50).map((p) => p.sourceId));
    for (const item of LORE) {
      if (item.status !== 'debunked') continue;
      if (item.ledger) {
        // The Super Bowl autopsy is about having been wrong — that is product.
        continue;
      }
      expect(ids.has(item.id), `${item.id} is debunked but still prompting`).toBe(false);
    }
  });
});

describe('rotation', () => {
  it('a different offset yields a different leading prompt', () => {
    const a = suggestedPrompts(NOW, 0);
    const b = suggestedPrompts(NOW, 3);
    expect(a[0].id).not.toBe(b[0].id);
  });

  it('is deterministic for the same offset', () => {
    expect(suggestedPrompts(NOW, 7).map((p) => p.id)).toEqual(
      suggestedPrompts(NOW, 7).map((p) => p.id),
    );
  });

  it('wraps safely for a large or negative offset', () => {
    expect(suggestedPrompts(NOW, 9999).length).toBe(PROMPT_COUNT);
    expect(suggestedPrompts(NOW, -4).length).toBe(PROMPT_COUNT);
  });
});

describe('degrades to evergreens rather than going empty', () => {
  it('still returns a full set years after the last live item', () => {
    const distantFuture = new Date('2030-01-01T00:00:00Z');
    const out = suggestedPrompts(distantFuture);
    expect(out.length).toBe(PROMPT_COUNT);
    // Nothing is live that far out, so the surface leans on evergreens — and
    // the component says so rather than implying freshness.
    expect(out.every((p) => p.kind !== 'live')).toBe(true);
  });
});
