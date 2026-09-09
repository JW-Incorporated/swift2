# Awin shortlist review-round 2

## Trigger

Independent review of PR #3538 identified that `sourceField` claims every possible Awin source field for each candidate rather than the specific field that supplied the matching signal.

## Reproduction

`npx vitest run scripts/merch-engine/awin-directory-shortlist.test.ts`

The focused suite passes (7/7), but it only verifies the generic provenance string. It does not construct programme records with competing display URL, primary domain, valid-domain, and name signals, so it cannot prove the emitted field is factual.

## Root cause

`scripts/merch-engine/awin-directory-shortlist.mjs` collapses candidate domain values to bare hostnames in `sourceHostnames()`. Once a hostname is returned, the later exact/suffix/manual-review code retains no metadata about whether it originated in `displayUrl`, `primaryDomain`, `validDomains`, `domains`, or an advertiser name. `candidateRow()` therefore emits a static union of possible fields, including `name`, for every programme.

## Scope-preserving repair direction

Represent each supported candidate signal as `{ value, sourceField, kind }`; retain that record through exact and suffix matching; for manual review emit the concrete name or domain field that triggered the normalized-key/suffix candidate. Add fixtures with conflicting supported fields and assert precise output provenance. Preserve manual-review-only classification, US-sector eligibility, feed status, and the Awin-origin/pagination protections.

## Review history

- Round 1: pagination dropped `countryCode=US` and `relationship` after an Awin next-page URL. Fixed and covered by page-two query assertions.
- Round 2: provenance source field is ambiguous. Per `CLAUDE.md`, no third review attempt proceeds without the debug ladder/Fable ruling.

---

# Discord brief delivery review-round 2

## Trigger

Independent review of the Discord morning-brief delivery change found two
workflow recovery gaps in sequence: a configured Discord delivery failure did
not create a durable alert, and later successful delivery did not close those
Discord-specific alerts.

## Repairs and verification

- `scripts/discord/delivery-status.mjs` now classifies the explicit failed
  Discord-to-email fallback marker as `failed`.
- `.github/workflows/watchdog.yml` opens a deduplicated failure alert, retries
  the delivery workflow, and closes both Discord delivery alert classes after
  a confirmed Discord delivery.
- `scripts/discord/post-brief.test.ts` covers failed status parsing and both
  alert-close workflow statements; focused suite passes 15/15.
- Full production build passes.

## Escalation

The second review rejection requires the debug ladder/Fable ruling before a
third review under `CLAUDE.md`. The required `claude --model claude-fable-5`
consult was attempted on 2026-09-09 but the local CLI refused because Fable
usage credits are unavailable. No third review was run.
