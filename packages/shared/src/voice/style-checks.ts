// Deterministic style predicates shared by every writing surface. Pure, zero
// I/O; the phrase and frame lists live in ./rules.json (single source of truth).

import { containment, shingles } from '../current-item-writing.ts';
import rules from './rules.json';

export type AiTellSurface = 'voice' | 'news' | 'community';

interface RuleEntry {
  phrase?: string;
  pattern: string;
  flags: string;
}

function compile<T extends RuleEntry>(entries: readonly T[]): (T & { re: RegExp })[] {
  return entries.map((entry) => ({ ...entry, re: new RegExp(entry.pattern, entry.flags) }));
}

const CORE = compile(rules.aiTells.core);
const NEWS = [...CORE, ...compile(rules.aiTells.newsExtra)];
const COMMUNITY = compile(rules.aiTells.communityExtra);
const CONTRAST = compile(rules.formulaFrames.contrast);
const TAG_A_FRIEND = compile(rules.formulaFrames.tagAFriend);

const SURFACES: Record<AiTellSurface, readonly { phrase?: string; re: RegExp }[]> = {
  voice: CORE,
  news: NEWS,
  community: COMMUNITY,
};

export function emDashCount(text: string): number {
  return (text.match(/—/g) ?? []).length;
}

export function hasContrastFrame(text: string): boolean {
  return CONTRAST.some(({ re }) => re.test(text));
}

export function hasTagAFriendCta(text: string): boolean {
  return TAG_A_FRIEND.some(({ re }) => re.test(text));
}

export function isQuestionLead(text: string): boolean {
  return /^[^.!?]*\?/.test(text.trim());
}

/** Share of non-empty texts whose first sentence is a question; 0 when there are none. */
export function questionLeadShare(texts: readonly string[]): number {
  const filled = texts.filter((text) => text.trim() !== '');
  if (filled.length === 0) return 0;
  return filled.filter(isQuestionLead).length / filled.length;
}

/** Max containment of the text's n-grams in any single corpus entry (0..1). */
export function ngramOverlap(
  text: string,
  corpus: readonly string[],
  n: number = rules.thresholds.style.ngramSize,
): number {
  const mine = shingles(text, n);
  let best = 0;
  for (const other of corpus) best = Math.max(best, containment(mine, shingles(other, n)));
  return best;
}

/** Phrases of the AI-tell patterns that `surface` enforces and `text` hits. */
export function aiTellHits(text: string, surface: AiTellSurface): string[] {
  return SURFACES[surface].filter(({ re }) => re.test(text)).map(({ phrase }) => phrase ?? '');
}
