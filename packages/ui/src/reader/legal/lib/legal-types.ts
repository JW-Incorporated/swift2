/**
 * The one switch. `'draft'` renders the review banner on both pages and marks
 * them `noindex`. Counsel signs off → founders flip this to `'approved'`,
 * fill in every `[FOUNDERS: …]` blank, and log the decision. A test refuses
 * to let `'approved'` ship while any placeholder remains.
 */
export const LEGAL_STATUS: 'draft' | 'approved' = 'draft';

/** Marker for a blank only a human can fill. Scanned by `legalPlaceholders()`. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for filling founder blanks
const FOUNDERS = (question: string): string => `[FOUNDERS: ${question}]`;

/**
 * Every fact an AI agent must not invent. Each value is either a verified fact
 * from the repo or a `FOUNDERS(...)` blank. Nothing in this object may be
 * guessed — a wrong legal entity or a wrong governing law is worse than a
 * visible blank.
 */
export const LEGAL_FACTS = {
  /** The product name. Verified: apps/web/app/layout.tsx metadata. */
  siteName: 'Long Live',
  /** Production host. Verified: apps/web/app/layout.tsx `metadataBase`, docs/deploy.md. */
  siteUrl: 'https://www.longlivets.com',
  /**
   * The operating entity. Provided by Wyatt (founder) on 2026-08-12 — not
   * derivable from the repo, so it is a founder-supplied fact, not a guess.
   */
  entity: 'JW Labs LLC',
  /**
   * Where the entity is formed / whose law governs. Founder-supplied
   * 2026-08-24 (Joey, in chat): California.
   */
  jurisdiction: 'the State of California, USA — JW Labs LLC is formed under California law',
  /**
   * Contact for privacy questions and rights requests. Founder-approved
   * 2026-08-24 (Joey): use the suggested role alias. The retired privacy
   * page published a founder's personal Gmail; this replaces it.
   */
  privacyEmail: 'privacy@longlivets.com',
  /** Where rights-holders send takedown notices. Founder-approved 2026-08-24 (Joey). */
  legalEmail: 'legal@longlivets.com',
  /**
   * Postal address. Founder call 2026-08-24 (Joey): omit per counsel's
   * advice rather than publish one at this project stage.
   */
  postalAddress:
    "not published at this project's stage, per counsel's advice — write to the email addresses above instead",
  /** The date these pages take effect. Founder-set 2026-08-24 (Joey): today, counsel already signed off. */
  effectiveDate: 'August 24, 2026',
} as const;

/** Blocks a legal document is built from. Deliberately small — prose, lists, tables. */
export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; caption: string; head: string[]; rows: string[][] };

/** One `<h2>` section. There is no `h3` tier by construction — no level can be skipped. */
export type LegalSection = {
  /** Stable anchor id, also the React key. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  slug: 'privacy' | 'terms';
  /** The `<h1>` and the `<title>`. */
  title: string;
  /** One-line description for `metadata.description`. */
  description: string;
  /** The plain-language summary rendered directly under the h1. */
  summary: string;
  sections: LegalSection[];
};
