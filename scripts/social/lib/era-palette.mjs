// Single source of truth for era colors is apps/web/lib/longlive/eras.ts (the
// site's own theme data) — imported directly rather than duplicated here, so
// a palette tweak on the site is automatically picked up by card rendering.
// This file (and anything that imports it) must run under `tsx`, since
// eras.ts is TypeScript and plain `node` can't resolve it.
import { ERAS, getEra } from '../../../apps/web/lib/longlive/eras.ts';

// Brand default for cards with no specific era (e.g. the Mood feature, or a
// generic quote card) — the same warm-brown/gold pairing opengraph-image.tsx
// uses for the whole-site OG card, so un-era'd cards still read as "Long
// Live" at a glance.
const BRAND_DEFAULT = {
  id: null,
  name: null,
  bg: '#2a1405',
  surface: '#3a2210',
  surface2: '#452a15',
  ink: '#ffe9d0',
  inkSoft: '#e2b587',
  line: '#54381f',
  accent: '#ffd45e',
  accent2: '#e0a83c',
  glow: 'rgba(255, 212, 94, 0.30)',
  font: 'serif',
};

export function listEraIds() {
  return ERAS.map((e) => e.id);
}

/** Resolve an era id (or null/undefined) to a flat color palette for cards.
 * eras.ts's own getEra() silently falls back to the newest era on an unknown
 * id (matching the site's defensive-by-design pattern) — a typo'd era id
 * from the CLI deserves a loud failure instead, so id membership is checked
 * here first. */
export function eraPalette(eraId) {
  if (!eraId) return BRAND_DEFAULT;
  if (!listEraIds().includes(eraId)) {
    throw new Error(`Unknown era id "${eraId}". Valid ids: ${listEraIds().join(', ')}`);
  }
  const era = getEra(eraId);
  return { id: era.id, name: era.shortName ?? era.name, ...era.theme };
}
