import { describe, expect, it } from 'vitest';

import {
  isClownAnswer,
  isClownRetrievedItem,
  isClownStreamEvent,
  isDevicePrefsResponse,
  isDeviceRegisterResponse,
  isInboxEventRow,
  isInboxResponse,
  isInvestigationStep,
  isMoodApiResponse,
} from './index';

const item = {
  id: 'lore:1',
  headline: 'Masters buyback',
  detail: 'She bought them back.',
  status: 'confirmed',
  date: '2025-05-30',
  sources: [{ name: 'Tumblr', url: 'https://example.com' }],
};

const step = { tool: 'search', input: { query: 'masters' }, summary: '1 result' };

const answer = {
  kind: 'take',
  theoryName: null,
  segments: [{ role: 'stance', text: 'x' }],
  delulu: 3,
  sources: [item],
  investigation: [step],
};

describe('clown guards', () => {
  it('accepts a good answer, step, item and both stream events', () => {
    expect(isClownRetrievedItem(item)).toBe(true);
    expect(isInvestigationStep(step)).toBe(true);
    expect(isClownAnswer(answer)).toBe(true);
    expect(
      isClownAnswer({ ...answer, kind: 'fallback', delulu: null, theoryName: 'The Bow' }),
    ).toBe(true);
    expect(isClownStreamEvent({ type: 'investigation', step })).toBe(true);
    expect(isClownStreamEvent({ type: 'answer', answer })).toBe(true);
  });

  it('rejects wrong types and missing required fields', () => {
    expect(isClownAnswer(null)).toBe(false);
    expect(isClownAnswer([])).toBe(false);
    expect(isClownAnswer({ ...answer, kind: 'other' })).toBe(false);
    expect(isClownAnswer({ ...answer, delulu: '3' })).toBe(false);
    expect(isClownAnswer({ ...answer, theoryName: undefined })).toBe(false);
    expect(isClownAnswer({ ...answer, segments: [{ role: 'shout', text: 'x' }] })).toBe(false);
    expect(isClownAnswer({ ...answer, sources: [{ ...item, status: 'maybe' }] })).toBe(false);
    expect(isClownAnswer({ ...answer, investigation: undefined })).toBe(false);
    expect(isClownRetrievedItem({ ...item, detail: undefined })).toBe(false);
    expect(isClownRetrievedItem({ ...item, sources: [{ name: 'x' }] })).toBe(false);
    expect(isInvestigationStep({ ...step, input: 'q' })).toBe(false);
  });

  it('rejects malformed stream events', () => {
    expect(isClownStreamEvent({ type: 'investigation' })).toBe(false);
    expect(isClownStreamEvent({ type: 'investigation', step: { tool: 1 } })).toBe(false);
    expect(isClownStreamEvent({ type: 'answer', answer: { kind: 'take' } })).toBe(false);
    expect(isClownStreamEvent({ type: 'done' })).toBe(false);
    expect(isClownStreamEvent(answer)).toBe(false); // a bare answer is not an event envelope
    expect(isClownStreamEvent('answer')).toBe(false);
  });
});

describe('isMoodApiResponse', () => {
  it('accepts every shape the route emits', () => {
    expect(
      isMoodApiResponse({
        kind: 'matches',
        picks: [{ slug: 'a' }],
        source: 'chip',
        degraded: false,
      }),
    ).toBe(true);
    expect(
      isMoodApiResponse({
        kind: 'matches',
        picks: [],
        intro: 'hi',
        source: 'model',
        degraded: true,
      }),
    ).toBe(true);
    expect(isMoodApiResponse({ kind: 'matches', picks: [], source: 'chip' })).toBe(true); // honeypot
    expect(isMoodApiResponse({ kind: 'crisis', message: ['a', 'b'], source: 'crisis' })).toBe(true);
    expect(isMoodApiResponse({ kind: 'refusal', message: 'no', source: 'model' })).toBe(true);
    expect(isMoodApiResponse({ kind: 'unclear', message: 'say more', source: 'keyword' })).toBe(
      true,
    );
  });

  it('rejects wrong types and missing fields', () => {
    expect(isMoodApiResponse(undefined)).toBe(false);
    expect(isMoodApiResponse({ kind: 'matches', source: 'chip' })).toBe(false);
    expect(isMoodApiResponse({ kind: 'matches', picks: ['x'], source: 'chip' })).toBe(false);
    expect(isMoodApiResponse({ kind: 'matches', picks: [], source: 'chip', degraded: 'yes' })).toBe(
      false,
    );
    expect(isMoodApiResponse({ kind: 'crisis', message: 'one string', source: 'crisis' })).toBe(
      false,
    );
    expect(isMoodApiResponse({ kind: 'refusal', message: ['x'], source: 'model' })).toBe(false);
    expect(isMoodApiResponse({ kind: 'unclear', source: 'model' })).toBe(false);
    expect(isMoodApiResponse({ kind: 'unclear', message: 'x' })).toBe(false);
    expect(isMoodApiResponse({ kind: 'weird', message: 'x', source: 'model' })).toBe(false);
  });
});

describe('inbox guards', () => {
  const row = {
    id: 'e1',
    category: 'news',
    tier: 2,
    title: 't',
    body: 'b',
    deep_link: 'longlive://x',
    available_at: '2026-01-01T00:00:00Z',
  };

  it('accepts a good row and response', () => {
    expect(isInboxEventRow(row)).toBe(true);
    expect(isInboxResponse({ events: [row] })).toBe(true);
    expect(isInboxResponse({ events: [] })).toBe(true);
  });

  it('rejects camelCase rows, wrong types, and missing fields', () => {
    expect(isInboxEventRow({ ...row, tier: '2' })).toBe(false);
    expect(isInboxEventRow({ ...row, deep_link: undefined })).toBe(false);
    expect(isInboxEventRow({ ...row, deep_link: undefined, deepLink: 'x' })).toBe(false);
    expect(isInboxResponse({ events: [{ id: 'x' }] })).toBe(false);
    expect(isInboxResponse({ events: 'none' })).toBe(false);
    expect(isInboxResponse(null)).toBe(false);
  });
});

describe('device guards', () => {
  const settings = {
    masterEnabled: true,
    snoozeUntil: null,
    dailyCap: 3,
    quietStart: 22,
    quietEnd: 8,
    digestHour: 9,
  };

  it('accepts a register response and a prefs response', () => {
    expect(
      isDeviceRegisterResponse({
        ok: true,
        device: { id: 'd', platform: 'ios', tz: 'UTC', lastSeenAt: 'now' },
      }),
    ).toBe(true);
    expect(
      isDevicePrefsResponse({ settings, prefs: [{ category: 'song_drop', cadence: 'daily' }] }),
    ).toBe(true);
    expect(
      isDevicePrefsResponse({ settings: { ...settings, snoozeUntil: '2026-01-01' }, prefs: [] }),
    ).toBe(true);
  });

  it('rejects wrong types and missing fields', () => {
    expect(isDeviceRegisterResponse({ ok: false, device: {} })).toBe(false);
    expect(isDeviceRegisterResponse({ ok: true })).toBe(false);
    expect(
      isDeviceRegisterResponse({
        ok: true,
        device: { id: 'd', platform: 'ios', tz: null, lastSeenAt: 'x' },
      }),
    ).toBe(false);
    expect(
      isDevicePrefsResponse({ settings, prefs: [{ category: 'nope', cadence: 'daily' }] }),
    ).toBe(false);
    expect(
      isDevicePrefsResponse({ settings, prefs: [{ category: 'song_drop', cadence: 'hourly' }] }),
    ).toBe(false);
    expect(isDevicePrefsResponse({ settings: { ...settings, dailyCap: '3' }, prefs: [] })).toBe(
      false,
    );
    expect(
      isDevicePrefsResponse({ settings: { ...settings, masterEnabled: undefined }, prefs: [] }),
    ).toBe(false);
    expect(isDevicePrefsResponse({ settings, prefs: 'x' })).toBe(false);
  });
});
