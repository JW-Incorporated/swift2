// WP 2.9-D (AT RISK: built ahead of H4/D2, H2 and the iOS-1 gate). The merch
// surface, imported directly from @swift2/ui (G10). Slot name follows the D2
// convention `surface:<mode>`. Merch data comes only from the filled snapshot
// (D2 fills core + extensions before any slot renders); cards are plain links,
// no affiliate tags (G4); submit-link goes through the host apiFetch and
// Turnstile is unset so the form just submits (G5).
import { createElement, useMemo, type ReactElement } from 'react';
import { useExtendedSnapshot } from '@swift2/ui';
import type { ReaderSnapshotExtensions } from '@swift2/experience/reader-snapshot';
import { MerchSection } from '@swift2/ui/reader/merch/MerchSection';
import { register } from './instance';

export const MERCH_SLICE = 'merch';

/** MerchSection takes its extensions as a prop; supply them from the extended snapshot. */
export function MerchSurface(): ReactElement {
  const { domains } = useExtendedSnapshot();
  const extensions = useMemo<ReaderSnapshotExtensions>(
    () => ({ merch: domains.merch, songMoods: domains.songMoods }),
    [domains.merch, domains.songMoods],
  );
  return createElement(MerchSection, { extensions });
}

export const MERCH_SLOTS = { 'surface:merch': MerchSurface } as const;

register({ slice: MERCH_SLICE, slots: MERCH_SLOTS });
