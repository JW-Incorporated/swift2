// Producer-side notification links, in the vocabulary the site's deep-link
// reader (packages/experience deepLink.ts: `song`, `mode`, ...) understands.
// Producers must emit these, never `?current=<x>` or `?song=<lyrics db slug>`,
// which the site drops to the front door.
export const SITE_ORIGIN = 'https://www.longlivets.com';

/** Front door: for destinations with no dedicated site deep link (e.g. the countdown banner lives on the landing). */
export const frontDoorLink = (): string => `${SITE_ORIGIN}/`;

/** Threads mode hosts the live-theory ("eggs") board. Live theories carry no era, so `?theories=<era>` cannot apply. */
export const theoriesBoardLink = (): string => `${SITE_ORIGIN}/?mode=threads`;

export const merchLink = (): string => `${SITE_ORIGIN}/?mode=merch`;

/** `trackKey` is the composite `${eraId}::${n}::${title}` (resolveTrackKey's shape), not a DB slug. */
export const songLink = (trackKey: string): string => `${SITE_ORIGIN}/?song=${encodeURIComponent(trackKey)}`;
