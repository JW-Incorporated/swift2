import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs check script, no types
import { CONTENT_PREFIX, RULE_PATHS, formatFindings, itemsInScope, selectScope } from './check-voice.mjs';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './content-engine/checkers/voice.mjs';

type Item = { type: string; file: string; era: string; key: string; title: string; texts: Record<string, string> };
const item = (context: string, key = 'k', file = 'supabase/seed/content/1989.mjs'): Item => ({
  type: 'moment',
  file,
  era: '1989',
  key,
  title: 'Test item',
  texts: { context },
});

describe('check-voice scope selection', () => {
  it('scans only the content files the PR changed', () => {
    const scope = selectScope([
      'supabase/seed/content/1989.mjs',
      'supabase/seed/theories/speak-now.mjs',
      'apps/web/src/routes/era.tsx',
      'docs/launch-readiness.md',
      'package.json',
    ]);
    expect(scope.mode).toBe('changed');
    expect([...scope.files].sort()).toEqual([
      'supabase/seed/content/1989.mjs',
      'supabase/seed/theories/speak-now.mjs',
    ]);
  });

  it('pulls the parent seed file in when only a `.dossiers.mjs` side file changed', () => {
    // The corpus loader attributes dossier prose to the sibling `<era>.mjs`,
    // so scoping on the literal changed path alone would make that text
    // invisible to the gate.
    const scope = selectScope(['supabase/seed/tracks/red.dossiers.mjs']);
    expect([...scope.files].sort()).toEqual([
      'supabase/seed/tracks/red.dossiers.mjs',
      'supabase/seed/tracks/red.mjs',
    ]);
  });

  it('escalates to a FULL-corpus scan when the voice rule itself changed', () => {
    for (const rule of RULE_PATHS) {
      const scope = selectScope([rule, 'supabase/seed/content/1989.mjs']);
      expect(scope.mode).toBe('all');
      expect(scope.reason).toMatch(/full corpus/);
    }
  });

  it('is a no-op when a PR touches no content at all', () => {
    const scope = selectScope(['apps/web/src/app.css', 'README.md']);
    expect(scope.mode).toBe('changed');
    expect(scope.files.size).toBe(0);
  });

  it('tolerates an empty / missing changed-file list', () => {
    expect(selectScope([]).files.size).toBe(0);
    expect(selectScope(undefined).files.size).toBe(0);
  });

  it('ignores non-.mjs files under the content prefix (e.g. a README in a seed dir)', () => {
    const scope = selectScope([`${CONTENT_PREFIX}content/README.md`]);
    expect(scope.files.size).toBe(0);
  });
});

describe('check-voice item scoping', () => {
  const items = [
    item('a', 'a', 'supabase/seed/content/1989.mjs'),
    item('b', 'b', 'supabase/seed/content/red.mjs'),
  ];

  it('narrows the corpus to the changed files', () => {
    const scope = selectScope(['supabase/seed/content/red.mjs']);
    expect(itemsInScope(items, scope).map((i: Item) => i.key)).toEqual(['b']);
  });

  it('passes the whole corpus through in `all` mode', () => {
    expect(itemsInScope(items, { mode: 'all', files: new Set(), reason: '' })).toHaveLength(2);
  });
});

describe('check-voice failure output', () => {
  it('groups findings by file and shows the evidence and the fix', async () => {
    const findings = await check([
      item(
        'Swift has framed the song as a warning. Swift approached the estate for the interpolation, and Swift has not named the subject.',
        'drifted',
      ),
    ]);
    const out = formatFindings(findings);
    expect(out).toContain('supabase/seed/content/1989.mjs');
    expect(out).toContain('content.voice.surname-overuse');
    expect(out).toContain('drifted');
    expect(out).toContain('fix:');
  });
});

// ── The gate's real bar: it must NOT fire on content that legitimately says
// "Swift". A blocking check with false positives gets routed around, and the
// route-around is what actually killed the previous VOICE gate. Every case
// below is a shape that occurs in (or is one edit away from) the shipped
// corpus. Two of them — the legal case captions — were REAL false positives
// found by running this battery on 2026-08-12; the surname rule gained a
// case-caption exclusion because of them.
describe('check-voice false-positive battery (content that legitimately says "Swift")', () => {
  const clean: [string, string][] = [
    [
      'family members, who share the surname',
      'Austin Swift stood as Man of Honor at the ceremony, and Andrea Swift and Scott Swift watched from the front row while the band played.',
    ],
    [
      'a legal case caption — "Hall v. Swift" is what the case IS CALLED',
      'The "Shake It Off" copyright suit, Hall v. Swift, ran for six years before the parties settled in December 2022 with no admission of wrongdoing on either side.',
    ],
    [
      'a legal case caption with the surname first',
      'The Denver trial, docketed as Mueller v. Swift, ended with a jury finding for her on every count and the symbolic $1 verdict she had asked for.',
    ],
    [
      'a corporate/legal entity name in a rights context',
      'The filing lists Taylor Swift Productions, Inc. as the copyright claimant, with TAS Rights Management handling licensing for the recordings.',
    ],
    [
      'a formal songwriting credit block',
      'Writing credits on the standard edition read: Taylor Swift, Jack Antonoff, and Aaron Dessner, with Taylor Swift credited alone on five of the twelve tracks.',
    ],
    [
      'the self-titled debut album, whose TITLE is her full name',
      'Her 2006 debut album Taylor Swift arrived on Big Machine Records, and its cover — a green-tinted headshot — became the template every re-record has since answered.',
    ],
    [
      "an outlet whose own brand name is \"Swift\"",
      'The item first surfaced on Nicki Swift, which aggregated the claim from a since-deleted forum post, and no mainstream outlet ever picked it up at all.',
    ],
    [
      "a direct quote using the surname — someone else's words, never rewritten",
      'A source told the outlet: "Swift was thrilled, and Swift could not stop smiling all night long at the party." Taylor herself never addressed it publicly.',
    ],
    [
      "a third party's own statement, surname used twice",
      '"I have never met Swift, and I have no idea why Swift would say that about me," the producer wrote in a statement posted to his own account that evening.',
    ],
    [
      'a named award/institution that contains the surname',
      'The Nashville Songwriters Association named her Songwriter-Artist of the Decade, and the Taylor Swift Education Center at the Country Music Hall of Fame opened in 2013.',
    ],
    [
      'an outlet in a NOUN phrase, not acting as a subject ("the Us Weekly report")',
      'A later data point on the same open question as the Us Weekly report above, pushing the projected start from 2026 to 2027 with no announcement since.',
    ],
    [
      '"Vogue cover" / "Rolling Stone cover" — the magazine object, not a reporting verb',
      'Her first Vogue cover, shot by Mario Testino, hit newsstands in January, and the Rolling Stone cover ran the same week as the album announcement.',
    ],
    [
      'ordinary lowercase "time" next to a reporting verb',
      'A look outlets at the time noted made the gown feel young and modern, though reports at the time described a blowout fight after the trip ended.',
    ],
    [
      'correctly-shaped sourcing: the fan read leads, the citation trails',
      'The butterfly jumpsuit at the 2019 VMAs — still the outfit people bring up first when the Lover era comes up at all (Billboard, Vogue).',
    ],
    [
      'her brother and her, in the same paragraph',
      'Taylor filmed the video in a single day, and Austin Swift shot behind-the-scenes stills that the label later used for the deluxe booklet artwork.',
    ],
  ];

  for (const [label, text] of clean) {
    it(`stays quiet on ${label}`, async () => {
      expect(await check([item(text, label)])).toEqual([]);
    });
  }
});

describe('check-voice true positives (the gate still bites)', () => {
  it('catches bare-surname drift in the site\'s own narrative voice', async () => {
    const f = await check([
      item('Swift has framed the song as a warning. Swift approached the estate for the interpolation, and Swift has not named the subject.'),
    ]);
    expect(f.map((x: { checker: string }) => x.checker)).toEqual(['content.voice.surname-overuse']);
  });

  it('catches a named outlet driving the sentence', async () => {
    const f = await check([
      item("Billboard's night-one gallery logged the look as the most photographed outfit of the entire opening weekend in Glendale."),
    ]);
    expect(f.map((x: { checker: string }) => x.checker)).toEqual(['content.voice.wire-attribution']);
  });

  it('catches a single bare surname that merely TIES "Taylor" — the tie is deliberate, not a false positive', async () => {
    // House style has a first-person-plural fan register: "her co-write",
    // not "the Swift co-write". A tie flags on purpose (#461's own
    // diagnostic), and that stays true under a blocking gate — the fix is a
    // one-word edit, not an exemption.
    const f = await check([
      item('Taylor spent the whole bridge on it, and the crowd knew every word by the second chorus. The credits list the Swift co-write everyone had guessed at.'),
    ]);
    expect(f).toHaveLength(1);
  });
});
