// The hardcoded list of identities whose merge of a social/queue/**.json
// PR counts as a founder's real approval (RULINGS-SOCIAL.md A2).
//
// Deliberately NOT a repo variable: `gh variable set` is writable by the
// same SOCIAL_POSTER_PAT an agent session's `gh` also authenticates as
// (RULINGS-SOCIAL.md "what I verified" #2), so a variable-based list could
// be widened by exactly the identity this gate exists to fence out. This
// file lives under `scripts/**`, which auto-merge-content.yml's allowlist
// treats as human-only — widening this list is therefore always a
// human-reviewed code change, never a same-session automerge.
//
// `sffan15-sys` is the owner's own GitHub login — the same login every
// agent session's `gh` CLI also runs as (RULINGS-SOCIAL.md's "the shared
// identity" finding). This list alone cannot distinguish the owner's own
// tap from an agent's `gh pr merge` — that is what the guard-side fencing
// (Projects/.claude/hooks/guard.sh, denying `gh pr merge` on a PR touching
// social/queue/**) exists to do. See A2's "deferred, not rejected" note on
// Discord-reaction approval as the eventual identity-level fix.
export const SOCIAL_APPROVERS = ['sffan15-sys'];
