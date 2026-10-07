import { describe, expect, it } from 'vitest';
import { eraIdSchema } from '@swift2/content';
import { ERAS } from './eras';

const HINT =
  'Adding an era needs BOTH changes: eraIdSchema (packages/content/src/schema.ts) and ERAS ' +
  '(packages/experience/src/eras.ts). See docs/mobile-release.md "Adding an era/enum/catalogue".';

describe('ERAS <-> eraIdSchema', () => {
  const eraIds = new Set<string>(ERAS.map((e) => e.id));
  const schemaIds = new Set<string>(eraIdSchema.options);

  it('every ERAS id is a valid eraIdSchema value', () => {
    const missing = [...eraIds].filter((id) => !schemaIds.has(id));
    expect(missing, `In ERAS but not eraIdSchema: ${missing.join(', ')}. ${HINT}`).toEqual([]);
  });

  it('every eraIdSchema value has an ERAS entry', () => {
    const missing = [...schemaIds].filter((id) => !eraIds.has(id));
    expect(missing, `In eraIdSchema but not ERAS: ${missing.join(', ')}. ${HINT}`).toEqual([]);
  });
});
