// The Facebook groups checklist for the weekly export reminder (proposal
// §4.7, PLAN.md Stage 6). Add entries as:
//
//   { slug: 'example-group-slug', label: 'Example Group Name', groupId: '123', candidate: true }
//
// `slug` becomes the saved filename prefix (`fb-<slug>-<date>.html`) and the
// `fan_signal.community` value (`facebook:<slug>`) once parsed — keep it
// short, lowercase, hyphenated, stable (renaming a slug here orphans any
// history keyed on the old one).
//
// `candidate: true` means the group was found via desk research (sources.md
// § "Sources mined -- Facebook Groups research") but nobody has confirmed
// Joey is actually a member — the weekly reminder issue flags these rows so
// he can confirm membership or delete the line before the first real export.
// Drop `candidate` (or set it `false`) once membership is confirmed.
export const FB_GROUPS_CHECKLIST = [
  {
    slug: 'taylor-swifts-vault',
    label: "Taylor Swift's Vault",
    groupId: '2254218764714763',
    candidate: true,
  },
  {
    slug: 'friendship-bracelet-making-trading',
    label: 'Friendship Bracelet Making and Trading',
    groupId: '959997728506267',
    candidate: true,
  },
  {
    slug: 'swiftie-super-worldwide-bracelet-trade',
    label: 'Swiftie Super Worldwide Friendship Bracelet Trade',
    groupId: '1404884973507150',
    candidate: true,
  },
  {
    slug: 'kulto-ni-taylor-swift',
    label: 'Kulto ni TAYLOR SWIFT',
    groupId: '557483725146375',
    candidate: true,
  },
  {
    slug: 'taylor-swift-swifties',
    label: 'Taylor Swift Swifties',
    groupId: '264466934870157',
    candidate: true,
  },
  {
    slug: 'friendship-bracelets-buy-sell-trade',
    label: 'Friendship Bracelets Buy/Sell/Trade',
    groupId: '1220925938596348',
    candidate: true,
  },
];
