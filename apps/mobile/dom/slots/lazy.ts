// Surface modules that are not on the first screen are evaluated at their first RENDER, not at slot-module load.
// The shell renders `slots.surfaces[mode]` only while that mode is active, so the first render of a lazy surface IS
// the first frame of its open: the require is synchronous (no placeholder, no Suspense, no async chunk, which
// Expo's DOM export cannot serialize). The slot contract is unchanged: the registered value is still a component.
import { createElement, type ComponentType } from 'react';

export type LazySlot<P> = ComponentType<P> & { isLoaded: () => boolean };

export function lazySlot<P extends object>(load: () => ComponentType<P>): LazySlot<P> {
  let loaded: ComponentType<P> | null = null;
  const Lazy = (props: P) => {
    loaded ??= load();
    return createElement(loaded, props);
  };
  Lazy.isLoaded = () => loaded !== null;
  return Lazy;
}
