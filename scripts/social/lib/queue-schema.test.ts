import { describe, expect, it } from 'vitest';
import { validatePhotoInventoryBinding, validateQueueItem, PLATFORM_RULES, LANES, findCritiqueIssues } from './queue-schema.mjs';
import { contentHash, approvalStatus } from './queue.mjs';
import { SOCIAL_APPROVERS } from './approvers.mjs';

const validCritique = {
  v: 1,
  scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 },
  total: 23,
  rationale: "This is the Decode thread's origin-story beat, using a dated, verifiable 2012 detail rather than a vibe.",
  rulesChecked: [],
  revision: 1,
};
const validX = {
  platform: 'x',
  lane: 'calendar',
  body: 'a real tweet',
  scheduledAt: '2026-08-12T23:00:00Z',
  campaign: 'launch:shop-the-look:announce',
  media: ['/social/library/photos/taylor-lover-eras-minneapolis-2023.jpg'],
  altText: ['Taylor Swift performing the Lover set in Minneapolis, 2023.'],
  mediaKind: 'photo',
  photoId: 'lover-minneapolis-2023',
  mediaCredit: 'Michael Hicks (CC BY 2.0), via Wikimedia Commons',
  mediaSource: 'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_MN_-_Lover_act_-_4.jpg',
  critique: validCritique,
};
const validIg = {
  platform: 'instagram',
  lane: 'calendar',
  body: 'a real caption',
  media: ['/social/library/mood-chat-screen.png'],
  altText: ['A screenshot of the mood chat feature.'],
  mediaKind: 'site-screen',
  scheduledAt: '2026-08-12T23:00:00Z',
  critique: validCritique,
};

/** A validly-approved item shaped like the four real 2026-09-12/13
 * social/queue/ items (v2, `SOCIAL_APPROVERS[0]`, no `critique` — they
 * predate T2 entirely) — `contentHash` is real and matches, `sig` only
 * needs the right shape since approvalStatus is called with no `key` here,
 * same as validateQueueItem's own approval check. */
function approvedItem(overrides: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = { ...validX };
  delete base.critique;
  const { approval: approvalOverride, ...restOverrides } = overrides as { approval?: Record<string, unknown> };
  const item = { ...base, ...restOverrides };
  return {
    ...item,
    approval: {
      v: 2,
      by: SOCIAL_APPROVERS[0],
      at: '2026-09-11T16:26:33.227Z',
      pr: 4108,
      message: '1547824198238339083',
      contentHash: contentHash(item),
      sig: `hmac-sha256:${'0'.repeat(64)}`,
      ...approvalOverride,
    },
  };
}

const findingFor = (item: unknown, needle: string | RegExp) =>
  validateQueueItem(item).find((f) => (typeof needle === 'string' ? f.includes(needle) : needle.test(f)));

const library = [
  {
    id: 'lover-minneapolis-2023',
    mediaPath: '/social/library/photos/taylor-lover-eras-minneapolis-2023.jpg',
    credit: 'Michael Hicks (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_MN_-_Lover_act_-_4.jpg',
    alt: 'Taylor Swift performing the Lover set in Minneapolis, 2023.',
    tags: ['lover', 'eras-tour', 'minneapolis'],
  },
];

describe('validateQueueItem', () => {
  it('accepts the two real shapes the queue actually uses', () => {
    expect(validateQueueItem(validX)).toEqual([]);
    expect(validateQueueItem(validIg)).toEqual([]);
    expect(validateQueueItem({ ...validIg, campaign: 'c', why: 'w', approvedBy: 'joey', approvedAt: '2026-08-01T00:00:00Z' })).toEqual([]);
  });

  it('rejects a non-object', () => {
    expect(validateQueueItem(null)).toEqual(['not a JSON object']);
    expect(validateQueueItem([validX])).toEqual(['not a JSON object']);
  });

  it('rejects an unknown platform', () => {
    expect(findingFor({ ...validX, platform: 'twitter' }, 'platform:')).toBeDefined();
    expect(findingFor({ ...validX, platform: undefined }, 'platform:')).toBeDefined();
  });

  describe('lane (Tree Overhaul T1, 2026-09-12 — replaces sourceRoutine)', () => {
    it('rejects a missing lane', () => {
      expect(findingFor({ ...validX, lane: undefined }, 'lane:')).toBeDefined();
    });

    it('rejects a lane outside the four-value enum', () => {
      expect(findingFor({ ...validX, lane: 'sourceRoutine' }, 'lane:')).toBeDefined();
    });

    it('accepts each of the 4 valid lane values', () => {
      expect(LANES).toEqual(['calendar', 'merch', 'appearance', 'reddit']);
      for (const lane of LANES) {
        expect(validateQueueItem({ ...validX, lane })).toEqual([]);
      }
    });
  });

  describe('critique (Tree Overhaul T2, self-critique before queueing)', () => {
    it('rejects a missing critique', () => {
      expect(findingFor({ ...validX, critique: undefined }, 'critique')).toBeDefined();
    });

    // Real-CI regression (PR #4144, build-full on the four live 2026-09-12/13
    // social/queue/ items, which predate T2 and already carry a founder-signed
    // v2 approval): critique must not be retroactively required of content a
    // founder already approved under an earlier rule. Grandfathering here is
    // a DIFFERENT question from lib/queue.mjs's "a v1 stamp is malformed
    // under v2" signature-strength rule (that one intentionally grandfathers
    // nothing) — this one is about scope, not security.
    describe('exempt once already validly approved (independent of critique)', () => {
      it('an UNAPPROVED item with no critique still fails, exactly as before', () => {
        const unapproved: Record<string, unknown> = { ...validX };
        delete unapproved.critique;
        expect(findingFor(unapproved, 'critique')).toBeDefined();
      });

      it('an APPROVED item with no critique now PASSES', () => {
        expect(validateQueueItem(approvedItem())).toEqual([]);
      });

      it('an APPROVED item with a PRESENT BUT MALFORMED critique (score of 6) also PASSES — approval exempts critique entirely, valid or not', () => {
        const malformed = { ...validCritique, scores: { ...validCritique.scores, onVoice: 6 } };
        expect(validateQueueItem(approvedItem({ critique: malformed }))).toEqual([]);
      });

      it('findCritiqueIssues itself short-circuits on a valid approval, before ever looking at critique', () => {
        expect(findCritiqueIssues(approvedItem({ critique: { garbage: true } }))).toEqual([]);
      });

      it('an item with a present-but-INVALID approval (unrecognized approver) is NOT exempt — still requires critique', () => {
        const fakeApproval = approvedItem({ approval: { by: 'discord:99999999999999999' } });
        expect(findingFor(fakeApproval, 'critique')).toBeDefined();
      });

      // Codex round 1, MEDIUM 2 (corrected round 2 — see findCritiqueIssues's
      // docstring): the unkeyed approvalStatus call this exemption uses
      // (shape/id/hash only — this module never holds SOCIAL_APPROVAL_KEY)
      // accepts a FORGED approval: any real item's public contentHash, a
      // public SOCIAL_APPROVERS id, and an arbitrary hmac-sha256-shaped
      // string. This is documented and accepted as a bounded cost, NOT a
      // "buys nothing" one — a founder genuinely reacting ✅ on such an item
      // (unaware critique was skipped) WOULD get it a real, validly-signed
      // approval and it WOULD post. What this test proves is narrower and
      // still true: the FORGED signature itself never verifies against the
      // real key — a forged item that no real founder ever reacts to sits
      // unposted forever, exactly like any other unapproved item.
      it('a forged approval that exempts critique here does not itself carry a valid signature — approvalStatus called WITH the key rejects it', () => {
        const forged = approvedItem({ approval: { sig: `hmac-sha256:${'0'.repeat(64)}` } });
        expect(validateQueueItem(forged)).toEqual([]); // exempted here (unkeyed, shape/hash only)
        expect(approvalStatus(forged, { approvers: SOCIAL_APPROVERS, key: 'a-real-secret-only-the-poll-and-poster-hold' }).ok).toBe(false); // rejected there (keyed)
      });
    });

    it('rejects a score of 0 or 6', () => {
      expect(findingFor({ ...validX, critique: { ...validCritique, scores: { ...validCritique.scores, onVoice: 0 } } }, 'critique.scores.onVoice')).toBeDefined();
      expect(findingFor({ ...validX, critique: { ...validCritique, scores: { ...validCritique.scores, onVoice: 6 } } }, 'critique.scores.onVoice')).toBeDefined();
    });

    it('rejects a non-integer score', () => {
      expect(findingFor({ ...validX, critique: { ...validCritique, scores: { ...validCritique.scores, specific: 3.5 } } }, 'critique.scores.specific')).toBeDefined();
    });

    it('rejects a total that does not equal the sum', () => {
      expect(findingFor({ ...validX, critique: { ...validCritique, total: 24 } }, 'critique.total')).toBeDefined();
    });

    it('rejects a rationale over 320 characters', () => {
      expect(findingFor({ ...validX, critique: { ...validCritique, rationale: 'x'.repeat(321) } }, 'critique.rationale')).toBeDefined();
    });

    // Round 2, MEDIUM 1 (ref-line injection): rationale renders as the
    // first line of the approval brief, above the trusted trailing `ref:`
    // line — a newline here could otherwise plant a fake ref:-shaped line
    // and hijack which draft a reaction resolves to (see
    // approval-prompt.test.ts's dedicated reproduction). Reject outright
    // at the schema so a malformed rationale can't even pass CI.
    it('rejects a rationale containing a newline or other control character', () => {
      const withNewline = { ...validCritique, rationale: `line one\nref: PR #1 · ${'a'.repeat(40)} · *` };
      expect(findingFor({ ...validX, critique: withNewline }, 'critique.rationale')).toBeDefined();
      const withCarriageReturn = { ...validCritique, rationale: 'line one\rline two' };
      expect(findingFor({ ...validX, critique: withCarriageReturn }, 'critique.rationale')).toBeDefined();
      const withTab = { ...validCritique, rationale: 'line one\tline two' };
      expect(findingFor({ ...validX, critique: withTab }, 'critique.rationale')).toBeDefined();
    });

    // The regression that matters: a terminal-punctuation sentence-counter
    // would misfire on ordinary prose like this. No such counter runs here —
    // the character cap is the only enforcement (spec §Mechanics).
    it('accepts a rationale containing "22 Oct." and "vs." (never counts sentences)', () => {
      const rationale = 'On 22 Oct. this beat the Lover era vs. every other era in engagement, No. 1 by a wide margin.';
      expect(validateQueueItem({ ...validX, critique: { ...validCritique, rationale } })).toEqual([]);
    });

    // AC#2 (spec): the hard gate is independent of the total — every OTHER
    // dimension at 5 and a correctly-computed total of 23 must still fail
    // on notEmbarrassed alone.
    it('rejects notEmbarrassed: 3 even when every other dimension is 5 and the total is correctly computed', () => {
      const scores = { onStrategy: 5, onVoice: 5, specific: 5, mediaEarnsItsPlace: 5, notEmbarrassed: 3 };
      const findings = validateQueueItem({ ...validX, critique: { ...validCritique, scores, total: 23 } });
      expect(findings).toContain('critique.notEmbarrassed is 3, needs 4');
    });

    // AC#3 boundary cases.
    it('accepts the exact boundary case: all fives except notEmbarrassed: 4 (total 24)', () => {
      const scores = { onStrategy: 5, onVoice: 5, specific: 5, mediaEarnsItsPlace: 5, notEmbarrassed: 4 };
      expect(validateQueueItem({ ...validX, critique: { ...validCritique, scores, total: 24 } })).toEqual([]);
    });

    it('accepts the minimum passing case {3,3,4,4,4} = 18', () => {
      const scores = { onStrategy: 3, onVoice: 3, specific: 4, mediaEarnsItsPlace: 4, notEmbarrassed: 4 };
      expect(validateQueueItem({ ...validX, critique: { ...validCritique, scores, total: 18 } })).toEqual([]);
    });

    it('rejects a total of 17 — one under the 18 threshold', () => {
      const scores = { onStrategy: 3, onVoice: 3, specific: 3, mediaEarnsItsPlace: 4, notEmbarrassed: 4 };
      const findings = validateQueueItem({ ...validX, critique: { ...validCritique, scores, total: 17 } });
      expect(findings).toContain('critique.total is 17, needs 18');
    });

    it('rejects rulesChecked when missing or not an array of strings, but accepts []', () => {
      expect(findingFor({ ...validX, critique: { ...validCritique, rulesChecked: undefined } }, 'critique.rulesChecked')).toBeDefined();
      expect(findingFor({ ...validX, critique: { ...validCritique, rulesChecked: [1] } }, 'critique.rulesChecked')).toBeDefined();
      expect(validateQueueItem({ ...validX, critique: { ...validCritique, rulesChecked: [] } })).toEqual([]);
    });

    it('rejects a revision outside 1 or 2, and a v other than 1', () => {
      expect(findingFor({ ...validX, critique: { ...validCritique, revision: 3 } }, 'critique.revision')).toBeDefined();
      expect(findingFor({ ...validX, critique: { ...validCritique, v: 2 } }, 'critique.v')).toBeDefined();
    });

    it('validateQueueItem surfaces exactly findCritiqueIssues\' findings (shared, not a second implementation)', () => {
      const broken = { ...validCritique, scores: { ...validCritique.scores, notEmbarrassed: 2 } };
      const item = { ...validX, critique: broken };
      expect(findCritiqueIssues(item).length).toBeGreaterThan(0);
      expect(validateQueueItem(item)).toEqual(findCritiqueIssues(item));
    });
  });

  describe('body length', () => {
    // The regression that mattered: every X item in social/failed/ was over
    // 280 chars and every one that posted was under it.
    it("rejects an X body over X's 280-character limit", () => {
      const finding = findingFor({ ...validX, body: 'x'.repeat(281) }, 'body:');
      expect(finding).toContain('281 weighted characters exceeds');
      expect(finding).toContain('403');
    });

    it("counts X length by X's weighted rule — a URL weighs 23, not its raw length", () => {
      // Raw length is way past 280, but the URL collapses to 23 weighted:
      // this is the shape every current queue X draft actually has.
      const url = 'longlivets.com/?era=tloas&utm_source=x&utm_medium=social&utm_campaign=on-this-day';
      const prose = 'y'.repeat(250);
      const body = `${prose}

${url}`;
      expect(body.length).toBeGreaterThan(280);
      expect(validateQueueItem({ ...validX, body })).toEqual([]);
      // …and a short-looking body can still be over: 260 prose + URL = 285.
      const over = `${'y'.repeat(260)}

${url}`;
      expect(findingFor({ ...validX, body: over }, 'body:')).toBeDefined();
    });

    it('accepts an X body exactly at the limit', () => {
      expect(validateQueueItem({ ...validX, body: 'x'.repeat(280) })).toEqual([]);
    });

    it('reproduces the real failed/posted split at 280', () => {
      const posted = [84, 219, 246, 247, 260, 268, 270, 271, 272, 272, 274, 275, 276];
      const failed = [294, 302, 310, 321, 322, 338, 341, 342, 352, 358, 373];
      for (const n of posted) expect(validateQueueItem({ ...validX, body: 'x'.repeat(n) })).toEqual([]);
      for (const n of failed) expect(findingFor({ ...validX, body: 'x'.repeat(n) }, 'body:')).toBeDefined();
    });

    it('allows Instagram captions far past X’s limit but not past 2200', () => {
      expect(validateQueueItem({ ...validIg, body: 'x'.repeat(2200) })).toEqual([]);
      expect(findingFor({ ...validIg, body: 'x'.repeat(2201) }, 'body:')).toBeDefined();
    });

    it('rejects an empty or missing body', () => {
      expect(findingFor({ ...validX, body: '   ' }, 'body:')).toBeDefined();
      expect(findingFor({ platform: 'x', scheduledAt: validX.scheduledAt }, 'body:')).toBeDefined();
    });
  });

  describe('scheduledAt', () => {
    it('requires a parseable ISO instant with a timezone', () => {
      expect(findingFor({ ...validX, scheduledAt: '2026-08-12' }, 'scheduledAt:')).toBeDefined();
      expect(findingFor({ ...validX, scheduledAt: '2026-08-12T23:00:00' }, 'scheduledAt:')).toBeDefined();
      expect(findingFor({ ...validX, scheduledAt: 'tomorrow' }, 'scheduledAt:')).toBeDefined();
      expect(findingFor({ ...validX, scheduledAt: undefined }, 'scheduledAt:')).toBeDefined();
      expect(findingFor({ ...validX, scheduledAt: '2026-13-45T99:00:00Z' }, 'scheduledAt:')).toBeDefined();
    });

    it('accepts offsets and fractional seconds (what social/posted/ already contains)', () => {
      expect(validateQueueItem({ ...validX, scheduledAt: '2026-08-12T23:00:00.123Z' })).toEqual([]);
      expect(validateQueueItem({ ...validX, scheduledAt: '2026-08-12T19:00:00-04:00' })).toEqual([]);
    });
  });

  describe('media', () => {
    it('requires a photoId and exact inventory attribution in the queue CI binding', () => {
      expect(validatePhotoInventoryBinding({ ...validX, photoId: undefined }, library).some((f) => f.includes('photoId: required'))).toBe(true);
      expect(validatePhotoInventoryBinding({ ...validX, mediaCredit: 'Wrong credit' }, library).some((f) => f.includes('must use its inventory media path, exact credit, and exact source'))).toBe(true);
      expect(validatePhotoInventoryBinding(validX, library)).toEqual([]);
    });

    // 2026-09-10 (kanban t_75ec7106) — the founder-reported off-era-photo bug.
    it('hard-fails a themed draft whose bound photo is not tagged for its declared photoEra', () => {
      expect(validatePhotoInventoryBinding({ ...validX, photoEra: 'reputation' }, library)).toContainEqual(expect.stringContaining('photoEra:'));
    });
    it('passes a themed draft whose bound photo IS tagged for its declared photoEra', () => {
      expect(validatePhotoInventoryBinding({ ...validX, photoEra: 'lover' }, library)).toEqual([]);
    });
    it('does not require photoEra at all — untagged posts (launch/mood/merch) are unaffected', () => {
      expect(validatePhotoInventoryBinding(validX, library)).toEqual([]);
    });

    // Fable ruling round 4 (kanban t_75ec7106, PR #4062): a themed campaign
    // family must not be able to silently ship without declaring photoEra —
    // that opt-in gap is exactly how the original bug's campaign shape
    // (thread:easter-eggs:...) would still pass validation.
    it('requires photoEra for a themed campaign family even though the field is otherwise optional', () => {
      const themed = { ...validX, campaign: 'thread:easter-eggs:interactive-challenge:2026-09-find', photoEra: undefined };
      expect(validatePhotoInventoryBinding(themed, library)).toContainEqual(expect.stringContaining('photoEra: campaign'));
    });
    it('requires photoEra for the heartbeat:era-deep-cut family too', () => {
      const themed = { ...validX, campaign: 'heartbeat:era-deep-cut:speak-now-blah', photoEra: undefined };
      expect(validatePhotoInventoryBinding(themed, library)).toContainEqual(expect.stringContaining('photoEra: campaign'));
    });
    it('passes a themed campaign once photoEra is set and matches', () => {
      const themed = { ...validX, campaign: 'thread:easter-eggs:interactive-challenge:2026-09-find', photoEra: 'lover' };
      expect(validatePhotoInventoryBinding(themed, library)).toEqual([]);
    });
    it('does NOT require photoEra for a non-themed campaign family (launch:*)', () => {
      const nonThemed = { ...validX, campaign: 'launch:shop-the-look:announce', photoEra: undefined };
      expect(validatePhotoInventoryBinding(nonThemed, library)).toEqual([]);
    });
    it('rejects a text-only X draft for a normal paired campaign, and mediaKind "video-thumb" no longer exists as an exception (2026-09-10, kanban t_bac31b1a)', () => {
      const pairedX = { ...validX, campaign: 'launch:shop-the-look:announce', media: undefined, mediaKind: undefined };
      expect(findingFor(pairedX, 'x posts require at least one image')).toBeDefined();
      const findings = validateQueueItem({ ...pairedX, campaign: 'appearance:video-id', mediaKind: 'video-thumb' });
      expect(findings.some((f) => f.includes('x posts require at least one image'))).toBe(true);
      expect(findings.some((f) => f.includes('mediaKind') && f.includes('not recognized'))).toBe(true);
    });
    it('binds a launch site-screen carousel grid photo to its exact credited inventory entry', () => {
      const carousel = {
        ...validIg,
        campaign: 'launch:shop-the-look:announce',
        media: [library[0].mediaPath, '/social/library/thread-fashion-intro.png'],
        altText: [library[0].alt, 'A screenshot introducing the fashion thread.'],
        photoId: library[0].id,
        mediaCredit: library[0].credit,
        mediaSource: library[0].source,
      };

      expect(validatePhotoInventoryBinding(carousel, library)).toEqual([]);
      expect(validatePhotoInventoryBinding({ ...carousel, photoId: undefined }, library)).toContainEqual(expect.stringContaining('photoId: required'));
      expect(validatePhotoInventoryBinding({ ...carousel, media: ['/social/library/photos/wrong.jpg', carousel.media[1]] }, library)).toContainEqual(
        expect.stringContaining('must use its inventory media path, exact credit, and exact source'),
      );
      expect(validatePhotoInventoryBinding({ ...carousel, mediaCredit: 'Wrong credit' }, library)).toContainEqual(
        expect.stringContaining('must use its inventory media path, exact credit, and exact source'),
      );
      expect(validatePhotoInventoryBinding({ ...carousel, mediaSource: 'https://example.com/wrong' }, library)).toContainEqual(
        expect.stringContaining('must use its inventory media path, exact credit, and exact source'),
      );

      const laterSlidePhoto = {
        ...carousel,
        media: ['/social/library/thread-fashion-intro.png', library[0].mediaPath],
        altText: ['A screenshot introducing the fashion thread.', library[0].alt],
      };
      expect(validatePhotoInventoryBinding(laterSlidePhoto, library)).toEqual([]);
      expect(validatePhotoInventoryBinding({ ...laterSlidePhoto, photoId: undefined }, library)).toContainEqual(expect.stringContaining('photoId: required'));
      expect(validatePhotoInventoryBinding({ ...laterSlidePhoto, mediaCredit: 'Wrong credit' }, library)).toContainEqual(
        expect.stringContaining('must use its inventory media path, exact credit, and exact source'),
      );
    });

    it('leaves a genuine non-photo site screen outside the inventory binding', () => {
      expect(validatePhotoInventoryBinding(validIg, library)).toEqual([]);
    });

    it('requires media on Instagram', () => {
      expect(findingFor({ ...validIg, media: [] }, 'media:')).toContain('require at least one image');
      expect(findingFor({ ...validIg, media: undefined }, 'media:')).toBeDefined();
    });

    it('requires photo media on normal X campaigns, up to the 4-image tweet cap, and rejects site screens', () => {
      expect(PLATFORM_RULES.x.media).toBe('required');
      expect(
        validateQueueItem({
          ...validX,
          campaign: 'launch:shop-the-look:announce',
          media: ['/social/library/photos/taylor-lover-eras-minneapolis-2023.jpg'],
          mediaKind: 'photo',
          photoId: 'lover-minneapolis-2023',
          mediaCredit: 'Michael Hicks (CC BY 2.0), via Wikimedia Commons',
          mediaSource: 'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_MN_-_Lover_act_-_4.jpg',
        }),
      ).toEqual([]);
      expect(findingFor({ ...validX, media: ['/social/library/a.png'], mediaKind: 'site-screen' }, 'X site-screen posts are permanently prohibited')).toBeDefined();
      const five = Array.from({ length: 5 }, (_, i) => `/social/${i}.png`);
      expect(findingFor({ ...validX, media: five }, 'media:')).toContain("exceeds x's limit of 4");
    });

    it('accepts every defined mediaKind and rejects an unknown one', () => {
      expect(validateQueueItem({ ...validIg, mediaKind: 'era-art' })).toEqual([]);
      expect(validateQueueItem({ ...validIg, mediaKind: 'site-screen' })).toEqual([]);
      expect(validateQueueItem({ ...validIg, mediaKind: 'photo', mediaCredit: 'Someone/Getty Images', mediaSource: 'https://example.com' })).toEqual([]);
      expect(findingFor({ ...validIg, mediaKind: 'real-photo' }, 'mediaKind:')).toBeDefined();
    });

    // 2026-09-05 (#3584, Fable ruling): "video-thumb" — a rehosted YouTube/
    // broadcaster thumbnail. Instagram never gets one; X may declare it but
    // only as a bare link preview (no attached image).
    it('rejects mediaKind "video-thumb" on Instagram outright', () => {
      expect(findingFor({ ...validIg, mediaKind: 'video-thumb' }, 'video-thumb')).toBeDefined();
    });

    it('rejects mediaKind "video-thumb" on X when an image is attached', () => {
      expect(
        findingFor(
          { ...validX, media: ['/social/library/photos/appearance-dQw4w9WgXcQ.jpg'], mediaKind: 'video-thumb' },
          'video-thumb',
        ),
      ).toBeDefined();
    });

    it('rejects mediaKind "video-thumb" as unrecognized (removed 2026-09-10, kanban t_bac31b1a)', () => {
      expect(findingFor({ ...validX, media: undefined, mediaKind: 'video-thumb' }, 'mediaKind:')).toBeDefined();
    });

    // The Taylor-photo standard (2026-08-12): a photo always ships credited
    // and auditable, and queue media always declares what it is.
    it('requires mediaCredit AND mediaSource on mediaKind "photo"', () => {
      expect(findingFor({ ...validIg, mediaKind: 'photo' }, 'mediaCredit:')).toBeDefined();
      expect(findingFor({ ...validIg, mediaKind: 'photo' }, 'mediaSource:')).toBeDefined();
      expect(findingFor({ ...validIg, mediaKind: 'photo', mediaCredit: '  ' }, 'mediaCredit:')).toBeDefined();
      expect(findingFor({ ...validIg, mediaKind: 'photo', mediaCredit: 'c', mediaSource: 'https://x' }, 'media')).toBeUndefined();
    });

    it('requires a mediaKind whenever media is present', () => {
      const noKind = { ...validIg, mediaKind: undefined };
      expect(findingFor(noKind, 'mediaKind: required')).toBeDefined();
      expect(validateQueueItem({ ...validX, media: undefined, altText: undefined, mediaKind: undefined })).toEqual(["media: x posts require at least one image."]);
    });

    it('validates mediaCredit/mediaSource shape when present', () => {
      expect(findingFor({ ...validIg, mediaCredit: 5 }, 'mediaCredit:')).toBeDefined();
      expect(findingFor({ ...validIg, mediaSource: '' }, 'mediaSource:')).toBeDefined();
    });

    it('requires site-absolute paths', () => {
      expect(findingFor({ ...validIg, media: ['eras/red.png'] }, 'media:')).toContain('site-absolute');
      expect(findingFor({ ...validIg, media: [42] }, 'media:')).toBeDefined();
    });

    it('rejects a non-array media field', () => {
      expect(findingFor({ ...validIg, media: '/eras/red.png' }, 'media:')).toContain('must be an array');
    });

    it('caps Instagram carousels at 10', () => {
      const eleven = Array.from({ length: 11 }, (_, i) => `/social/${i}.png`);
      expect(findingFor({ ...validIg, media: eleven }, 'media:')).toContain('exceeds instagram');
    });
  });

  describe('bookkeeping fields', () => {
    it('validates attempts and timestamps when present', () => {
      expect(findingFor({ ...validX, attempts: -1 }, 'attempts:')).toBeDefined();
      expect(findingFor({ ...validX, attempts: 1.5 }, 'attempts:')).toBeDefined();
      expect(validateQueueItem({ ...validX, attempts: 2, lastAttemptAt: '2026-08-12T23:00:00Z' })).toEqual([]);
      expect(findingFor({ ...validX, lastAttemptAt: 'nope' }, 'lastAttemptAt:')).toBeDefined();
      expect(findingFor({ ...validX, campaign: 12 }, 'campaign:')).toBeDefined();
    });
  });

  it('reports every problem at once rather than the first', () => {
    const findings = validateQueueItem({ platform: 'tiktok', body: '', scheduledAt: 'soon', media: 'x' });
    expect(findings.length).toBeGreaterThanOrEqual(4);
  });
});
