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

/**
 * Community Engine plan §Phase 2, card P2-5 — the fan-theory chip. Unlike
 * `CLOWN_STARTERS` above (a prefill only — the reader still has to hit send,
 * which routes through the full model per `ClownChat.tsx`'s own comment),
 * this ONE prompt is wired to send immediately as a `chip`-flagged request:
 * `route.ts` answers it straight from the `live_theory` knowledge_doc
 * projection (`kind='live_theory'`), zero model calls, same as a board-item
 * tap. Kept as its own export, not a fifth `CLOWN_STARTERS` entry, so it
 * never collides with `clown-starters.test.ts`'s length-4 assertion — that
 * test is about the newcomer prefill wall, a different UI affordance from
 * this one.
 */
export const FAN_THEORY_CHIP_LABEL = 'What are fans theorising right now?';
export const FAN_THEORY_CHIP_PROMPT = 'What are fans theorising right now?';

/** Column item -> composer text. Pure. Chips never reach the model. */
export function promptForItem(item: BoardItem): string {
  const prompt = item.prompt.trim();
  // Defensive only — real board data always carries a non-empty authored
  // prompt. Falling back to the title keeps a tap usable rather than
  // prefilling the composer with nothing.
  return prompt.length > 0 ? prompt : item.title.trim();
}
