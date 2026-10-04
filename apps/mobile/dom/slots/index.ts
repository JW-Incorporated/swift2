// DOM-side entry (AppReader reads `slots()`). Adding a slice's slots = create
// `dom/slots/<slice>.ts` that imports `register` from './instance' and calls
// `register({ slice, slots })` at module scope, then add ONE side-effect import
// line below. The native host must NOT import this file (it pulls slot
// components); it uses './routes' (see `<slice>.routes.ts`). No slice bodies yet.

// --- slice imports go here, one line each ---
import './settings';

export { register, slots } from './instance';
export { createSlotRegistry } from './registry';
export type { SliceModule, SlotRegistry } from './types';
