import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './rumor-redline.mjs';
// @ts-expect-error — plain .mjs rule engine, no types
import { rumorRedlineViolations, blockingRumorRedlineViolations } from '../../lib/rumor-redlines.mjs';

type Rumor = Record<string, unknown>;

/** A rumor that trips nothing — the baseline every case mutates. */
const clean = (over: Rumor = {}): Rumor => ({
  claim: 'An outlet reported that a new album is in the works.',
  reportedBy: 'Rolling Stone',
  reportedOn: '2026-07-01',
  status: 'unconfirmed',
  url: 'https://example.com/a',
  sourceTier: 'established',
  ...over,
});

const rules = (r: Rumor, ctx: Record<string, unknown> = {}) =>
  rumorRedlineViolations(r, ctx).map((v: { rule: string }) => v.rule);

function item(rumors: Rumor[], category = 'music') {
  return [{ type: 'moment', file: 'x.mjs', era: 'midnights', key: 'k', title: 'A moment', category, raw: { moment: { rumors } } }];
}

describe('rumor-redlines — the clean baseline', () => {
  it('passes an ordinary attributed rumor', () => {
    expect(rules(clean())).toEqual([]);
  });
});

describe('RR1 — whereabouts rumor with no declared locationSpecificity', () => {
  it('fires on an unresolved sighting rumor that omits the field', () => {
    expect(rules(clean(), { category: 'sighting' })).toContain('RR1');
  });

  it('is silent once the field is declared — the gate can then run', () => {
    expect(rules(clean({ locationSpecificity: 'region' }), { category: 'sighting' })).not.toContain('RR1');
  });

  it('is silent on a RESOLVED sighting rumor — a documented event is not speculation', () => {
    const resolved = clean({ status: 'confirmed', resolution: { on: '2026-07-02', url: 'https://e.com', outlet: 'AP' } });
    expect(rules(resolved, { category: 'sighting' })).not.toContain('RR1');
  });

  it('is silent on non-sighting categories — it reads the category, never the prose', () => {
    for (const category of ['music', 'fashion', 'business', 'tour', 'release', 'relationship']) {
      expect(rules(clean(), { category })).not.toContain('RR1');
    }
  });

  it('is ADVISORY, not blocking — its remedy is a content judgment', () => {
    expect(blockingRumorRedlineViolations(clean(), { category: 'sighting' })).toHaveLength(0);
  });
});

describe('RR2 — sourceTier laundering', () => {
  it('fires when a blind-item primary source claims a tier above social', () => {
    expect(rules(clean({ reportedBy: 'Deuxmoi (via Cosmopolitan)', sourceTier: 'tabloid' }))).toContain('RR2');
    expect(rules(clean({ reportedBy: 'Rob Shuter’s Naughty But Nice (via Reality Tea)', sourceTier: 'tabloid' }))).toContain('RR2');
    expect(rules(clean({ reportedBy: 'Deuxmoi', sourceTier: 'established' }))).toContain('RR2');
  });

  it('is silent when the same source is tiered honestly', () => {
    expect(rules(clean({ reportedBy: 'Deuxmoi (via Cosmopolitan)', sourceTier: 'social' }))).not.toContain('RR2');
  });

  it('judges the PRIMARY source, not the aggregator that carried it', () => {
    // "Us Weekly (via AOL)" is Us Weekly reporting — AOL is a syndication path.
    expect(rules(clean({ reportedBy: 'Us Weekly (via AOL)', sourceTier: 'tabloid' }))).not.toContain('RR2');
    // …and an aggregator cannot launder a blind item by appearing after it.
    expect(rules(clean({ reportedBy: 'Deuxmoi, via Yahoo Entertainment', sourceTier: 'established' }))).toContain('RR2');
  });

  it('blocks — relabelling a field is a mechanical remedy', () => {
    expect(blockingRumorRedlineViolations(clean({ reportedBy: 'Deuxmoi', sourceTier: 'tabloid' }))).toHaveLength(1);
  });
});

describe('RR3 — sourceTier absent (fail closed)', () => {
  const noTier = (): Rumor => {
    const r = clean();
    delete r.sourceTier;
    return r;
  };

  it('fires when the tier is missing, because RR4s provenance gate then cannot run', () => {
    expect(rules(noTier())).toContain('RR3');
  });

  it('blocks', () => {
    expect(blockingRumorRedlineViolations(noTier())).toHaveLength(1);
  });
});

describe('RR4 — redline category asserted at speculative provenance', () => {
  const speculative = (claim: string, over: Rumor = {}) => clean({ claim, sourceTier: 'tabloid', ...over });

  it('fires on each named category', () => {
    expect(rules(speculative('A source says security was tightened, with a bodyguard posted at the gate.'))).toContain('RR4');
    expect(rules(speculative('Insiders say she is pregnant and due in the spring.'))).toContain('RR4');
    expect(rules(speculative('A tipster claims her daughter was enrolled nearby.'))).toContain('RR4');
    expect(rules(speculative('Friends say the pair are heading for divorce after months of trouble in paradise.'))).toContain('RR4');
    expect(rules(speculative('A source claims he was cheating on her all summer.'))).toContain('RR4');
    expect(rules(speculative('An anonymous post says he is accused of sexual misconduct.'))).toContain('RR4');
  });

  it('is silent at OFFICIAL tier when the citation is actually verified — the Always-OK self-disclosure exception', () => {
    // The corpus legitimately carries health material Taylor disclosed herself.
    // That is official-tier by construction, and it must never be accused —
    // but only once the url proves it (#1965 hardening fix #2).
    expect(
      rules(
        clean({
          claim: 'Taylor said her mother had been diagnosed with cancer.',
          url: 'https://www.taylorswift.com/news/a-statement',
          sourceTier: 'official',
        }),
      ),
    ).not.toContain('RR4');
  });

  it('is silent on a DEBUNKED claim — reporting that a rumor was false is admissible', () => {
    const debunked = speculative('Tabloids claimed she was pregnant.', {
      status: 'debunked',
      resolution: { on: '2026-07-02', url: 'https://e.com', outlet: 'AP' },
    });
    expect(rules(debunked)).not.toContain('RR4');
  });

  it('fires even at ESTABLISHED tier — attribution does not launder a violation', () => {
    expect(rules(clean({ claim: 'Reuters reported she is pregnant.', sourceTier: 'established' }))).toContain('RR4');
  });

  it('reads `claim` and never `note` — the corpus false positive that motivated it', () => {
    // A live entry's own editorial note reads "no address, no security detail".
    // Reading notes is how a checker flags an entry for saying it is CLEAN.
    const r = clean({
      claim: 'A gossip account placed the pair at dinner at a restaurant on Saturday.',
      note: 'Venue-level only — a public, past, concluded restaurant visit; no address, no security detail.',
      sourceTier: 'social',
    });
    expect(rules(r)).not.toContain('RR4');
  });

  it('word-boundary matches — the substring hits that sank the naive list', () => {
    // Every one of these produced a false positive on the real corpus with a
    // bare `includes()` list: son→reason/season/Jason, sued→issued,
    // expecting→"expecting reputation", child→"Childless Cat Lady".
    for (const claim of [
      'For that reason the season ended, per Jason Kelce and Anderson.',
      'The copyright owner issued a block on the audio.',
      'Fans kept expecting reputation (Taylors Version) to surface.',
      'An endorsement signed "Childless Cat Lady".',
      'A minor chart change followed.',
    ]) {
      expect(rules(clean({ claim, sourceTier: 'tabloid' }))).not.toContain('RR4');
    }
  });

  it('blocks', () => {
    expect(blockingRumorRedlineViolations(speculative('Insiders say she is pregnant.'))).toHaveLength(1);
  });

  it('now fires on an unresolved OFFICIAL-tier redline claim when the citation is unverifiable — the #1965 laundering path', () => {
    // Before RR5/the officialVerified fix, setting sourceTier: 'official' on a
    // fabricated or look-alike-domain citation disabled RR4 entirely for a
    // redline claim. It no longer does: an unverifiable official tier fails
    // closed and RR4 still runs.
    const laundered = clean({
      claim: "Taylor's team confirmed she was hospitalized after a health scare.",
      reportedBy: "Taylor's Team (exclusive)",
      url: 'https://taylorswift-news.co/statement',
      sourceTier: 'official',
    });
    expect(rules(laundered)).toContain('RR4');
  });
});

describe('RR5 — sourceTier not backed by a reputable-source allowlist (#1965)', () => {
  it('fires when established is claimed by an unlisted domain and an unrecognized outlet name', () => {
    expect(
      rules(clean({ reportedBy: 'Daily Scoop Blog', url: 'https://daily-scoop-blog.example/post', sourceTier: 'established' })),
    ).toContain('RR5');
  });

  it('fires when official is claimed via a look-alike domain, not a citation to taylorswift.com', () => {
    expect(
      rules(clean({ reportedBy: "Taylor's Team (exclusive)", url: 'https://taylorswift-news.co/statement', sourceTier: 'official' })),
    ).toContain('RR5');
  });

  it('is silent when established is backed by an allowlisted direct-publisher domain', () => {
    expect(rules(clean({ reportedBy: 'A wire report', url: 'https://www.reuters.com/lifestyle/x', sourceTier: 'established' }))).not.toContain(
      'RR5',
    );
  });

  it('is silent when established is backed by a real outlet name carried through an aggregator url — the corpus convention', () => {
    // Matches the real corpus pattern: AOL hosts a real newsroom's piece, and
    // reportedBy (not the url host) names the actual outlet.
    expect(
      rules(clean({ reportedBy: 'ELLE (Alyssa Bailey)', url: 'https://www.aol.com/articles/x', sourceTier: 'established' })),
    ).not.toContain('RR5');
  });

  it('is silent when official is backed by a real taylorswift.com citation', () => {
    expect(
      rules(clean({ reportedBy: 'Taylor Swift (via taylorswift.com)', url: 'https://www.taylorswift.com/news/x', sourceTier: 'official' })),
    ).not.toContain('RR5');
  });

  it('blocks — a fabricated allowlist claim gets a mechanical remedy (retier or re-cite)', () => {
    expect(
      blockingRumorRedlineViolations(clean({ reportedBy: 'Daily Scoop Blog', url: 'https://daily-scoop-blog.example/post', sourceTier: 'established' })),
    ).toHaveLength(1);
  });
});

describe('the checker adapter', () => {
  it('emits Findings with the rule id in the evidence and P0s escalated', async () => {
    const f = await check(item([clean({ claim: 'Insiders say she is pregnant.', sourceTier: 'tabloid' })]));
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('safety.rumor-redline');
    expect(f[0].severity).toBe('P0');
    expect(f[0].escalate).toBe(true);
    expect(f[0].evidence).toMatch(/^\[RR4\]/);
    expect(f[0].itemRef.field).toBe('rumors[0]');
  });

  it('surfaces the advisory RR1 that validate-content does not block', async () => {
    const f = await check(item([clean()], 'sighting'));
    expect(f.map((x: { evidence: string }) => x.evidence.slice(0, 5))).toContain('[RR1]');
  });

  it('is silent on items with no rumors', async () => {
    expect(await check([{ type: 'moment', file: 'x.mjs', era: 'e', key: 'k', title: 't', raw: {} }])).toEqual([]);
  });

  it('reads the RAW seed shape, so a claim the generator would drop is still screened', async () => {
    // No url/reportedOn → rumorsFrom() drops this entry and it never renders.
    // It is still sitting in the seed file, so the safety layer must see it.
    const f = await check(item([{ claim: 'Insiders say she is pregnant.', reportedBy: 'X', status: 'unconfirmed', sourceTier: 'tabloid' }]));
    expect(f.some((x: { evidence: string }) => x.evidence.startsWith('[RR4]'))).toBe(true);
  });
});
