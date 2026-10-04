// The lore extension domain: optional in the bundle, all-or-nothing, never throws on an old or bad one.
import { describe, expect, it } from 'vitest';
import { extensionsFromBundle, inputsFromBundle, type BundleLike } from './sources';

const bundle = (files: Record<string, unknown>): BundleLike => ({
  manifest: { bundleVersion: 'v' },
  files,
});

const item = (over: Record<string, unknown> = {}) => ({
  id: 'a',
  status: 'rumor',
  date: '2026-09-25',
  lastCheckedOn: '2026-09-26',
  headline: 'h',
  detail: 'd',
  sources: [{ name: 'n', url: 'https://example.com/x' }],
  ...over,
});
const withLore = (...lore: unknown[]) => bundle({ clownbotLore: { lore } });

describe('lore from a bundle', () => {
  it('reads clownbotLore.lore', () => {
    const lore = [item(), item({ id: 'b', status: 'debunked' })];
    expect(extensionsFromBundle(withLore(...lore)).lore).toEqual(lore);
  });

  it.each([
    ['missing (old cached bundle)', {}],
    ['null', { clownbotLore: null }],
    ['not an object', { clownbotLore: 'x' }],
    ['lore not an array', { clownbotLore: { lore: 'x' } }],
    ['no lore key', { clownbotLore: {} }],
  ])('%s gives [] and does not throw', (_name, files) => {
    expect(inputsFromBundle(bundle(files)).lore).toEqual([]);
    expect(extensionsFromBundle(bundle(files)).lore).toEqual([]);
  });

  it.each([
    ['a null item', null],
    ['a missing headline', item({ headline: undefined })],
    ['an invalid status', item({ status: 'maybe' })],
    ['no sources', item({ sources: [] })],
    ['a bad source url', item({ sources: [{ name: 'n', url: 'not a url' }] })],
    ['a non-http source url', item({ sources: [{ name: 'n', url: 'javascript:alert(1)' }] })],
    ['a bad date', item({ date: 'yesterday' })],
    ['a bad lastCheckedOn', item({ lastCheckedOn: '09/26/2026' })],
  ])('one invalid item (%s) empties the whole board', (_name, bad) => {
    expect(extensionsFromBundle(withLore(item(), bad)).lore).toEqual([]);
  });
});
