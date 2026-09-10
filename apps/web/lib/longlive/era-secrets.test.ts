import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ERA_SECRETS_RAW } from './era-secrets.generated';
import {
  eraSecretsForEra,
  epochDay,
  dailyEraSecret,
  resolveEraSecretLink,
  ERAS,
  songTargetOf,
} from '@swift2/experience';
import { getContentItem } from './content';
import './era-secrets'; // wires the real generated data/tracks/content providers

/**
 * OS-014b-4 (see era-secrets.ts's header for the full Fable-ruling
 * reasoning): `ERA_SECRETS_RAW` keeps importing the generated literal
 * rather than reading the published bundle at runtime, because this module
 * is reachable from a `'use client'` component. Per the same lesson
 * OS-014b-5 hit on clownbot-lore.ts (a live CI ENOENT: this suite runs
 * BEFORE apps/web's `prebuild` publishes the bundle to disk, so asserting
 * against the actual published `era-secrets.json` file here is not
 * possible), this test instead proves byte-identity by construction:
 * `scripts/lib/dump-longlive-sources.ts` (the bundle builder's data
 * source) imports `eraSecretsForEra` from THIS module and calls it per
 * era to assemble the bundle's `era-secrets.json` — i.e. the published
 * bundle's era-secrets data literally comes from calling this file's own
 * exported function, so it cannot drift from `ERA_SECRETS_RAW` here.
 */
describe('bundle-sourced era secrets stay wired into the published bundle build (OS-014b-4)', () => {
  it('scripts/lib/dump-longlive-sources.ts sources eraSecrets from this module\'s eraSecretsForEra', () => {
    const dumpScript = readFileSync(
      resolve(import.meta.dirname, '../../../../scripts/lib/dump-longlive-sources.ts'),
      'utf8',
    );
    expect(dumpScript).toContain(
      "import { eraSecretsForEra } from '../../apps/web/lib/longlive/era-secrets'",
    );
    expect(dumpScript).toContain('eraSecrets: eraSecretsForEra(era.id)');
  });

  it('eraSecretsForEra(eraId) returns exactly ERA_SECRETS_RAW[eraId] (or [])', () => {
    for (const era of ERAS) {
      const expected = ERA_SECRETS_RAW[era.id] ?? [];
      expect(eraSecretsForEra(era.id)).toEqual(expected);
    }
  });
});

// The Era Secret card (#688) is static, sourced, and deterministic. These
// guards protect the three things the UI relies on: the generated data is
// renderable, the daily rotation is deterministic + stable, and deeper links
// never render dead.
//
// `eraSecretsForEra`/`epochDay`/`dailyEraSecret`/`resolveEraSecretLink`
// moved into `packages/experience` in OS-023
// (docs/specs/2026-09-05-one-source-three-surfaces.md §6); this test stays
// in `apps/web` because it drives them off the real generated
// `ERA_SECRETS_RAW`/`songTargetOf`/`getContentItem` (content-loading is
// OS-013/OS-014 scope), wired in via the `./era-secrets` import above.
describe('era-secrets.generated.ts invariants', () => {
  const eraIds = new Set(ERAS.map((e) => e.id));

  it('only contains known era ids', () => {
    for (const key of Object.keys(ERA_SECRETS_RAW)) {
      expect(eraIds, `unknown era id ${key}`).toContain(key);
    }
  });

  it('every secret is renderable and SOURCED (no unsourced fact ships)', () => {
    for (const secrets of Object.values(ERA_SECRETS_RAW)) {
      for (const s of secrets) {
        expect(s.slug.trim()).not.toBe('');
        expect(s.title.trim()).not.toBe('');
        expect(s.secret.trim()).not.toBe('');
        expect(s.sources.length).toBeGreaterThan(0);
        for (const src of s.sources) {
          expect(src.name.trim()).not.toBe('');
          expect(src.url).toMatch(/^https?:\/\//);
        }
        if (s.deeperLink != null) expect(s.deeperLink).toMatch(/^(song|moment|egg):.+/);
      }
    }
  });
});

describe('daily rotation', () => {
  it('epochDay is timezone-stable and monotonic across a day', () => {
    expect(epochDay('2026-08-11')).toBe(epochDay('2026-08-11'));
    expect(epochDay('2026-08-12')).toBe(epochDay('2026-08-11') + 1);
  });

  it('dailyEraSecret is deterministic for a given day and drawn from the pool', () => {
    for (const eraId of Object.keys(ERA_SECRETS_RAW) as (keyof typeof ERA_SECRETS_RAW)[]) {
      const pool = eraSecretsForEra(eraId);
      const pick = dailyEraSecret(eraId, '2026-08-11');
      expect(pick).toBe(dailyEraSecret(eraId, '2026-08-11'));
      expect(pool).toContain(pick);
    }
  });

  it('rotates across consecutive days for a multi-secret pool', () => {
    const eraId = (Object.keys(ERA_SECRETS_RAW) as (keyof typeof ERA_SECRETS_RAW)[]).find(
      (e) => eraSecretsForEra(e).length > 1,
    )!;
    const picks = new Set(
      Array.from({ length: eraSecretsForEra(eraId).length }, (_, i) => {
        const day = `2026-08-${String(11 + i).padStart(2, '0')}`;
        return dailyEraSecret(eraId, day)!.slug;
      }),
    );
    // A full cycle of days visits every secret in the pool.
    expect(picks.size).toBe(eraSecretsForEra(eraId).length);
  });

  it('returns null for an era with no pool', () => {
    // tloas has no seed file yet (the sourcing residue) — must degrade, not throw.
    expect(dailyEraSecret('tloas', '2026-08-11')).toBeNull();
  });
});

describe('resolveEraSecretLink', () => {
  it('resolves song: and moment: links, and drops egg:/unknown (no dead links)', () => {
    // Drive off real data so the resolver stays honest against the vault.
    let checkedSong = false;
    let checkedMoment = false;
    for (const secrets of Object.values(ERA_SECRETS_RAW)) {
      for (const s of secrets) {
        const link = resolveEraSecretLink(s.deeperLink);
        if (!s.deeperLink) {
          expect(link).toBeNull();
        } else if (s.deeperLink.startsWith('song:') && songTargetOf(s.deeperLink)) {
          expect(link?.kind).toBe('song');
          checkedSong = true;
        } else if (s.deeperLink.startsWith('moment:') && getContentItem(s.deeperLink.slice(7))) {
          expect(link?.kind).toBe('moment');
          checkedMoment = true;
        } else {
          // egg:, or a song/moment target that isn't in the vault → no link.
          expect(link).toBeNull();
        }
      }
    }
    // Sanity: the deeper-link wiring actually resolves against the real vault
    // (at least one kind), not just in theory.
    expect(checkedSong || checkedMoment).toBe(true);
  });

  it('returns null for an absent link', () => {
    expect(resolveEraSecretLink(undefined)).toBeNull();
    expect(resolveEraSecretLink('egg:whatever')).toBeNull();
  });
});
