// @swift2/core — reader-side data access over Supabase. Portable (no view
// code). For WP0 this only proves the monorepo wiring: it imports from
// @swift2/shared to confirm cross-package resolution works.
import type { Aspect } from '@swift2/shared';

export function describeAspect(aspect: Aspect): string {
  return `aspect:${aspect}`;
}
