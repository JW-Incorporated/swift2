// @swift2/worker — one-shot ingest -> cluster -> classify -> verify -> rank ->
// notify job (built out from WP2 onward). For WP0 it's a no-op that proves the
// worker workspace boots and can import the shared packages.
import { describeAspect } from '@swift2/core';
import { ASPECTS } from '@swift2/shared';

function main(): void {
  console.log(`swift2 worker: ready. Known aspects: ${ASPECTS.map(describeAspect).join(', ')}`);
}

main();
