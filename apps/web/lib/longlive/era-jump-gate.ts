import { CURRENT_ERA_ID, ERAS } from '@swift2/experience';
import { ERA_JUMP_GATE_ATTR, ERA_JUMP_GATE_TIMER } from '@swift2/ui/reader/lib/era-jump-landing';

/**
 * #6807: a `?era=` deep link first paints the current era, then the store
 * jumps to the requested one after hydration (10+ s on a slow phone), which
 * reads as a full-page swap (CLS 1.0 on `?era=debut`). The server already sees
 * the query, so when the link is a lone, valid, non-current era it flags the
 * document before first paint; CSS keeps the feed's space but hides it until
 * EraStream's jump settles (`clearEraJumpGate`). Any other deep-link param
 * outranks `era` in `deepLinkTarget`, so those links are left untouched.
 */
/**
 * Fallback reveal for JS that never hydrates. Once the store applies the jump
 * it cancels this (`takeOverEraJumpGate`) and EraStream's 8 s deadline bounds it.
 */
export const ERA_JUMP_GATE_MAX_MS = 12000;

const OUTRANKING_PARAMS = ['item', 'song', 'guide', 'theories', 'lens', 'mode'] as const;

type SearchParams = Record<string, string | string[] | undefined>;

export function eraJumpGateTarget(params: SearchParams): string | null {
  if (OUTRANKING_PARAMS.some((key) => params[key] !== undefined)) return null;
  const era = params.era;
  if (typeof era !== 'string' || era === CURRENT_ERA_ID) return null;
  return ERAS.some((e) => e.id === era) ? era : null;
}

export function eraJumpGateScript(): string {
  return (
    `document.documentElement.setAttribute('${ERA_JUMP_GATE_ATTR}','');` +
    `window['${ERA_JUMP_GATE_TIMER}']=setTimeout(function(){document.documentElement.removeAttribute('${ERA_JUMP_GATE_ATTR}')},${ERA_JUMP_GATE_MAX_MS});`
  );
}
