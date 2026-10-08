// symbol_lexicon builder for the knowledge engine (Stage 4, PLAN.md).
//
// There is no canonical "symbols"/"motifs" field anywhere in the Vault seed
// schema — checked directly: `Theory` (packages/shared/src/vault-types.ts)
// has no `symbols` field, `MonthItem.tags` is a 5-value ContentTag enum
// (Music/Fashion/Tour/Relationship/Lore, not lore symbols), and
// `VideoWork.symbolism` is unstructured free prose. The closest REAL,
// STRUCTURED, recurring vocabulary in the actual authored content is
// `TrackNote.themes: string[]` (supabase/seed/tracks/<era>.mjs — editorial
// theme tags written per song, ~660 total across the corpus). This module
// builds symbol_lexicon entries only from themes that recur (>=2 uses)
// across the real corpus, so every key is grounded in content someone
// actually wrote — never invented to hit a target count.

export const THEME_MIN_RECURRENCE = 2;

function slugifyTheme(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * @param {Record<string, Array<{ facts?: { themes?: string[] } }>>} byEraTracks
 *   The normalized `{ [eraId]: TrackNote[] }` map `buildTrackGuide` returns —
 *   each TrackNote's `facts.themes` survives normalization (factsFrom).
 * @returns {{key:string,label:string,aliases:string[],category:string,linked_eras:string[],note:string}[]}
 */
export function buildSymbolLexicon(byEraTracks) {
  const byKey = new Map();
  for (const [eraId, tracks] of Object.entries(byEraTracks)) {
    for (const t of tracks) {
      for (const raw of t.facts?.themes ?? []) {
        const label = raw.trim();
        const key = slugifyTheme(label);
        if (!key) continue;
        const rec = byKey.get(key) ?? { key, label, count: 0, eras: new Set() };
        rec.count += 1;
        rec.eras.add(eraId);
        byKey.set(key, rec);
      }
    }
  }
  return [...byKey.values()]
    .filter((r) => r.count >= THEME_MIN_RECURRENCE)
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .map((r) => ({
      key: r.key,
      label: r.label,
      aliases: [],
      category: 'theme',
      linked_eras: [...r.eras].sort(),
      note: `Recurring song theme across ${r.count} track note(s) in supabase/seed/tracks — auto-derived from TrackNote.themes, not hand-curated.`,
    }));
}

/**
 * Which symbol_lexicon keys are literally present in a doc's text
 * (case-insensitive substring match on the symbol's label). Used to tag
 * `knowledge_doc.symbols` from real text rather than guessing.
 */
export function symbolsIn(text, lexicon) {
  if (!text) return [];
  const hay = text.toLowerCase();
  const hits = [];
  for (const s of lexicon) {
    if (hay.includes(s.label.toLowerCase())) hits.push(s.key);
  }
  return hits;
}
