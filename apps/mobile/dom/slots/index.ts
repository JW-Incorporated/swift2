// DOM-side entry (AppReader reads `slots()`). Adding a slice's slots = create
// `dom/slots/<slice>.ts` that imports `register` from './instance' and calls
// `register({ slice, slots })` at module scope, then add ONE side-effect import
// line below. The native host must NOT import this file (it pulls slot
// components); it uses './routes' (see `<slice>.routes.ts`).
//
// Slot-name convention (mapped onto packages/ui ReaderSlots by ./reader-slots.ts):
//   surface:<mode>   slots.surfaces[mode]   (an AppMode: era, threads, mood, clownbot, community, merch)
//   overlay:<name>   appended to slots.overlays in REGISTRATION ORDER (this file's import order sets stacking:
//                    import track-guide before song so the song dossier stacks on top)
//   footer           slots.footer
//   floating         slots.floating
// Anything else throws. A slice that registers a surface/overlay also deletes its row in ./overlay-fallback.tsx.

// --- slice imports go here, one line each ---
import './moment';
import './tracks';
import './era';
import './threads';
import './legal';
import './floating';
import './footer';
import './merch';
import './community';
import './settings';
import './inbox';
import './search';
import './clown';

export { register, slots } from './instance';
export { createSlotRegistry } from './registry';
export type { SliceModule, SlotRegistry } from './types';
