# Voice exemplar corpus

Reference set for the voice critic (`scripts/voice/critic.mjs`, P1-24). It
defines "sounds like us" with real shipped text and "does not" with written
counter-examples. The voice itself is defined in
`docs/content-ops/editorial-voice-and-pipeline.md`.

| File | Contents | Count |
|---|---|---|
| `exemplars-social.md` | Our own X posts that were approved and shipped | 35 |
| `exemplars-vault.md` | Snippets from the merged era seed files | 10 |
| `counter-examples.md` | Generic, wire-service and AI-sounding text written for this corpus | 26 |

## Selection rule

1. **Only our own published text.** Social entries come from
   `social/posted/` (approved, shipped, a platform post id recorded). Vault
   entries come from `supabase/seed/content/*.mjs` (merged, passed
   `validate:content` and `check:voice`). No fan, member or third-party text,
   ever; this repo is public.
2. **Engagement is not recorded in the repo.** `social/posted/` and
   `social/metrics/` carry no per-post likes or impressions (only follower
   counts), so "best" cannot be ranked by performance yet. The proxy is
   editorial: the post carried a concrete fact, a take or a joke, cited a
   real source, and read as a fan telling another fan. Ties were broken for
   era and pillar spread (on-this-day, track-fact, era deep-cut, Decode and
   Clue Web, feature announcements). Once real engagement data exists, rank
   by it and replace entries here.
3. **Excluded on purpose:** automated "just dropped, running to watch"
   appearance posts, the pipeline test posts, and any post whose approval
   reason was about a re-used image rather than wording. Rejected drafts in
   `social/feedback/` were not used as counter-examples because their
   rejection reasons are mostly about images, not voice.
4. **Counter-examples are written, not harvested.** Each imitates a
   register the guide says to cut on sight (throat-clearing, hedging,
   exclamation stacks, wire framing, corporate feature copy, empty praise,
   repeated bare surname). They were never published. Do not use them as
   drafting examples.
5. Link and photo-credit lines are stripped from social entries; the prose
   is unchanged (lowercase and punctuation included).

## Entry format

One entry per line: `- <id> | <source> | <text>`. Ids: `EX-S##` (social),
`EX-V##` (Vault), `CX-##` (counter-example). Parsed by
`scripts/voice/corpus.mjs`.

## Owner star pass (optional)

A 10-minute pass adding the owner's own picks is welcome: append lines in
the same format to `exemplars-social.md` or `exemplars-vault.md` with source
`owner pick` and the exact published text.
