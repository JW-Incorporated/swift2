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

export interface ClownStarter {
  label: string;
  prompt: string;
  /** Authoring guard: the prompt explains its own premise and needs no lore. */
  newcomerFriendly: boolean;
}

/** Compact empty-state prefills; intentionally not the retired nine-chip wall. */
export const CLOWN_STARTERS: readonly ClownStarter[] = [
  { label: 'What is clowning?', prompt: 'What is clowning?', newcomerFriendly: true },
  {
    label: 'Explain Easter eggs',
    prompt: 'What is a Taylor Swift Easter egg?',
    newcomerFriendly: true,
  },
  {
    label: 'How do you check theories?',
    prompt: 'How do you check a fan theory?',
    newcomerFriendly: true,
  },
  {
    label: 'What theories are current?',
    prompt: 'What fan theories are people discussing right now?',
    newcomerFriendly: true,
  },
];

/** Column item -> composer text. Pure. Chips never reach the model. */
export function promptForItem(item: BoardItem): string {
  const prompt = item.prompt.trim();
  // Defensive only — real board data always carries a non-empty authored
  // prompt. Falling back to the title keeps a tap usable rather than
  // prefilling the composer with nothing.
  return prompt.length > 0 ? prompt : item.title.trim();
}
