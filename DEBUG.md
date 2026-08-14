# DEBUG.md — the "Videos" filter chip cannot be tapped

Opened 2026-08-14 under CLAUDE.md § DEBUGGING: TWO-STRIKE RULE, after three
failed fixes. Branch `fix/land-in-eras`.

## Exact symptom

On a phone (390×844), tapping the **"Videos"** chip — the last chip in the
sticky filter row — does not toggle it. Instead the tap is received by the
timeline scrubber's rail, which starts a scrub and teleports the page
hundreds or thousands of pixels.

Founder's original report: "our scroll goes under the filters" led to the
one-line filter row, which is what moved Videos under the rail.

**Current state (after fix 3):** the bug is FIXED once the page has been
scrolled at all — the filter bar is stuck to the chrome and the whole row is
tappable, verified by a 3×140-point sweep. It remains BROKEN on a **fresh,
unscrolled load**, where the rail eats the right ~24px of the Videos chip and
a right-edge tap starts a scrub.

Reaching Videos on a phone requires scrolling the chip row rightwards, which
parks it exactly in the dead band. So the founder hits this on first contact.

## Why it matters

`role="slider"` gestures are destructive: a mis-delivered tap does not do
nothing, it throws the reader to an unrelated point in twenty years of
timeline. This is the single worst failure mode on the new front door.

## What has been tried, and how each was disproved

**Attempt 1 — clamp the rail's box below the sticky chrome.**
Used `measureChromeHeight()` to push the rail's top to the chrome's bottom.
*Disproved by browser hit-test:* the rail's box moved (top=114, confirmed),
but its CHILDREN overflow that box. `elementFromPoint` over the chip returned
a milestone-label span.

**Attempt 2 — `pointer-events-none` on every rail adornment.**
Root cause found: `pointer-events` INHERITS. `SCRUBBER_SHELL_CLASS` sets
`none`, `SCRUBBER_RAIL_CLASS` re-enables `auto`, so all 11 adornments
inherited `auto` while being invisible (`opacity-0`). All 11 fixed, locked by
a source test that walks the rail's JSX.
*Disproved by browser hit-test on a FRESH load:* this fixed the stuck state
completely, but on an unscrolled page the element eating the tap is no longer
an adornment — it is the **rail itself**.

**Attempt 3 — (the current state) rail top from summed chrome heights.**
`TimelineScrubber.tsx:336-343` and `chrome-offset.ts:37` compute the rail's
top as `TopBarHeight + FilterBarHeight` (65 + 49 = 114).
*Disproved:* that sum is only the filter bar's position **once it is stuck**.
On a fresh load the masthead — new on this branch, `EraStream.tsx:330-337` —
sits above the filter bar and pushes it down to y≈361. The rail still starts
at 114, so it spans straight across the row. Desktop (1280×900) is unaffected
because the rail is centred there and takes no clamp.

## The mechanism, stated plainly

The rail's top is derived from **how tall the chrome is**, but what it
actually needs is **where the filter bar currently is**. Those two agree only
after the bar has stuck to the top. Anything that adds height above the filter
bar — the masthead did — breaks the assumption for the pre-stick state.

## What to try next, and why

Derive the rail's top from the filter bar's **live position**:
`document.querySelector('[data-ll-filterbar]').getBoundingClientRect().bottom`,
recomputed on scroll (throttled/rAF) while the bar is unstuck, settling to the
existing summed value once it sticks. `[data-ll-filterbar]` already exists —
it was added for `measureChromeHeight()`.

This replaces a computed assumption with an observation, which is the same
correction that fixed the era-jump offset earlier on this branch.

**Guard against a fourth costume:** whatever the fix, verify with
`elementFromPoint` AND a real tap, on a **fresh unscrolled load** and after
scrolling, at 390×844 and 844×390. Three of these three attempts passed a
green 2700-test suite. None of them were catchable by reading code.

## Files that matter (and only these)

- `apps/web/components/longlive/TimelineScrubber.tsx` — rail top/clamp:
  ~336-343 (compute), ~350-367 (resize/scroll listeners)
- `apps/web/lib/longlive/chrome-offset.ts` — `measureChromeHeight()`, :37
- `apps/web/components/longlive/EraStream.tsx` — :330-337, the masthead that
  displaces the filter bar pre-stick

## Not in scope

Milestone labels colliding when dates are close (pre-existing, unchanged by
this branch, non-blocking). The clipped top year label during a clamped mobile
drag is an accepted, disclosed trade-off.
