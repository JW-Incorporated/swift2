# DEBUG — FB-EXTENSION-1 stopped at Codex round 2 (2026-09-30 16:37 PDT)

Branch feat/fb-export-page-profile @ 00cf77b7 (132 knowledge tests, lint/prettier green).
Round 1 (d70630ac): 6 findings, all fixed with fail-before tests; round 2 confirms 4 of them fixed.
Round 2: VERDICT FIX — per Swift2 rule 3 no round 3; the owner decides the next step.

Round-2 findings (all in the extension; receiver/launcher/run untouched by them):
1. HIGH harvest-core.js:343 — comment stripping is a denylist (fail-open); a comment rendered without
   nested role=article / "Comment by" label would reach uploaded HTML. Fix idea: allowlist post-owned
   elements, or fail the group when comment-like content can't be proven removed.
2. HIGH background.js:200 — any local process can serve /start#<its token> and receive private
   posts/comments. Fix idea: extension-held pairing secret (owner pastes once) or a user gesture.
3. HIGH harvest-core.js:166 — classifyPage scans all feed text for "2FA"/"captcha"/"security check";
   an ordinary post with those words stops the run as checkpoint. Fix: URL + dedicated challenge UI only.
4. HIGH harvest-core.js:470 — missing i_user cookie is treated as "personal profile verified". Fix:
   positive personal-profile check, else wrong-profile.
5. MEDIUM background.js:110 — after retries are exhausted there is no chrome.alarms wake-up.
6. MEDIUM comments.js:448 — comment failures return [] silently; group still uploads. Fix: coverage
   metadata; fail the group when comment-bearing posts could not be processed.

Live evidence: an owner-watched DRY run (no upload, no issue writes) was started 16:36 at 00cf77b7,
before the verdict arrived. RESULT (16:52, exit 1): `fb-receiver taylor-swifts-vault: stalled` —
no /result and no heartbeat within the 5-min watchdog, so all 4 groups failed (3 "collection aborted").
The extension never reported back on the first group. Not yet diagnosed (owner's view of the tab and
chrome://extensions errors for the unpacked extension are the first evidence to collect: did the
/start page hand off, did the tab reach the group, did the status box appear?).
