# The manual accessibility queue

Owner: Wyatt (CTO), executed by a founder. Created 2026-08-11.

`needs-manual-a11y`: **5 open, 0 ever closed.** Not one ticket has moved since
the label was invented on 2026-07-15. That is not a backlog, it is a queue with
no one standing at the end of it — Laura files them, Austin is barred from them
by charter, and nothing converts "a human with assistive technology must look at
this" into scheduled human work.

Laura's charter is right that automation catches only ~30–50% of real WCAG
issues and that pretending otherwise is worse than silence. Nothing below
weakens that. What follows fixes a different thing: **the label was gating the
build, when it should only have gated the sign-off.**

---

## The re-audit that changed the answer

Every one of the five tickets was read in full on 2026-08-11. None of them is
blocked on assistive technology to *know what to do*. Every single one was
**found by a scripted probe or a named axe rule**, and every one carries an
exact file, line, and fix:

| # | Sev | Found by | Pass criterion | Genuinely needs AT? |
|---|---|---|---|---|
| [#657](https://github.com/JW-Incorporated/swift2/issues/657) | P1 | Scripted probe (`dialogs`, `ariaModal`, `inert`, Tab×25 walk) | Binary: focus moves in, is trapped, background inert | **No** |
| [#660](https://github.com/JW-Incorporated/swift2/issues/660) | P2 | axe `nested-interactive` (serious) | Binary: rule passes | **No** |
| [#834](https://github.com/JW-Incorporated/swift2/issues/834) | P2 | Live probe, WCAG 2.1.1 / 2.5.7 | Keyboard zoom/pan exists — scriptable | Residual only (is the photo's name *meaningful*) |
| [#835](https://github.com/JW-Incorporated/swift2/issues/835) | P2 | Live probe, WCAG 4.1.3 | Live region exists and updates — scriptable | Residual only (does a real SR *announce* it well) |
| [#1206](https://github.com/JW-Incorporated/swift2/issues/1206) | P2 | axe `aria-required-children` (critical) | Binary: rule passes | **No** |

So the label had been carrying two different meanings at once:

1. *"A human with AT is needed to **find** this."* — the residual manual pass
   Laura's charter describes. True, valuable, and **none of these five.**
2. *"A human with AT is needed to **confirm the fix feels right**."* — a
   sign-off step, applicable to #834 and #835 only.

Austin's fence reads the label as a third thing it never meant — *"do not build
this"* — and so five fully-specified code fixes sat still for four weeks.

## The rule, going forward

> **`needs-manual-a11y` gates the sign-off, never the build.**
>
> Apply it when the *pass criterion itself* cannot be asserted by axe or a
> scripted probe. If a named axe rule or a probe assertion decides pass/fail,
> the ticket does **not** get the label, however subtle the fix is.

Applied to the five: **#657, #660 and #1206 lose the label** — their pass
criteria are machine-assertable and Laura re-runs those exact probes on every
walk. #834 and #835 **keep** it, because their residual is real, but the code
fix ships first and the AT confirmation happens on the checklist below.

Result: #660 and #1206 enter Austin's existing `a11y` P2/P3 lane immediately,
with no charter change and no new agent. #657 is `a11y:P1` and stays out of
Austin on severity grounds — it is an eight-overlay focus-management job that
Laura has escalated five separate times, and it needs a deliberate in-session
dev pass.

## The checklist — what a human with AT actually does

Batched, not per-ticket: setting up a screen reader and getting into the right
mental mode is the expensive part, so we amortise it. **Cadence: once per
milestone, and always before go-live** — not a standing weekly chore nobody
will do. Runs against the deployed production site.

Setup: VoiceOver (⌘F5, macOS/iOS) or NVDA (free, Windows). Rotor/elements list
is the fastest way through a page.

- [ ] **Overlays** — open moment detail, eras menu, search, share, track guide,
      theories, photo lightbox, feedback. For each: does focus land *inside*?
      Does Tab stay in? Does Escape return focus to what opened it? (#657)
- [ ] **Photo names** — in a moment gallery, do announced image names describe
      the *photo*, or repeat the caption/filename? (#834 residual)
- [ ] **Feedback form** — submit it with the SR on. Is success/failure spoken
      without moving focus? (#835 residual)
- [ ] **Timeline scrubber** — operate it with arrows only. Is the announced
      value a date a person can use? (#660 residual)
- [ ] **Search results** — arrow through results. Is position ("3 of 12")
      announced, and do non-result items stay out of the list? (#1206 residual)
- [ ] **Reading order** — on one era page, does the SR read the story in the
      order a sighted reader gets it?
- [ ] **Alt meaningfulness** — spot-check 10 images. Does the alt text say what
      the picture *shows*, or restate nearby prose?

Record the result as a comment on the relevant ticket (or on
[#661 `Laura a11y log`](https://github.com/JW-Incorporated/swift2/issues/661) if
nothing failed). A pass is what lets a ticket close; the fix having shipped is
not, on its own, sign-off.

## What is deliberately NOT automated

No agent runs a screen reader and reports what it "heard". Emulating AT output
and calling the result a pass is the one failure mode this whole queue exists to
avoid, and it is worse than an empty queue because it is not obviously empty.
Agents may assert axe rules and probe the DOM. Everything above the line in the
checklist is a human, or it does not happen.
