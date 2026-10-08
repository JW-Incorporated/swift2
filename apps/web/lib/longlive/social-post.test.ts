import { describe, expect, it } from 'vitest';
import { VAULT_RAW } from './content-vault.generated';

// END-TO-END guard for issue #1074, and deliberately not a unit test.
//
// The unit tests in scripts/sync-longlive-content.test.ts call addItem()
// directly, so they cover the normalizer and the serializer — but they CANNOT
// catch the bug that actually happened: the seed-side caller never passed
// `socialPost` into addItem() at all. Every layer was individually correct and
// the vault still received nothing.
//
// The only assertion that covers the whole chain (seed -> caller -> normalizer
// -> serializer -> generated file) is one made against the generated file
// itself. If any single link breaks, this fails.
describe('socialPost reaches the built vault', () => {
  const items = Object.values(VAULT_RAW).flat().filter(Boolean) as {
    title: string;
    socialPost?: { platform: string; shortcode: string; label: string; postedOn?: string };
  }[];

  it('carries the endorsement post on the page that is about it', () => {
    const endorsement = items.find((i) => i.title.includes('Childless Cat Lady'));
    expect(endorsement, 'the endorsement moment should exist').toBeTruthy();
    expect(
      endorsement!.socialPost,
      'the page is ABOUT this post — if this is undefined the field was dropped somewhere in the chain',
    ).toBeTruthy();
    expect(endorsement!.socialPost!.platform).toBe('instagram');
    expect(endorsement!.socialPost!.shortcode).toBe('C_wtAOKOW1z');
    expect(endorsement!.socialPost!.label.length).toBeGreaterThan(0);
  });

  it('every emitted post is renderable — bare shortcode, non-empty label', () => {
    // A full permalink here still type-checks and still renders a card, but the
    // iframe src 404s. Catch it at the corpus level, not one page at a time.
    for (const item of items) {
      const sp = item.socialPost;
      if (!sp) continue;
      expect(sp.shortcode, `${item.title}: shortcode must be a bare id`).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(sp.label.trim(), `${item.title}: label is required`).not.toBe('');
      if (sp.postedOn) expect(sp.postedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
