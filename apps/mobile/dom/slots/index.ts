// Adding a slice (One UI slice D) = create `dom/slots/<slice>.ts` that imports
// `register` from './instance' and calls `register({ slice, slots, nativeRoutes })`
// at module scope, then add ONE side-effect import line below. That import is the
// only shared edit. AppReader reads `slots()`; the native route map reads
// `isNativeRoute` / `nativeRoutes()`. No slice bodies exist yet.
import { registry } from './instance';

// --- slice imports (one line each, e.g. `import './tracks';`) ---

export const { slots, nativeRoutes, isNativeRoute } = registry;
export { register, registry } from './instance';
export { createSlotRegistry } from './registry';
export type { NativeRouteEntry, SliceModule, SlotRegistry } from './types';
