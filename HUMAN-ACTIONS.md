# Human actions — Swift2

<!-- ha-format: 2 -->

> **2 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #97 🔴 [BLOCKING] Make the parity check required on main (~3 min)
<!-- ha filed=2026-10-03 -->

**Why:** Before app screens start moving into the shared UI (One UI WP2.4), every PR must pass the website-vs-app look check, so a visual break can't merge. Branch protection is an owner setting.

**Steps:**
1. Open https://github.com/JW-Incorporated/swift2/settings/branches (or Settings → Rules → Rulesets if main uses a ruleset).
2. Edit the rule for `main` → "Require status checks to pass".
3. Search for and add the check `parity-gate`; keep the existing required checks.
4. Save, then tell Claude in chat "parity required".

**Worked if:** a new PR's merge box lists `parity-gate` as Required.

## #96 🔴 [BLOCKING] Add Associated Domains to the iOS signing profile (~10 min)
<!-- ha filed=2026-10-02 -->

**Why:** Since #4799 the iOS store build fails: profile "LongLive App Store 2026-09-05" lacks Associated Domains. No new store builds or app updates reach either phone until this is fixed.

**Steps:**
1. Open https://developer.apple.com/account/resources/identifiers/list and click the identifier `ai.jwlabs.longlive`.
2. Tick **Associated Domains**, click **Save**, confirm.
3. In a terminal: `cd C:\Users\Fourtys\Documents\Claude\Projects\Swift2\apps\mobile`
4. Run `npx eas-cli credentials -p ios`, pick profile `production`, then **Provisioning Profile** → remove it, then let EAS generate a new one (log in to Apple when asked).
5. Tell Claude in chat "profile done" — it re-runs the release train.

**Worked if:** the next "Mobile release train" run on main shows `Build iOS (store)` succeeded (no "does not support the Associated Domains capability").
