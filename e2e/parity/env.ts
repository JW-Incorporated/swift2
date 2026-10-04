import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANONICAL_ORIGIN } from '../../apps/web/lib/canonical-origin';
import type { TestInfo } from '@playwright/test';

export const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
export const ERA_ART_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN || CANONICAL_ORIGIN;
export const FIXED_TIME = new Date('2026-01-01T12:00:00Z');
const A_PORT = Number(process.env.PARITY_A_PORT ?? 4174);
const B_PORT = Number(process.env.PARITY_PORT ?? 4173);

export type Side = 'a' | 'b';
export interface Fixture {
  bundleVersion: string;
  hash: string;
  itemId: string;
}
export const fixture: Fixture = JSON.parse(
  readFileSync(resolve(repo, 'scripts/parity/fixture/fixture.json'), 'utf-8'),
);

/** Side a is the Next web build; side b is the app's DOM entry exported for a browser. */
export const BASE: Record<Side, string> = {
  a: `http://127.0.0.1:${A_PORT}`,
  b: `http://127.0.0.1:${B_PORT}`,
};

/** Simulated native safe-area insets per project (top, right, bottom, left); side b only. */
const REAL_INSETS: Record<string, string> = {
  'pixel-7': '24,0,48,0',
  'iphone-15': '59,0,34,0',
  'ipad-pro-11-portrait': '24,0,20,0',
  'ipad-pro-11-landscape': '24,0,20,0',
};
export const realInsets = (testInfo: TestInfo): string => REAL_INSETS[testInfo.project.name] ?? '0,0,0,0';
