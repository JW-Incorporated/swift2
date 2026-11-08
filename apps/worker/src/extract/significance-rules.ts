import type { CurrentItemCategory, CurrentItemStatus, SourceTier } from '@swift2/shared';

// Layer 1 of the significance stage (docs/decisions.md 2026-11-08): pure,
// deterministic rules that catch the tier-3 patterns. A match HOLDS the item
// as `not_notable:<rule>`; it never skips. No match means "ask the judge".

export const SIGNIFICANCE_RULES = [
  'anonymous_relationship',
  'tabloid_allegation',
  'sighting_no_event',
  'celebrity_remark',
  'travis_filler',
  'listicle',
  'speculation',
] as const;
export type SignificanceRule = (typeof SIGNIFICANCE_RULES)[number];

export interface SignificanceRuleInput {
  headline: string;
  category: CurrentItemCategory;
  status: CurrentItemStatus;
  facts: readonly { claim: string }[];
  sources: readonly { url: string; tier: SourceTier }[];
}

export function significanceHoldReason(rule: SignificanceRule): string {
  return `not_notable:${rule}`;
}

const RELATIONSHIP_TEXT = /\b(wedding|weds?|married|marriage|marry|engaged|engagement|fianc[eé]|baby|pregnan\w*|breakup|break up|split|dating|romance|kelce)\b/i;
const ANONYMOUS_SOURCE = /\b(sources? (say|says|claim|claims|tell|told|close)|an? (insider|source)|insiders?|unnamed|reportedly|allegedly|report says|according to (a |an )?(report|sources?|tabloid)|tabloid|Daily Mail|Page Six|New York Post|NY Post|Radar ?Online|In Touch|Us Weekly|OK! Magazine|Hollywood ?Life)\b/i;
const TABLOID_ALLEGATION = /\b(allegedly|TMZ|Daily Mail|Page Six|Radar ?Online)\b/i;
const EVENT = /\b(awards?|VMAs?|Grammys?|Emmys?|CMAs?|ACMs?|AMAs?|Oscars?|Golden Globes?|Met Gala|gala|Hall of Fame|premiere[sd]?|red carpet|Recording Academy|Super Bowl|tour|concert|SNL|Saturday Night Live|cameo|national TV|halftime)\b/i;
const REMARK_VERB = /\b(says?|said|calls?|slams?|doubt(s|ed)?|dismiss(es|ed)?|puzzled|stumped|references?|urged|knocks?|praises?|describes?|questioned?|questions|liked|likes|defends?|back|asks?|claims?)\b/i;
const REMARK_EXEMPT_SUBJECT = /\b(Taylor|Swift|Travis|Kelce|Billboard|Reuters|Pitchfork|Variety|Rolling Stone|Stereogum|Republic|Universal|Taylor Nation|Luminate|Spotify|Pollstar|Guinness|Recording Academy|Grammys?|MTV|VMAs?|CMAs?|Apple Music|RIAA|Official Charts|Associated Press|NFL|Academy|Disney|Netflix|Amazon|YouTube|official|store|site|documentary)\b/i;
const GAME_TERMS = /\b(touchdowns?|games?|away game|kickoff|sidelines?|NFL|Chiefs)\b/i;
const TRAVIS = /\b(Travis|Kelce)\b/i;
const LISTICLE = /\branked:|\b(listicle|\d+ best|best \d+|top \d+|power ranking|best moments|every (song|time|look|outfit)|things to know|net worth|private jet|jet use|security (cost|bill)|ticket resale|predicts?|predictions?)\b/i;
const ANNIVERSARY = /\banniversary\b|\b(\d+|[a-z]+) (years?|decades?) (since|after|ago)\b|\bmarks? \d+ years\b|\blooks? back\b|\brevisits?\b/i;
const PRODUCT_NOUN = /\b(vinyl|editions?|re-?releases?|Taylor's Version|tour|single|album)\b/i;
const SPECULATION = /\b(fans? (are )?(think|thinks|speculate|speculating|debat\w+|are convinced|want to know|lip-?read)|fan theor\w+|theories|spark(s|ed|ing)? (speculation|theories|debate)|lip-?read)\b/i;

function isTaylorSwiftHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'taylorswift.com' || host.endsWith('.taylorswift.com');
  } catch {
    return false;
  }
}

function hasOfficialSource(sources: SignificanceRuleInput['sources']): boolean {
  return sources.some((source) => source.tier === 'official' || isTaylorSwiftHost(source.url));
}

function remarkSubject(headline: string): string | undefined {
  const match = REMARK_VERB.exec(headline);
  if (!match) return undefined;
  return headline.slice(0, match.index);
}

/**
 * The first tier-3 rule the item trips, or undefined when it needs the judge.
 * An item with an official Taylor source is never held here.
 */
export function significanceRuleHold(input: SignificanceRuleInput): SignificanceRule | undefined {
  if (hasOfficialSource(input.sources)) return undefined;
  const { headline, category, status } = input;
  const text = [headline, ...input.facts.map((fact) => fact.claim)].join(' ');
  const confirmed = status === 'confirmed';

  if (!confirmed && (category === 'relationship' || RELATIONSHIP_TEXT.test(headline)) && ANONYMOUS_SOURCE.test(text)) {
    return 'anonymous_relationship';
  }
  if (!confirmed && TABLOID_ALLEGATION.test(headline)) return 'tabloid_allegation';
  if ((category === 'sighting' || category === 'fashion') && !EVENT.test(headline)) return 'sighting_no_event';
  const subject = remarkSubject(headline);
  if (subject !== undefined && /\bTaylor\b/.test(headline.slice(subject.length)) && !REMARK_EXEMPT_SUBJECT.test(subject) && subject.trim().length > 0) {
    return 'celebrity_remark';
  }
  if (GAME_TERMS.test(headline) && TRAVIS.test(headline) && !confirmed) return 'travis_filler';
  if (LISTICLE.test(headline) || (ANNIVERSARY.test(headline) && !PRODUCT_NOUN.test(headline))) return 'listicle';
  if (SPECULATION.test(headline)) return 'speculation';
  return undefined;
}
