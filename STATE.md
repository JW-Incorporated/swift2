# STATE — t_921c3ef7 (Awin directory shortlist)

## Current task

Post-round-2 provenance repair of `scripts/merch-engine/awin-directory-shortlist.mjs`
per DEBUG.md, under Fable arbiter ruling (below). Implementation not yet started.

## Architect invocations

- 2026-08-30 — Fable arbiter ruling on DEBUG.md "Awin shortlist review-round 2"
  (per-row `sourceField` is a static union, not the actual signal field).
  Verdict: repair direction AUTHORIZED as scoped; acceptance criteria recorded
  in the session transcript and summarized here. No human decision required.
  Verification after fix = focused vitest suite + typecheck; NO third
  independent review round (ladder replaces it per CLAUDE.md rule 3).

### Ruling summary (binding)

1. Track each candidate signal as a record `{ value, sourceField, kind }` from
   `sourceHostnames()`/name onward; `candidateRow` emits the concrete field(s)
   that triggered the row — never the static union string.
2. `sourceField` values are the logical field keys that actually supplied the
   matching value: one of `displayUrl` | `primaryDomain` | `validDomains` |
   `domains` | `name` (no `programmeInfo.` prefix claim, since values may come
   from top level). Deterministic precedence when one hostname arises from
   several fields: displayUrl → primaryDomain → validDomains → domains.
3. Match semantics frozen: per-programme hostname dedupe must be preserved so
   exact/suffix uniqueness counts (`matches.length === 1`) are unchanged by the
   refactor. Manual-review-only classification, US + target-sector eligibility,
   feed status, Awin-origin/pagination protections all byte-identical in
   behavior; existing 7 tests still pass unmodified except the one assertion on
   the old union string.
4. Manual-review rows: if triggered by name → `sourceField: 'name'`; if by a
   domain signal → that domain field, and `sourceHostname` = the triggering
   host (not `hosts[0]`). Both-triggered → emit the domain field per precedence,
   name allowed as secondary only if the format lists actual triggers.
5. New fixtures required: a programme with conflicting displayUrl / primaryDomain
   / validDomains / name values, asserting exact-match, suffix-match, and
   manual-review rows each report the precise field + hostname.
6. Scope tripwire: diff stays well under ~400 lines; no workflow/YAML changes;
   no new deps; CSV/Markdown column set unchanged.
