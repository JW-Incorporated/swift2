# Human actions — Swift2

<!-- ha-format: 2 -->

> **1 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #99 🟢 [UPGRADE] Send two app IDs so longlivets.com links open the app (~5 min)
<!-- ha filed=2026-10-04 -->

**Why:** One UI H6 (universal links) needs the Apple Team ID and the Play app-signing SHA-256 in the link files. Not needed until Wave 3; nothing is blocked yet.
**Steps:**
1. Open https://developer.apple.com/account → Membership details → copy the 10-character Team ID.
2. Open https://play.google.com/console → Long Live → Test and release → App integrity → Play app signing → Settings.
3. Under "App signing key certificate", copy the SHA-256 certificate fingerprint.
4. Paste both into the Claude chat (copy-paste, no typing). They are public identifiers, not secrets.
**Worked if:** both values appear in docs/one-ui/drafts/well-known/ in place of the placeholders.
