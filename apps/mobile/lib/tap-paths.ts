// Which notification-tap paths the DOM reader handles itself (everything else opens natively). Pure; a thin view over
// the ONE destination resolver (destination-resolver.ts) so the tap target and the bridge never disagree.
import { resolveDestination } from './destination-resolver';

/** The path canonicalizes to a DOM destination (reader route, settings, inbox, legal) and no host route claims it. */
export function isDomOwnedTapPath(path: string, isHostRoute: (p: string) => boolean, base = 'http://site.invalid'): boolean {
  return resolveDestination(path, { isHostRoute, siteUrl: base }).kind === 'dom';
}
