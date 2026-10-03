import { createSlotRegistry } from './registry';

/** The one app-wide registry. Slice files import `register` from here and call it at module scope. */
export const registry = createSlotRegistry();
export const { register } = registry;
