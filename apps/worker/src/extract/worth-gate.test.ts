import { describe, expect, it } from 'vitest';
import { worthAPost, type WorthSource } from './worth-gate';

const fan = (url: string): WorthSource => ({ url, tier: 'fan' });

describe('worthAPost', () => {
  it('passes on an official or established source', () => {
    expect(worthAPost({ sources: [{ url: 'https://a.com/1', tier: 'established' }], category: 'lore', statusHint: 'rumor' }).ok).toBe(true);
    expect(worthAPost({ sources: [{ url: 'https://taylorswift.com/1', tier: 'official' }], category: 'lore', statusHint: 'rumor' }).ok).toBe(true);
  });

  it('passes on two distinct hosts, ignoring www and bad urls', () => {
    expect(worthAPost({ sources: [fan('https://a.com/1'), fan('https://b.com/2')], category: 'lore', statusHint: 'reported' }).ok).toBe(true);
    expect(worthAPost({ sources: [fan('https://a.com/1'), fan('https://www.a.com/2')], category: 'lore', statusHint: 'reported' }).ok).toBe(false);
    expect(worthAPost({ sources: [fan('https://a.com/1'), fan('not a url')], category: 'lore', statusHint: 'reported' }).ok).toBe(false);
  });

  it('passes a confirmed release, tour or sighting from one weak source', () => {
    for (const category of ['release', 'tour', 'sighting'] as const) {
      expect(worthAPost({ sources: [fan('https://a.com/1')], category, statusHint: 'confirmed' }).ok).toBe(true);
    }
  });

  it('holds an unconfirmed or other-category single weak source', () => {
    const below = { ok: false, reason: 'below_tier_floor' };
    expect(worthAPost({ sources: [fan('https://a.com/1')], category: 'release', statusHint: 'reported' })).toEqual(below);
    expect(worthAPost({ sources: [fan('https://a.com/1')], category: 'fashion', statusHint: 'confirmed' })).toEqual(below);
    expect(worthAPost({ sources: [], category: 'tour', statusHint: 'confirmed' }).ok).toBe(true);
    expect(worthAPost({ sources: [], category: 'lore', statusHint: 'rumor' })).toEqual(below);
  });
});
