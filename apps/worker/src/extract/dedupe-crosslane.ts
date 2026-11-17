import type { DedupeCandidate } from './dedupe-gate-llm';
import { lexicalTop, sharedTokenCount } from './dedupe-shortlist';

export const MOMENT_WINDOW_DAYS = 14;
export const MAX_MOMENT_CANDIDATES = 3;
export const MAX_VIDEO_CANDIDATES = 2;
export const MIN_VIDEO_SHARED_TOKENS = 2;
export const MOMENT_ID_PREFIX = 'moment:';
export const VIDEO_ID_PREFIX = 'video:';

/** A vault moment as the wiring layer loads it (supabase/seed/content/**,
 * dates are YYYY-MM-DD). The worker has no loader for seed content today. */
export interface VaultMomentRef {
  id: string;
  eraId: string;
  date: string;
  title: string;
  summary?: string;
}

/** A vault video record (supabase/seed/videos/**). */
export interface VideoRef {
  videoId: string;
  eraId?: string;
  title: string;
}

export interface CrossLaneInput {
  moments?: readonly VaultMomentRef[];
  videos?: readonly VideoRef[];
}

export interface CrossLaneCandidate extends DedupeCandidate {
  lane: 'moment' | 'video';
  refId: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function withinWindow(date: string, observedOn: string, days: number): boolean {
  const a = Date.parse(date);
  const b = Date.parse(observedOn);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) <= days * DAY_MS;
}

/** Read-only cross-lane candidates for one item: same-era moments dated within
 * +/-14 days of observedOn, plus era videos, each lexically pre-filtered
 * (score > 0) and capped. Ids are prefixed so they never collide with rows. */
export function selectCrossLaneCandidates(
  subject: { headline: string; summary: string; observedOn?: string },
  eraId: string,
  input: CrossLaneInput,
): CrossLaneCandidate[] {
  const moments: CrossLaneCandidate[] = (input.moments ?? [])
    .filter((moment) => moment.eraId === eraId)
    .filter((moment) => !!subject.observedOn && withinWindow(moment.date, subject.observedOn, MOMENT_WINDOW_DAYS))
    .map((moment) => ({
      id: `${MOMENT_ID_PREFIX}${moment.id}`,
      headline: moment.title,
      summary: moment.summary ?? '',
      detail: '',
      observedOn: moment.date,
      lane: 'moment' as const,
      refId: moment.id,
    }));
  const videos: CrossLaneCandidate[] = (input.videos ?? [])
    .filter((video) => !video.eraId || video.eraId === eraId)
    .map((video) => ({
      id: `${VIDEO_ID_PREFIX}${video.videoId}`,
      headline: video.title,
      summary: '',
      detail: '',
      lane: 'video' as const,
      refId: video.videoId,
    }));
  return [
    ...lexicalTop(subject, moments, MAX_MOMENT_CANDIDATES, 0),
    ...lexicalTop(
      subject,
      videos.filter((video) => sharedTokenCount(`${subject.headline} ${subject.summary}`, video.headline) >= MIN_VIDEO_SHARED_TOKENS),
      MAX_VIDEO_CANDIDATES,
      0,
    ),
  ];
}
