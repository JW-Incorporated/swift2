import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { buildApprovalPrompt, sendApprovalPrompt } from './approval-prompt.mjs';
// @ts-expect-error — implementation is plain .mjs
import { DISCORD_MESSAGE_LIMIT } from '../community/discord-delivery.mjs';

function pr(overrides: Record<string, unknown> = {}) {
  return { number: 4100, url: 'https://github.com/JW-Incorporated/swift2/pull/4100', ...overrides };
}

function draft(overrides: Record<string, unknown> = {}) {
  return {
    file: 'social/queue/2026-09-12-shop-the-look-announce-x.json',
    platform: 'x',
    body: 'on this day in 2010: "mine" leaked early.',
    scheduledAt: '2026-09-11T15:00:00Z',
    campaign: 'thread:hidden-clues:origin-story:2026-09',
    mediaCredit: 'Photographer/Getty',
    media: ['/social/library/photos/example.jpg'],
    altText: ['Taylor Swift performing live in 2010, guitar in hand.'],
    why: 'sourcing explanation',
    sourceRoutine: 'growth-draft',
    ...overrides,
  };
}

// A fixed "now" so schedule-line assertions (in Xd Yh / OVERDUE) are stable.
const NOW = new Date('2026-09-11T09:00:00Z');

// The exact regex social-approval-poll.mjs uses to bind a reaction to a
// draft (that file's own `REF_LINE_RE`, duplicated here rather than
// imported — that script executes `run()` under a module-load guard and
// this test only needs to prove format compatibility, not exercise it).
// Any edit to that script's REF_LINE_RE must be mirrored here.
const POLL_REF_LINE_RE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/m;

describe('buildApprovalPrompt', () => {
  it('every message still ends with a ref: line matching social-approval-poll.mjs\'s REF_LINE_RE (Tree identity line must not break this)', () => {
    const messages = buildApprovalPrompt(pr({ number: 4130 }), [draft(), draft({ platform: 'instagram', file: 'social/queue/x-ig.json' })], {
      now: NOW,
      headSha: 'c'.repeat(40),
    });
    for (const message of messages) {
      expect(message.content).toMatch(POLL_REF_LINE_RE);
    }
  });

  it('prefixes each draft message with the Tree identity line ("Tree · slot: ... · pillar: ...") without disturbing the ref: line', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft()], { now: NOW, headSha: 'abc123' });
    const lines = draftMsg.content.split('\n');
    expect(lines[0]).toBe('Tree · slot: 2026-09-11 15:00 UTC · pillar: thread:hidden-clues:origin-story');
    expect(draftMsg.content.trim().endsWith(`ref: PR #4100 · abc123 · ${'social/queue/2026-09-12-shop-the-look-announce-x.json'}`)).toBe(true);
  });

  it('falls back to "fast lane: <sourceRoutine>" for the Tree identity slot when scheduledAt is missing/invalid', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ scheduledAt: 'not-a-date', sourceRoutine: 'growth-draft' })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content.split('\n')[0]).toBe('Tree · slot: fast lane: growth-draft · pillar: thread:hidden-clues:origin-story');
  });

  it('prefers `lane` over `sourceRoutine` for the Tree identity slot fast-lane label (Tree Overhaul T1)', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ scheduledAt: 'not-a-date', lane: 'merch', sourceRoutine: 'growth-draft' })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content.split('\n')[0]).toBe('Tree · slot: fast lane: merch · pillar: thread:hidden-clues:origin-story');
  });

  it('header renders "Drafted by: calendar" (not "unknown") for a lane item — spec AC#6', () => {
    const messages = buildApprovalPrompt(pr(), [draft({ lane: 'calendar', sourceRoutine: undefined })], { now: NOW, headSha: 'abc123' });
    expect(messages[0].content).toContain('Drafted by: calendar');
  });

  it('the per-draft body\'s own "Drafted by:" line also prefers `lane` and always renders (reviewer catch, PR #4140 round 1)', () => {
    const [, withLane] = buildApprovalPrompt(pr(), [draft({ lane: 'merch', sourceRoutine: undefined })], { now: NOW, headSha: 'abc123' });
    expect(withLane.content).toContain('Drafted by: merch');

    // No lane AND no sourceRoutine (neither jq projection in
    // social-approval-notify.yml writes sourceRoutine any more) must still
    // render the line, not silently omit it as the old
    // `draft.sourceRoutine ? ... : null` conditional did.
    const [, withNeither] = buildApprovalPrompt(pr(), [draft({ lane: undefined, sourceRoutine: undefined })], { now: NOW, headSha: 'abc123' });
    expect(withNeither.content).toContain('Drafted by: unknown');
  });

  it('renders `pillar:` from `pillarOf(campaign)` for a real campaign, and "unspecified" for a null one (Tree Overhaul T2, spec AC#6)', () => {
    const [, real] = buildApprovalPrompt(pr(), [draft({ campaign: 'thread:hidden-clues:origin-story:2026-09' })], { now: NOW, headSha: 'abc123' });
    expect(real.content.split('\n')[0]).toBe('Tree · slot: 2026-09-11 15:00 UTC · pillar: thread:hidden-clues:origin-story');

    const [, nullCampaign] = buildApprovalPrompt(pr(), [draft({ campaign: null })], { now: NOW, headSha: 'abc123' });
    expect(nullCampaign.content.split('\n')[0]).toBe('Tree · slot: 2026-09-11 15:00 UTC · pillar: unspecified');
  });

  it('returns a header message plus one message per draft', () => {
    const messages = buildApprovalPrompt(pr(), [draft(), draft({ platform: 'instagram', file: 'social/queue/x-ig.json' })], { now: NOW, headSha: 'abc123' });
    expect(messages).toHaveLength(3);
    expect(messages[0].content).toContain('PR #4100');
    expect(messages[0].content).toContain('<https://github.com/JW-Incorporated/swift2/pull/4100>');
    expect(messages[0].content).toContain('2 drafts');
    expect(messages[0].embeds).toEqual([]);
  });

  it('includes account handle, schedule, length, caption, media URL, alt text, credit, why, campaign, and drafted-by', () => {
    const messages = buildApprovalPrompt(pr(), [draft()], { now: NOW, headSha: 'abc123', repo: 'JW-Incorporated/swift2' });
    const [, draftMsg] = messages;

    expect(draftMsg.content).toContain('Draft 1 · X — @longlivetscom');
    expect(draftMsg.content).toContain('Posts at:');
    expect(draftMsg.content).toMatch(/Length: .*\/ 280 weighted characters/);
    expect(draftMsg.content).toContain('on this day in 2010: "mine" leaked early.');
    expect(draftMsg.content).toContain('Image 1/1: https://www.longlivets.com/social/library/photos/example.jpg');
    expect(draftMsg.content).toContain('Alt text 1/1: "Taylor Swift performing live in 2010, guitar in hand."');
    expect(draftMsg.content).toContain('Credit: Photographer/Getty');
    expect(draftMsg.content).toContain('Why: sourcing explanation');
    expect(draftMsg.content).toContain('https://github.com/JW-Incorporated/swift2/blob/abc123/social/queue/2026-09-12-shop-the-look-announce-x.json');
    expect(draftMsg.content).toContain('Campaign: thread:hidden-clues:origin-story:2026-09');
    expect(draftMsg.content).toContain('Drafted by: growth-draft');
  });

  it('renders the critique rationale as the first paragraph, right after the header line, with no numeric scores shown (Tree Overhaul T2, spec AC#5)', () => {
    const rationale = "This is the Decode thread's origin-story beat: it teaches the one mechanic new followers don't get yet.";
    const critique = { v: 1, scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 }, total: 23, rationale, rulesChecked: [], revision: 1 };
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ critique })], { now: NOW, headSha: 'abc123' });
    const lines = draftMsg.content.split('\n');
    const headerIndex = lines.findIndex((l) => l.startsWith('**Draft'));

    expect(lines[headerIndex + 1]).toBe(rationale);
    expect(lines.findIndex((l) => l.startsWith('Posts at:'))).toBeGreaterThan(headerIndex + 1);
    expect(draftMsg.content).not.toMatch(/onStrategy|onVoice|mediaEarnsItsPlace|notEmbarrassed/i);
    expect(draftMsg.content).not.toMatch(/\b(total|score)\s*[:=]?\s*\d/i);
  });

  it('renders no rationale paragraph for a draft with no critique yet, rather than crashing', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ critique: undefined })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).toContain('Posts at:');
  });

  // Codex round 1, MEDIUM 1: the draft() fixture above is MORE permissive
  // than what social-approval-notify.yml's jq manifest projection actually
  // sends in production (it also carries sourceRoutine, which the real
  // manifest never did either) — that gap is exactly how `critique` went
  // missing from the real projection while every test here kept passing.
  // This constructs the manifest's REAL, narrow, exact field list (jq
  // `{file, platform, body, scheduledAt, campaign, mediaCredit, media,
  // mediaKind, altText, why, lane, approval, critique}`, both projections
  // in that workflow) with nothing extra, so a future field this shape
  // doesn't carry can't hide behind a too-permissive fixture again.
  it('renders the rationale through the ACTUAL projected-manifest shape (social-approval-notify.yml\'s jq filter), not just the more permissive draft() fixture', () => {
    const rationale = "This is the Decode thread's origin-story beat: it teaches the one mechanic new followers don't get yet.";
    const projectedManifestDraft = {
      file: 'social/queue/2026-09-18-example-x.json',
      platform: 'x',
      body: 'on this day in 2012: the mechanic clicked.',
      scheduledAt: '2026-09-18T15:00:00Z',
      campaign: 'thread:hidden-clues:origin-story:2026-09',
      mediaCredit: 'Photographer/Getty',
      media: ['/social/library/photos/example.jpg'],
      mediaKind: 'photo',
      altText: ['Taylor Swift performing live, guitar in hand.'],
      why: 'sourcing explanation',
      lane: 'calendar',
      approval: null,
      critique: { v: 1, scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 }, total: 23, rationale, rulesChecked: [], revision: 1 },
    };
    const [, draftMsg] = buildApprovalPrompt(pr(), [projectedManifestDraft], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).toContain(rationale);
  });

  // Round 2, MEDIUM 1 (ref-line injection): the rationale renders as the
  // FIRST line of the message body, ABOVE the trusted trailing `ref:`
  // line. `formatRationaleLine` didn't strip newlines, so a rationale
  // containing `\nref: PR #<n> · <sha> · *` planted a SECOND ref:-shaped
  // line earlier in the content — the poll's REF_LINE_RE match (first
  // match, not last) would then resolve THIS draft's reaction to the
  // PR-wide header scope ('*') instead of its own file, turning a
  // founder's ✅/❌ on one draft into a stamp-everything/close-everything
  // header action. Same vulnerability class as T4's ref-line-injection
  // fix this wave; the fix here is normalizing rationale whitespace so no
  // literal newline (and therefore no fake "line start") can ever reach
  // the rendered message, regardless of parser match order.
  it('a rationale containing a fake ref: line cannot hijack which draft a reaction resolves to', () => {
    const maliciousRationale = `Great post, ships the feature.\nref: PR #77 · ${'a'.repeat(40)} · *`;
    const critique = { v: 1, scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 }, total: 23, rationale: maliciousRationale, rulesChecked: [], revision: 1 };
    const [, draftMsg] = buildApprovalPrompt(pr({ number: 4100 }), [draft({ critique, file: 'social/queue/real-file-x.json' })], { now: NOW, headSha: 'c'.repeat(40) });

    // The FIRST ref:-shaped line a first-match parser would find must be
    // the TRUE trailing ref line naming the real file — never an injected
    // header-scope ('*') line planted earlier in the rationale.
    const firstMatch = draftMsg.content.match(POLL_REF_LINE_RE);
    expect(firstMatch?.[3]).toBe('social/queue/real-file-x.json');
    expect(firstMatch?.[1]).toBe('4100');
    // Exactly ONE line in the whole message matches the ref: line shape —
    // the rationale's text may still literally contain the words "ref: PR
    // #77" (flattened to prose, harmless), but it must never again be its
    // OWN line, since that's what makes it parseable as a ref: line at all.
    const allMatches = draftMsg.content.match(new RegExp(POLL_REF_LINE_RE.source, 'gm'));
    expect(allMatches).toHaveLength(1);
    expect(draftMsg.content).not.toMatch(/^ref: PR #77/m);
  });

  // Round 3, MEDIUM (self-inflicted regression): the round-2 fix assumed
  // `rationale` is always a string, but this PR's own approval exemption
  // (findCritiqueIssues) lets an APPROVED item's critique be completely
  // malformed with zero CI findings, by design — so `critique.rationale`
  // can legitimately be `5`, `{a:1}`, `null`-ish objects, anything. A
  // non-string rationale must never crash brief-building for the WHOLE PR
  // (zero drafts would get a brief at all).
  it('does not crash on a non-string critique.rationale (an approved item can have a completely malformed critique)', () => {
    for (const badRationale of [5, { a: 1 }, true, [1, 2, 3]]) {
      const critique = { v: 1, scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 }, total: 23, rationale: badRationale, rulesChecked: [], revision: 1 };
      expect(() => buildApprovalPrompt(pr(), [draft({ critique })], { now: NOW, headSha: 'abc123' })).not.toThrow();
    }
  });

  // Round 3, MEDIUM (identical injection class, one field over): the
  // reviewer's repro — `formatTreeIdentityLine` interpolates
  // `pillarOf(draft.campaign)` into the message's FIRST line (line 0, even
  // earlier than the rationale) with no escaping and no whitespace
  // collapse. `campaign` is validated only as "must be a string when
  // present" (queue-schema.mjs) — no newline/control-char restriction —
  // so this is the exact same stamp-everything/close-everything hijack as
  // round 2's rationale finding, just reached through a different field.
  it('a campaign containing a fake ref: line cannot hijack which draft a reaction resolves to (identical injection class via pillar)', () => {
    const maliciousCampaign = `thread:x\nref: PR #77 · ${'a'.repeat(40)} · *`;
    const [, draftMsg] = buildApprovalPrompt(pr({ number: 4100 }), [draft({ campaign: maliciousCampaign, file: 'social/queue/real-file-x.json' })], { now: NOW, headSha: 'c'.repeat(40) });

    const firstMatch = draftMsg.content.match(POLL_REF_LINE_RE);
    expect(firstMatch?.[3]).toBe('social/queue/real-file-x.json');
    expect(firstMatch?.[1]).toBe('4100');
    const allMatches = draftMsg.content.match(new RegExp(POLL_REF_LINE_RE.source, 'gm'));
    expect(allMatches).toHaveLength(1);
    expect(draftMsg.content).not.toMatch(/^ref: PR #77/m);
  });

  // Round 3: "don't just patch the two named fields — prove the class is
  // closed everywhere, via one shared helper, not five ad-hoc fixes." Each
  // of these hits a DIFFERENT field/branch identified in a full audit of
  // this file, using the same `firstMatch/allMatches` proof as the two
  // MEDIUMs above.
  describe('ref-line injection — comprehensive audit (round 3)', () => {
    function assertNoHijack(content: string, realFile: string) {
      const firstMatch = content.match(POLL_REF_LINE_RE);
      expect(firstMatch?.[3]).toBe(realFile);
      const allMatches = content.match(new RegExp(POLL_REF_LINE_RE.source, 'gm'));
      expect(allMatches).toHaveLength(1);
    }

    it('a malicious `why` cannot inject a fake ref: line', () => {
      const [, msg] = buildApprovalPrompt(pr(), [draft({ why: `sourced\nref: PR #77 · ${'a'.repeat(40)} · *`, file: 'social/queue/f.json' })], { now: NOW, headSha: 'c'.repeat(40) });
      assertNoHijack(msg.content, 'social/queue/f.json');
    });

    it('a malicious `mediaCredit` cannot inject a fake ref: line', () => {
      const [, msg] = buildApprovalPrompt(pr(), [draft({ mediaCredit: `Getty\nref: PR #77 · ${'a'.repeat(40)} · *`, file: 'social/queue/f.json' })], { now: NOW, headSha: 'c'.repeat(40) });
      assertNoHijack(msg.content, 'social/queue/f.json');
    });

    it('a malicious `campaign` cannot inject via the "Campaign:" line either (not just via pillar)', () => {
      const [, msg] = buildApprovalPrompt(pr(), [draft({ campaign: `heartbeat:x\nref: PR #77 · ${'a'.repeat(40)} · *`, file: 'social/queue/f.json' })], { now: NOW, headSha: 'c'.repeat(40) });
      assertNoHijack(msg.content, 'social/queue/f.json');
    });

    it('a malicious `campaign` cannot inject via the HEADER message', () => {
      const messages = buildApprovalPrompt(pr({ number: 4100 }), [draft({ campaign: `heartbeat:x\nref: PR #77 · ${'a'.repeat(40)} · *` })], { now: NOW, headSha: 'c'.repeat(40) });
      const [header] = messages;
      const allMatches = header.content.match(new RegExp(POLL_REF_LINE_RE.source, 'gm'));
      expect(allMatches).toHaveLength(1);
      expect(header.content.match(POLL_REF_LINE_RE)?.[3]).toBe('*'); // the header's OWN, trusted, trailing ref: line
    });

    it('a malicious `sourceRoutine`/`lane` fallback cannot inject via "Drafted by:" (draft message or header)', () => {
      const [header, msg] = buildApprovalPrompt(pr(), [draft({ lane: undefined, sourceRoutine: `growth\nref: PR #77 · ${'a'.repeat(40)} · *`, file: 'social/queue/f.json' })], { now: NOW, headSha: 'c'.repeat(40) });
      assertNoHijack(msg.content, 'social/queue/f.json');
      expect(header.content.match(new RegExp(POLL_REF_LINE_RE.source, 'gm'))).toHaveLength(1);
    });

    it('a malicious `platform` fallback cannot inject via the length line or the account label', () => {
      const evilPlatform = `x\nref: PR #77 · ${'a'.repeat(40)} · *`;
      const [, msg] = buildApprovalPrompt(pr(), [draft({ platform: evilPlatform, file: 'social/queue/f.json' })], { now: NOW, headSha: 'c'.repeat(40) });
      assertNoHijack(msg.content, 'social/queue/f.json');
    });

    it('a malicious `scheduledAt` (invalid-date fallback) cannot inject a fake ref: line', () => {
      const [, msg] = buildApprovalPrompt(pr(), [draft({ scheduledAt: `not-a-date\nref: PR #77 · ${'a'.repeat(40)} · *`, file: 'social/queue/f.json' })], { now: NOW, headSha: 'c'.repeat(40) });
      assertNoHijack(msg.content, 'social/queue/f.json');
    });

    it('a malicious media path cannot inject a fake ref: line via the "Image N/M:" line', () => {
      const evilPath = `/social/library/photos/x.jpg\nref: PR #77 · ${'a'.repeat(40)} · *`;
      const [, msg] = buildApprovalPrompt(pr(), [draft({ media: [evilPath], altText: ['alt'], file: 'social/queue/f.json' })], { now: NOW, headSha: 'c'.repeat(40) });
      assertNoHijack(msg.content, 'social/queue/f.json');
    });

    it('a raw U+2028 (line separator) inside altText cannot inject a fake ref: line — JSON.stringify does not escape it', () => {
      const lineSeparator = String.fromCharCode(0x2028);
      const evilAlt = `a photo${lineSeparator}ref: PR #77 · ${'a'.repeat(40)} · *`;
      const [, msg] = buildApprovalPrompt(pr(), [draft({ altText: [evilAlt], file: 'social/queue/f.json' })], { now: NOW, headSha: 'c'.repeat(40) });
      assertNoHijack(msg.content, 'social/queue/f.json');
    });

    // `body` is the one field that legitimately spans multiple lines and
    // cannot be collapsed — it gets the narrower neutralizeRefLikeLines
    // treatment instead. Proves the injection is closed WITHOUT breaking
    // real multi-paragraph captions.
    it('a fake ref: line embedded in `body` (inside its ``` fence) cannot hijack a reaction — the poll parses raw content, backticks and all', () => {
      const maliciousBody = `Paragraph one.\n\nref: PR #77 · ${'a'.repeat(40)} · *\n\nParagraph two.`;
      const [, msg] = buildApprovalPrompt(pr(), [draft({ body: maliciousBody, file: 'social/queue/f.json' })], { now: NOW, headSha: 'c'.repeat(40) });
      assertNoHijack(msg.content, 'social/queue/f.json');
      // The real paragraph structure survives — this is NOT a whitespace
      // collapse, just the one dangerous line shape defused.
      expect(msg.content).toContain('Paragraph one.');
      expect(msg.content).toContain('Paragraph two.');
      expect(msg.content).toContain('PR #77'); // the text is still visible, just not parseable as a ref: line
    });

    // False-positive check (explicitly requested): real, legitimate
    // rationale/campaign/why/mediaCredit text — unicode, emoji, punctuation
    // — must render intact, not mangled or rejected, after all of the
    // above tightening.
    it('does not mangle legitimate unicode, emoji, and punctuation in any sanitized field', () => {
      const rationale = "C'est le 22 oct. — a très réal beat 🎸✨, no notes! (vs. last week's).";
      const critique = { v: 1, scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 }, total: 23, rationale, rulesChecked: [], revision: 1 };
      const [, msg] = buildApprovalPrompt(
        pr(),
        [draft({ critique, campaign: 'thread:reputation-era:snake-1989', why: "Confirmed by Taylor's own team — café press run, 2026-09-01.", mediaCredit: 'Photographer Ünïçödé (© 2026)' })],
        { now: NOW, headSha: 'c'.repeat(40) },
      );
      expect(msg.content).toContain(rationale);
      expect(msg.content).toContain('pillar: thread:reputation-era:snake-1989');
      expect(msg.content).toContain("Why: Confirmed by Taylor's own team — café press run, 2026-09-01.");
      expect(msg.content).toContain('Credit: Photographer Ünïçödé (© 2026)');
      expect(msg.content).toContain('Campaign: thread:reputation-era:snake-1989');
    });
  });

  it('attaches an image embed built from the same MEDIA_BASE_URL/mediaUrlsFor helper as the poster, with the www host', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft()], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.embeds).toEqual([{ image: { url: 'https://www.longlivets.com/social/library/photos/example.jpg' } }]);
  });

  it('emits an OVERDUE annotation instead of a bare timestamp for a past-due draft', () => {
    const overdueDraft = draft({ scheduledAt: '2026-09-10T08:00:00Z' }); // 25h before NOW
    const [, draftMsg] = buildApprovalPrompt(pr(), [overdueDraft], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).toMatch(/OVERDUE by 25h/);
    expect(draftMsg.content).toContain('retired to failed/ at 48h');
  });

  it('emits a relative "in Xd Yh" annotation for a future draft, never a bare timestamp', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ scheduledAt: '2026-09-12T23:00:00Z' })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).toMatch(/Posts at: 2026-09-12 23:00 UTC \(in \d+d \d+h\)/);
  });

  it('adds the Facebook cross-post disclosure on an Instagram draft iff facebookCrosspost is true, never on X', () => {
    const igDraft = draft({ platform: 'instagram' });
    const withFb = buildApprovalPrompt(pr(), [igDraft], { now: NOW, headSha: 'abc123', facebookCrosspost: true });
    expect(withFb[1].content).toContain('Also publishes to: your Facebook Page — automatic, image 1 + this caption verbatim, same alt text.');

    const withoutFb = buildApprovalPrompt(pr(), [igDraft], { now: NOW, headSha: 'abc123', facebookCrosspost: false });
    expect(withoutFb[1].content).not.toContain('Also publishes to');

    const xWithFbFlag = buildApprovalPrompt(pr(), [draft({ platform: 'x' })], { now: NOW, headSha: 'abc123', facebookCrosspost: true });
    expect(xWithFbFlag[1].content).not.toContain('Also publishes to');
  });

  it('neutralizes broadcast mentions in an untrusted caption body', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ body: '@everyone check this out' })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).not.toContain('@everyone check');
  });

  it('escapes a caption body that itself contains a triple-backtick fence', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ body: 'before ```danger``` after' })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).not.toMatch(/```\n?danger/);
  });

  it('requires headSha — every brief message must carry a verifiable ref: line (RULINGS-SOCIAL-2.md B1)', () => {
    expect(() => buildApprovalPrompt(pr(), [draft()], { now: NOW })).toThrow(/headSha is required/);
  });

  it('the header message ends with the machine-readable ref: line naming the PR, headSha, and "*" (RULINGS-SOCIAL-2.md B1)', () => {
    const [header] = buildApprovalPrompt(pr({ number: 4130 }), [draft()], { now: NOW, headSha: 'a'.repeat(40) });
    expect(header.content.trim().endsWith(`ref: PR #4130 · ${'a'.repeat(40)} · *`)).toBe(true);
  });

  it('each draft message ends with the machine-readable ref: line naming the PR, headSha, and its own file (RULINGS-SOCIAL-2.md B1)', () => {
    const [, draftMsg] = buildApprovalPrompt(pr({ number: 4130 }), [draft({ file: 'social/queue/2026-09-12-example-x.json' })], {
      now: NOW,
      headSha: 'b'.repeat(40),
    });
    expect(draftMsg.content.trim().endsWith(`ref: PR #4130 · ${'b'.repeat(40)} · social/queue/2026-09-12-example-x.json`)).toBe(true);
  });

  it('formats multiple drafts (the X+Instagram sibling pair) with distinct handles', () => {
    const messages = buildApprovalPrompt(
      pr(),
      [draft({ platform: 'x' }), draft({ platform: 'instagram', body: 'IG sibling body' })],
      { now: NOW, headSha: 'abc123' },
    );
    expect(messages[1].content).toContain('Draft 1 · X — @longlivetscom');
    expect(messages[2].content).toContain('Draft 2 · Instagram — @longlivetscom');
    expect(messages[2].content).toContain('IG sibling body');
  });
});

describe('sendApprovalPrompt', () => {
  it('sends each message as its own webhook POST and attaches embeds only to the last chunk of a message', async () => {
    const messages = buildApprovalPrompt(pr(), [draft()], { now: NOW, headSha: 'abc123' });
    const calls: unknown[] = [];
    const fetchImpl = vi.fn(async (_url: string, init: unknown) => {
      calls.push(init);
      return new Response(JSON.stringify({ id: `msg-${calls.length}`, embeds: [{ image: { url: 'x' } }] }), { status: 200 });
    });

    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('delivered');
    expect(result.delivered).toHaveLength(2); // header (no embed) + 1 draft message
    expect(result.embedsSent).toBe(1);
    expect(result.embedsAccepted).toBe(1);
    const bodies = calls.map((init) => JSON.parse(String((init as { body: string }).body)));
    expect(bodies[0].embeds).toBeUndefined(); // header carries no embed
    expect(bodies[1].embeds).toEqual([{ image: { url: 'https://www.longlivets.com/social/library/photos/example.jpg' } }]);
    for (const body of bodies) {
      expect(body.username).toBe('Tree');
      expect(body.avatar_url).toBe('https://www.longlivets.com/social/tree-avatar.png');
    }
  });

  it('chunks a long message at the Discord limit, attaching embeds only to the final chunk', async () => {
    const longBody = 'word '.repeat(500); // pushes one draft message over 2000 chars
    const messages = buildApprovalPrompt(pr(), [draft({ body: longBody })], { now: NOW, headSha: 'abc123' });
    expect(messages[1].content.length).toBeGreaterThan(DISCORD_MESSAGE_LIMIT);

    const bodies: Array<{ content: string; embeds?: unknown }> = [];
    const fetchImpl = vi.fn(async (_url: string, init: unknown) => {
      const body = JSON.parse(String((init as { body: string }).body));
      bodies.push(body);
      return new Response(JSON.stringify({ id: `msg-${bodies.length}`, embeds: body.embeds ?? [] }), { status: 200 });
    });

    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('delivered');
    expect(bodies.length).toBeGreaterThan(2); // header + at least 2 chunks of the draft message
    for (const body of bodies) expect(body.content.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);
    const withEmbeds = bodies.filter((b) => b.embeds?.length);
    expect(withEmbeds).toHaveLength(1); // only the LAST chunk of the draft message carries the embed
  });

  it('is a clean no-op when the webhook is not configured', async () => {
    const fetchImpl = vi.fn();
    const result = await sendApprovalPrompt([{ content: 'short content', embeds: [] }], { webhook: '', fetchImpl });

    expect(result).toEqual({ status: 'unconfigured', delivered: [], failed: [], embedsSent: 0, embedsAccepted: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('isolates a failed chunk send — the rest still deliver', async () => {
    const messages = buildApprovalPrompt(pr(), [draft(), draft({ platform: 'instagram', file: 'x-ig.json' })], { now: NOW, headSha: 'abc123' });

    let call = 0;
    const fetchImpl = vi.fn(async (_url: string, init: unknown) => {
      call += 1;
      if (call === 2) return new Response('boom', { status: 500 });
      const body = JSON.parse(String((init as { body: string }).body));
      return new Response(JSON.stringify({ id: `msg-${call}`, embeds: body.embeds ?? [] }), { status: 200 });
    });

    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('partial');
    expect(result.failed).toEqual([{ message: 1, chunk: 0, error: expect.stringContaining('HTTP 500') }]);
    expect(result.delivered.length).toBeGreaterThan(0);
  });

  it('treats a Discord response reporting fewer embeds than sent as a failed chunk — the machine-verifiable half of "the image shows"', async () => {
    const messages = buildApprovalPrompt(pr(), [draft()], { now: NOW, headSha: 'abc123' });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'msg-1', embeds: [] }), { status: 200 }));

    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('partial');
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].error).toContain('embeds.length=0');
  });
});
