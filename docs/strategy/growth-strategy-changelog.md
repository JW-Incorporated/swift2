# Growth strategy changelog archive

Changelog lines rotated out of `docs/strategy/growth-strategy.md` once they are more than
8 weeks old. Written only by `rotateChangelog` in
`scripts/marjorie/lib/strategy-doc.mjs`, which `strategy-doc.mjs open-pr` runs on every
strategy rewrite — nobody edits this file by hand.

Append-only, exactly like the live section: a line that leaves the strategy file arrives
here unchanged and is never edited or removed. `validateStrategy` treats the two files as
one history and refuses a rewrite that loses a line from both (#6893).
