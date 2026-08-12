/**
 * Mood Chat — Stage 3: the matcher.
 *
 * See docs/proposals/2026-07-19-mood-chat.md. This is the deterministic core
 * of the feature: a mood vector goes in, a ranked list of real songs comes
 * out. It is PURE and SYNCHRONOUS — no network, no model, no cost. The model
 * never touches this file: Stage 4's classify call turns a reader's words into
 * a `MoodQuery`, this ranks the precomputed catalogue, and only then does a
 * second model call write prose ABOUT the songs already chosen here. Because
 * the picks come from `SONG_MOODS` (a generated file guarded by
 * `check:generated`), the model structurally cannot invent a song that does
 * not exist — the same no-fabrication guarantee the rest of the Vault runs on.
 *
 * Scoring, in one sentence: a song's match is the reader-weighted geometric
 * mean of its scores on the mood axes the reader actually asserted (geometric
 * so an "and" query wants a song that is BOTH, not just strong on one), gently
 * nudged by how close its energy/valence sit to what the reader asked for. An
 * era-diversity pass then keeps a single era from monopolising the results
 * unless the mood genuinely points there.
 */

import { MOOD_AXES, type EraId, type MoodAxes, type MoodAxis, type SongMood } from './types';
import { SONG_MOODS } from './song-moods.generated';

/**
 * What the reader wants, as the classifier (Stage 4) derives it — never raw
 * text. `moods` is PARTIAL on purpose: the classifier asserts only the axes a
 * reader's words actually evoke, and an unmentioned axis means "don't care"
 * (weight 0), not "must be absent". `energy`/`valence` are optional targets
 * that refine the ordering when present and are ignored when not.
 */
export interface MoodQuery {
  /** Desired presence of each mood axis, 0..1. Only asserted axes carry weight. */
  moods: Partial<MoodAxes>;
  /** Desired sonic energy, 0 (still) .. 1 (driving). Optional. */
  energy?: number;
  /** Desired emotional valence, 0 (sad) .. 1 (happy). Optional. */
  valence?: number;
  /**
   * Set ONLY when the reader's words carry an explicit bereavement/death signal
   * (a death, grief, a funeral, "lost my dad" — see `hasBereavementSignal` in
   * mood-keywords.ts). It gates the grief-canon songs ({@link BEREAVEMENT_SLUGS}):
   * they are match-eligible ONLY when this is true. Left unset for ordinary
   * sadness, stress, numbness, and every chip — so a reader at their lowest is
   * never handed a song about a dead child (#1984). This is a safety property,
   * not a ranking nicety: the gate is exclusion, not a downweight.
   */
  bereavement?: boolean;
}

/**
 * The grief canon (#1984): songs written from inside a real bereavement — a
 * death, a terminal illness, a loss to grieve. They are scored max-`heartbreak`
 * because that is honestly what they are, which is exactly why they used to
 * surface for "I feel numb" and "stressed about work": ordinary sadness shares
 * the heartbreak axis with genuine grief. They must NOT appear for ordinary
 * sadness/stress/numbness — only when the reader's words carry an explicit
 * bereavement signal (see {@link MoodQuery.bereavement}).
 *
 * Curated by slug rather than a mood axis on purpose: a full "grief" axis would
 * require re-scoring all 162 songs, and the distinction we need is editorial
 * ("is this song ABOUT a death?"), not sonic. Kept here, beside the matcher that
 * gates on it, and asserted against the live catalogue by the tests so it can't
 * silently drift. Includes the currently-unscored grief entries (marjorie,
 * bigger-than-the-whole-sky) so the gate already holds the day they're scored.
 */
export const BEREAVEMENT_SLUGS: ReadonlySet<string> = new Set([
  'ronan', // a mother's eulogy for her son, dead just before turning four
  'soon-youll-get-better', // written amid her mother's cancer
  'epiphany', // her grandfather's war dead and a 2020 hospital ward
  'marjorie', // her late grandmother (unscored today)
  'bigger-than-the-whole-sky', // an elegy for a loss (unscored today)
]);

/** True when a catalogue entry is one of the grief-canon songs (#1984). */
export function isBereavementSong(song: Pick<SongMood, 'slug'>): boolean {
  return BEREAVEMENT_SLUGS.has(song.slug);
}

/** One ranked pick returned by {@link matchMoods}. */
export interface MoodMatch {
  slug: string;
  title: string;
  eraId: EraId;
  /** The track's oEmbed-verified YouTube id, when it has one (UI omits the embed otherwise). */
  youtubeId?: string;
  oneLiner?: string;
  useCase?: string[];
  /**
   * The raw match quality, 0..1 — the reader-weighted mood average blended
   * with energy/valence proximity. This is BEFORE the era-diversity pass, so
   * it reflects how well the song itself fits the query; the returned list is
   * ordered by the diversity-adjusted score, so a slightly lower-`score` song
   * can sit above a higher one when it broadens the era spread.
   */
  score: number;
}

/** Options for {@link matchMoods}. */
export interface MatchOptions {
  /** How many songs to return. Default 5. */
  limit?: number;
  /**
   * The catalogue to rank. Defaults to the generated `SONG_MOODS`; injectable
   * so tests (and future callers) can rank a fixed slice deterministically.
   */
  catalogue?: readonly SongMood[];
  /**
   * How hard to spread results across eras, 0..1. 0 disables the diversity
   * pass (pure match-quality order); 1 penalises repeats hardest. Each
   * additional pick from an already-represented era is multiplied by
   * `(1 - diversity)` per prior same-era pick, so a genuinely dominant era
   * still wins when its match gap exceeds the penalty. Default 0.2.
   */
  diversity?: number;
}

/** A catalogue entry that has been scored — the only kind the matcher ranks. */
type ScoredSong = SongMood & {
  moods: MoodAxes;
  energy: number;
  valence: number;
};

/**
 * True when a catalogue entry carries a full mood score. Unscored placeholders
 * (Stage 1 stubs a track before Stage 2 scores it) are skipped, never matched.
 */
export function isScored(song: SongMood): song is ScoredSong {
  if (!song.moods || typeof song.energy !== 'number' || typeof song.valence !== 'number') {
    return false;
  }
  return MOOD_AXES.every((axis) => typeof song.moods![axis] === 'number');
}

/** The match-eligible slice of a catalogue, in stable input order. */
export function scoredSongs(catalogue: readonly SongMood[] = SONG_MOODS): ScoredSong[] {
  return catalogue.filter(isScored);
}

/** Clamp to the 0..1 range the axes/energy/valence all live in. */
function unit(n: number): number {
  if (Number.isNaN(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * How much energy/valence proximity counts relative to the mood term when the
 * reader supplies a target. Kept below 1 so mood stays the primary signal and
 * energy/valence only refine the ordering / break ties.
 */
const ENERGY_VALENCE_WEIGHT = 0.5;

/**
 * Floor applied to a song's axis score inside the geometric mean. A song that
 * scores an exact 0 on a weakly-wanted axis should be gently penalised, not
 * annihilated — without this, one 0 zeroes the whole product regardless of how
 * lightly the reader weighted that axis. Small enough that a strongly-asserted
 * missing axis still tanks the match (the "and" stays meaningful).
 */
const AXIS_FLOOR = 0.02;

/**
 * The raw match quality of one song against a query, 0..1.
 *
 * The mood term is the reader-weighted GEOMETRIC mean of the song's scores on
 * the asserted axes: `exp(Σ w_a·ln s_a / Σ w_a)`. Geometric, not arithmetic,
 * because the query is an "and" — "heartbroken AND angry" wants a song that is
 * BOTH, and an arithmetic average would let a purely-heartbroken song (high on
 * one axis, zero on the other) outrank a song that genuinely carries both. The
 * geometric mean rewards balance across the asserted axes and is immune to how
 * MANY were asserted. Energy and valence, when present, fold in AFTER as
 * arithmetic proximity terms (`1 − |song − target|`) with a sub-unit weight so
 * they nudge rather than dominate. A query that asserts nothing scores 0.
 */
export function scoreSong(query: MoodQuery, song: ScoredSong): number {
  let logSum = 0;
  let weight = 0;
  for (const axis of MOOD_AXES) {
    const w = query.moods[axis as MoodAxis];
    if (w == null) continue;
    const cw = unit(w);
    if (cw === 0) continue;
    logSum += cw * Math.log(Math.max(unit(song.moods[axis]), AXIS_FLOOR));
    weight += cw;
  }

  let total = 0;
  let denom = 0;
  if (weight > 0) {
    total += Math.exp(logSum / weight);
    denom += 1;
  }
  if (query.energy != null) {
    total += (1 - Math.abs(song.energy - unit(query.energy))) * ENERGY_VALENCE_WEIGHT;
    denom += ENERGY_VALENCE_WEIGHT;
  }
  if (query.valence != null) {
    total += (1 - Math.abs(song.valence - unit(query.valence))) * ENERGY_VALENCE_WEIGHT;
    denom += ENERGY_VALENCE_WEIGHT;
  }
  return denom === 0 ? 0 : total / denom;
}

/**
 * Rank the catalogue against a mood query and return the top matches.
 *
 * Pure and synchronous. Ties in raw score are broken by slug so the output is
 * fully deterministic (the same query always yields the same order — a
 * property the unit tests rely on). The era-diversity pass runs greedily: each
 * round it re-scores remaining candidates with a penalty for eras already
 * picked and takes the current best, so a much-stronger song still wins its
 * slot while merely-comparable songs make room for other eras.
 */
export function matchMoods(query: MoodQuery, options: MatchOptions = {}): MoodMatch[] {
  const limit = Math.max(0, options.limit ?? 5);
  const diversity = unit(options.diversity ?? 0.2);
  const catalogue = options.catalogue ?? SONG_MOODS;
  if (limit === 0) return [];

  // Grief-canon gate (#1984): the bereavement songs are eligible ONLY when the
  // reader's words carried an explicit bereavement signal. This runs BEFORE
  // scoring so a grief song can't win a slot for ordinary sadness no matter how
  // high its heartbreak score — the safety property is exclusion, not a nudge.
  const allowBereavement = query.bereavement === true;

  const ranked = scoredSongs(catalogue)
    .filter((song) => allowBereavement || !BEREAVEMENT_SLUGS.has(song.slug))
    .map((song) => ({ song, score: scoreSong(query, song) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.song.slug.localeCompare(b.song.slug));

  const picks: MoodMatch[] = [];
  const perEra = new Map<EraId, number>();
  const remaining = [...ranked];

  while (picks.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestAdjusted = -1;
    for (let i = 0; i < remaining.length; i++) {
      const { song, score } = remaining[i];
      const already = perEra.get(song.eraId) ?? 0;
      const adjusted = score * (1 - diversity) ** already;
      // Ties broken by the pre-sorted order (raw score, then slug) — the first
      // candidate that reaches a given adjusted score keeps it.
      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIndex = i;
      }
    }
    const chosen = remaining.splice(bestIndex, 1)[0];
    perEra.set(chosen.song.eraId, (perEra.get(chosen.song.eraId) ?? 0) + 1);
    picks.push({
      slug: chosen.song.slug,
      title: chosen.song.title,
      eraId: chosen.song.eraId,
      youtubeId: chosen.song.youtubeId,
      oneLiner: chosen.song.oneLiner,
      useCase: chosen.song.useCase,
      score: chosen.score,
    });
  }

  return picks;
}
