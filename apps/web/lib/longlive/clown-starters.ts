/**
 * Clownbot — column tap -> composer prefill text.
 *
 * PLAN.md § Contracts: `promptForItem(item: BoardItem): string`. Pure — a tap
 * on a theory-board or confirmed-eggs item must never reach the model, which
 * is what keeps both board columns free (Ruling J2). `BoardItem` already
 * carries its own authored `prompt` field ("What tapping it puts in the
 * composer. Authored, not generated." — clown-board.ts's contract), so this
 * function's job is narrow: hand that text back, defensively, never a
 * generated or paraphrased string.
 */
import type { BoardItem } from './clown-board';

/** Column item -> composer text. Pure. Chips never reach the model. */
export function promptForItem(item: BoardItem): string {
  const prompt = item.prompt.trim();
  // Defensive only — real board data always carries a non-empty authored
  // prompt. Falling back to the title keeps a tap usable rather than
  // prefilling the composer with nothing.
  return prompt.length > 0 ? prompt : item.title.trim();
}
