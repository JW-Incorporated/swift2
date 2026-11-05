// Fan-voice sentences (docs/decisions.md 2026-11-03 amendment 3, owner
// 2026-11-04): every fact needs a source, but not every sentence needs a fact.
// A sentence with empty refs is an opinion/reaction line. Pure, zero I/O.

import { unknownAttributions } from './current-item-attribution.ts';

export const MAX_VOICE_SENTENCES = 2;

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const FACT_SHAPES = [
  /\d/,
  new RegExp(`\\b(?:${MONTHS})\\b`),
  /\b(?:19|20)\d{2}\b/,
  /"[^"]+"|“[^”]+”/,
];

/** Cheap backstop: true when an empty-refs sentence carries a number, month, year, quoted span or outlet credit. The judge is the real check. */
export function voiceSentenceHasFact(sentence: string): boolean {
  return FACT_SHAPES.some((re) => re.test(sentence)) || unknownAttributions(sentence, []).length > 0;
}

/**
 * Citation reasons for a body: `cited[i]` says whether body sentence i has
 * refs. Empty-refs sentences are fan-voice lines (capped, fact-free); each
 * paragraph still needs a cited sentence. `split` is the canonical sentence
 * splitter, injected because current-item-writing.ts imports this file.
 */
export function voiceCitationReasons(
  body: string,
  cited: readonly boolean[],
  split: (text: string) => string[],
): string[] {
  const reasons: string[] = [];
  const sentences = split(body);
  const sizes = body.split(/\n\s*\n/).map((paragraph) => split(paragraph).length);
  const paragraphSizes = sizes.reduce((sum, n) => sum + n, 0) === cited.length ? sizes : [cited.length];
  const voice = cited.map((isCited, i) => (isCited ? -1 : i)).filter((i) => i >= 0);
  let offset = 0;
  for (const size of paragraphSizes) {
    if (!cited.slice(offset, offset + size).some(Boolean)) {
      reasons.push('uncited_sentence');
      break;
    }
    offset += size;
  }
  if (voice.length > MAX_VOICE_SENTENCES) reasons.push('too_many_voice_sentences');
  if (voice.some((i) => voiceSentenceHasFact(sentences[i] ?? ''))) reasons.push('voice_sentence_has_fact');
  return reasons;
}
