# Historical authored-media migration

The publication gate began from commit `e3afc2b1` with 48 older moments that lacked an authored photo, thumbnail, video, or social embed. Temporary exemptions pinned each original item by stable key and SHA-256, so editing an item required adding media.

All 48 gaps were repaired on September 15, 2026: ten Showgirl moments in [#4399](https://github.com/JW-Incorporated/swift2/pull/4399), twenty older moments in [#4400](https://github.com/JW-Incorporated/swift2/pull/4400), and eighteen TTPD moments in [#4402](https://github.com/JW-Incorporated/swift2/pull/4402). The two newly published CMA and insect posts were repaired separately in [#4396](https://github.com/JW-Incorporated/swift2/pull/4396).

**Zero historical exemptions remain.** Every seeded moment must pass the publication media guard. Do not add new exemptions to bypass the rule.

The repairs use verified event photographs, official videos, and honestly labeled public reference images where the story concerns a private setting. Source links alone do not satisfy the media rule. Source relevance, captions, credits, and image contents require editorial and visual review in addition to structural validation.

The Amsterdam backstage-kiss record was also corrected to July 5, 2024: its source was published on July 6 but explicitly describes the second show. Its former generated ID is retained as a deep-link alias.
