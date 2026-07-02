# Decision Log

Every decision that would be expensive to reverse gets an entry here BEFORE
implementation. Newest first.

Format: date, decision, why, alternatives considered, who approved.

---

## 2026-07-02 — Adopt dual-AI operating model

**Decision:** Claude Code is the hub (planning + building); Codex runs inside
it via the official plugin (reviewing + delegated tasks). Roles are modes
defined in CLAUDE.md, not separate agents. QA is automated tests + CI, not an
AI role.

**Why:** Cross-provider review catches issues self-review can't; one-session
workflow avoids copy-paste overhead; lean docs over an 11-file process that
would go stale.

**Alternatives considered:** Separate PM/Engineer/Reviewer/QA AI agents
(rejected: ceremony without benefit at 2-person scale, unaffordable on
current plans).

**Approved by:** Joey

## 2026-07-02 — Repo is the source of truth

**Decision:** All knowledge lives in Git. Nothing important exists only in an
AI conversation. Core docs: CLAUDE.md, AGENTS.md, docs/vision.md,
docs/architecture.md, docs/decisions.md. New docs added only when their
absence causes real pain.

**Why:** Docs nobody maintains are worse than none; agents act on stale info.

**Approved by:** Joey
