// The hardcoded list of identities whose Discord ✅ counts as the
// founder's real approval (docs/social/RULINGS-SOCIAL-2.md B1, superseding A2's
// merge-keyed list).
//
// Every entry MUST be a `discord:<snowflake>` identity — `/^discord:\d{17,
// 20}$/`, enforced by approvers.test.ts's "every approver is a discord:
// identity" case. No GitHub login may ever appear here again: the whole
// point of B1 is that GitHub has only one identity (`sffan15-sys`) for the
// owner, every agent session's `gh`, every routine's PAT, and the auto-merge
// actor — so a GitHub-login-keyed approver list can never distinguish the
// owner's own tap from automation (docs/social/RULINGS-SOCIAL.md "what I verified" #2;
// docs/social/RULINGS-SOCIAL-2.md's corrections #2-3). Discord is the one channel in
// this system where the owner holds an identity no agent or routine holds:
// agents have the webhook URL (write-only), not his user account, and the
// read-only poll bot token can observe reactions but cannot react as him.
//
// approvers.test.ts also asserts `SOCIAL_APPROVERS ∩ KNOWN_CONTENT_AUTHORS
// = ∅` (B5) — the exact disjointness check that, applied to A2's
// GitHub-login list, would have failed on day one (`sffan15-sys` sat in
// both lists at once).
//
// *** SETUP INCOMPLETE — DO NOT MERGE A PR THAT SHIPS THIS EMPTY LIST AS
// THE FINAL STATE. ***
// This is deliberately empty until the owner pastes his real Discord user
// id (docs/social/RULINGS-SOCIAL-2.md B1 one-time setup, step 3 — Discord Settings ->
// Advanced -> Developer Mode ON -> right-click his own name -> Copy User
// ID). An empty SOCIAL_APPROVERS is a safe, total-refusal state (nothing
// can ever be approved), not a silent bug — approvers.test.ts's "non-empty"
// case fails loudly against this exact list for exactly that reason, and
// is EXPECTED to fail until the line below is replaced with the real id.
// Replace with exactly one line:
//   export const SOCIAL_APPROVERS = ['discord:<owner's numeric user id>'];
export const SOCIAL_APPROVERS = ['discord:338508192755482626', 'discord:1421545239650238555'];
