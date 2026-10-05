import { PRIVACY_POLICY } from './legal-privacy';
import { TERMS_OF_USE } from './legal-terms';
import { LEGAL_FACTS, LEGAL_STATUS } from './legal-types';
import type { LegalDoc } from './legal-types';

/** Both documents, in the order they appear in the footer. */
export const LEGAL_DOCS: LegalDoc[] = [PRIVACY_POLICY, TERMS_OF_USE];

/** Every string in a document, flattened — the corpus placeholder scanning reads. */
function docStrings(doc: LegalDoc): string[] {
  const out = [doc.title, doc.description, doc.summary];
  for (const section of doc.sections) {
    out.push(section.heading);
    for (const block of section.blocks) {
      if (block.kind === 'p') out.push(block.text);
      else if (block.kind === 'list') out.push(...block.items);
      else out.push(block.caption, ...block.head, ...block.rows.flat());
    }
  }
  return out;
}

const PLACEHOLDER_RE = /\[FOUNDERS:[^\]]*\]/g;

/**
 * Every unanswered question across `LEGAL_FACTS` and both documents, deduped.
 * This is the founders' to-do list, and the test that stops an `approved`
 * document shipping with a blank still in it.
 */
export function legalPlaceholders(): string[] {
  const corpus = [...Object.values(LEGAL_FACTS), ...LEGAL_DOCS.flatMap(docStrings)];
  const found = new Set<string>();
  for (const text of corpus) {
    for (const match of text.matchAll(PLACEHOLDER_RE)) found.add(match[0]);
  }
  return [...found];
}

/** True when a string still carries an unfilled `[FOUNDERS: …]` blank. */
export function hasPlaceholder(text: string): boolean {
  return new RegExp(PLACEHOLDER_RE.source).test(text);
}

/**
 * A draft must not be indexed: an unreviewed policy ranking in search results
 * reads as settled policy to anyone who lands on it. Flipping `LEGAL_STATUS`
 * to `'approved'` lets the crawlers in.
 */
export function legalRobots(status: typeof LEGAL_STATUS = LEGAL_STATUS): {
  index: boolean;
  follow: boolean;
} {
  return status === 'approved' ? { index: true, follow: true } : { index: false, follow: true };
}

/**
 * Sitemap entries for the legal pages — empty while they are drafts, because a
 * draft renders `noindex` and listing a `noindex` URL contradicts itself.
 */
export function legalSitemapEntries(status: typeof LEGAL_STATUS = LEGAL_STATUS): { url: string }[] {
  if (status !== 'approved') return [];
  return LEGAL_DOCS.map((doc) => ({ url: `${LEGAL_FACTS.siteUrl}/${doc.slug}` }));
}

/** The dateline under the page title. */
export function legalEffectiveLine(status: typeof LEGAL_STATUS = LEGAL_STATUS): string {
  return status === 'approved'
    ? `Effective ${LEGAL_FACTS.effectiveDate}.`
    : 'Not yet in effect — this draft takes effect on the date counsel approves it.';
}

/** Copy for the review banner shown on every draft page. */
export const LEGAL_DRAFT_BANNER = {
  title: 'Draft — not yet reviewed by a lawyer',
  body: 'This page is a working draft prepared to describe what the site actually does. It has not been reviewed or approved by qualified counsel, it is not legal advice, and it is not yet in effect. Sections marked [FOUNDERS: …] are open questions awaiting a human answer.',
} as const;
