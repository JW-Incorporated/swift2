// Maps the flat slot registry onto packages/ui ReaderSlots (convention documented in ./index.ts). Pure: the
// app-side pieces (controller, fallbacks) are passed in, so this stays free of React and store imports.
import type { ComponentType } from 'react';
import type { ReaderSlots } from '@swift2/ui/reader/shell/ReaderShell';

export type AppReaderParts = {
  /** Always-mounted app overlays (controller, overlay fallback); they render before every registered overlay. */
  overlays: readonly ComponentType[];
  fallback: ReaderSlots['fallback'];
};

export function buildReaderSlots(registered: Readonly<Record<string, unknown>>, app: AppReaderParts): ReaderSlots {
  const out: ReaderSlots = { surfaces: {}, overlays: [...app.overlays], fallback: app.fallback };
  const surfaces = out.surfaces as Record<string, ComponentType>;
  // Object key order is registration order (names are never integer-like), which sets overlay stacking.
  for (const [name, component] of Object.entries(registered)) {
    const c = component as ComponentType;
    if (name.startsWith('surface:')) surfaces[name.slice('surface:'.length)] = c;
    else if (name.startsWith('overlay:')) out.overlays.push(c);
    else if (name === 'footer') out.footer = c;
    else if (name === 'floating') out.floating = c;
    else throw new Error(`reader slots: unknown slot name "${name}" (surface:<mode>, overlay:<name>, footer, floating)`);
  }
  return out;
}
