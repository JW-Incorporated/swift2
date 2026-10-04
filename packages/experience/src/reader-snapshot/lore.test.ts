// The lore extension domain: optional in the bundle, never throws on an old cached one.
import { describe, expect, it } from 'vitest';
import { extensionsFromBundle, inputsFromBundle, type BundleLike } from './sources';

const bundle = (files: Record<string, unknown>): BundleLike => ({ manifest: { bundleVersion: 'v' }, files });

describe('lore from a bundle', () => {
  it('reads clownbotLore.lore', () => {
    const lore = [{ id: 'a' }, { id: 'b' }];
    expect(extensionsFromBundle(bundle({ clownbotLore: { lore } })).lore).toEqual(lore);
  });

  it.each([
    ['missing', {}],
    ['null', { clownbotLore: null }],
    ['not an object', { clownbotLore: 'x' }],
    ['lore not an array', { clownbotLore: { lore: 'x' } }],
    ['no lore key', { clownbotLore: {} }],
  ])('%s gives [] and does not throw', (_name, files) => {
    expect(inputsFromBundle(bundle(files)).lore).toEqual([]);
    expect(extensionsFromBundle(bundle(files)).lore).toEqual([]);
  });
});
