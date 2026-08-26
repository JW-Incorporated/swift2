// The Facebook groups checklist for the weekly export reminder (proposal
// §4.7, PLAN.md Stage 6). Only Joey knows which groups he's actually a
// member of and wants tracked — this ships empty on purpose rather than a
// guessed list (HUMAN-ACTIONS.md #16). Add entries as:
//
//   { slug: 'example-group-slug', label: 'Example Group Name' }
//
// `slug` becomes the saved filename prefix (`fb-<slug>-<date>.html`) and the
// `fan_signal.community` value (`facebook:<slug>`) once parsed — keep it
// short, lowercase, hyphenated, stable (renaming a slug here orphans any
// history keyed on the old one).
export const FB_GROUPS_CHECKLIST = [];
