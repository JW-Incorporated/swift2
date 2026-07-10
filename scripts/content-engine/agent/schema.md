# CIE agent findings — output contract

Every agent review pass writes a JSON **array of Finding objects** to
`scripts/content-engine/.findings/agent-<name>.json`. The engine ingests it
(`run.mjs ingest`) and files issues. Emit ONLY real findings — an empty array
`[]` is the correct output for clean content. Never invent problems to fill the
list; a false "error" ticket is worse than none.

## Finding object
```jsonc
{
  "checker": "fact.source-grounding",   // see the checker ids below — use exactly one
  "severity": "P0" | "P1" | "P2" | "P3",
  "title": "one-line summary (becomes the issue title, <200 chars)",
  "itemRef": {
    "type": "moment|track|theory|video|tour|release|image",
    "file": "supabase/seed/content/1989.mjs",   // from the input record
    "era": "1989",
    "key": "1989|2014|10|Shake It Off …",        // the record's key from the input
    "field": "context"                            // which text field, if applicable
  },
  "excerpt": "the exact sentence/URL at issue (<800 chars)",
  "evidence": "what you actually verified — what the source said vs. the claim, the search result, what you saw in the image (<2000 chars)",
  "suggestedFix": "the concrete correction a human should make",
  "confidence": 0.0,   // 0..1. >=0.5 files as an issue; <0.5 is a 'review' note. Be honest.
  "escalate": false,   // safety P0s ONLY (sexualization/illegal) → true
  "sources": ["https://…"]   // URLs you consulted (WebFetch/WebSearch)
}
```

## Checker ids (use the right one)
- `fact.unconfirmed` — content asserts an event happened or a public statement was made, but it cannot be independently confirmed to have occurred (possibly hallucinated), OR the cited source is about something narrower/different than the claim (e.g. source is about a *proposal*, prose claims a *wedding* recap). The engine's #1 blind spot — reason from ground truth, not just source-matching.
- `fact.source-grounding` — a claim is not supported / is contradicted by its cited source, or the source is dead.
- `fact.cross-check` — high-visibility/latest-news claim that independent sources disagree with.
- `fact.slop` — casual/imprecise wording, an unsupported superlative, tabloid tone, or a rumor stated as fact.
- `safety.sexualization` — over-sexualizes Taylor (nudes/intimate-image rumors, body-focused tabloid speculation). P0 + `escalate:true`.
- `safety.illegal` — content that doesn't belong on the site (sexualized-minor context, other clearly-unwanted material). P0 + `escalate:true`. **Do NOT attempt to analyze suspected CSAM imagery — flag the reference and escalate.**
- `image.relevance` — the image does not depict what its caption/moment claims.
- `image.quality` — junk image a human eye rejects (watermark-only, collage, screenshot, wrong crop, blurry) that the deterministic size check misses.
- `image.safety` — NSFW/inappropriate imagery. P0 + `escalate:true`.

## Severity guide
- **P0** — safety/legal/credibility on a marquee item (any `safety.*`; a flat-wrong fact on a high-visibility moment).
- **P1** — a real factual error or unsupported claim on a normal item; a clearly-wrong image on a visible moment.
- **P2** — imprecise/soft wording, weak sourcing, a mediocre-but-not-broken image.
- **P3** — polish.

## Rules
- Verify before flagging. Use WebFetch on the cited source; WebSearch for corroboration on recent/high-visibility claims. Cite what you consulted in `sources`.
- Quote the exact span in `excerpt`. Vague findings are unactionable.
- If you can't verify either way, either omit it or file it at `confidence < 0.5` with honest evidence — never assert.
- Original-words only in evidence; never paste long verbatim source text.
