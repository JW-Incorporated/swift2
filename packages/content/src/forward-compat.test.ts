import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { pruneUnknownEnumValues } from './forward-compat';

const Kind = z.enum(['a', 'b']);

describe('pruneUnknownEnumValues', () => {
  it('returns the data untouched when it already parses', () => {
    expect(pruneUnknownEnumValues(z.array(Kind), ['a'])).toEqual({
      kind: 'ok',
      data: ['a'],
      removed: 0,
    });
  });

  it('removes several unknown primitives from one array without index drift', () => {
    const r = pruneUnknownEnumValues(z.array(Kind), ['x', 'a', 'y', 'b', 'z']);
    expect(r).toEqual({ kind: 'ok', data: ['a', 'b'], removed: 3 });
  });

  it('removes the nearest enclosing array element for an unknown field value', () => {
    const schema = z.object({ items: z.array(z.object({ k: Kind, n: z.number() })) });
    const r = pruneUnknownEnumValues(schema, {
      items: [
        { k: 'a', n: 1 },
        { k: 'new', n: 2 },
      ],
    });
    expect(r).toEqual({ kind: 'ok', data: { items: [{ k: 'a', n: 1 }] }, removed: 1 });
  });

  it('asks to drop the whole file when no array encloses the unknown value', () => {
    const r = pruneUnknownEnumValues(z.object({ eraId: Kind }), { eraId: 'new' });
    expect(r.kind).toBe('drop-file');
  });

  it('reports any non-invalid_value issue as invalid', () => {
    const r = pruneUnknownEnumValues(z.object({ k: Kind, n: z.number() }), { k: 'new', n: 'x' });
    expect(r.kind).toBe('invalid');
  });

  it('reports invalid when pruning empties an array that must be non-empty', () => {
    const r = pruneUnknownEnumValues(z.array(Kind).min(1), ['new']);
    expect(r.kind).toBe('invalid');
  });
});
