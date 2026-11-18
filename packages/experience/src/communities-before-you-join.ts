/**
 * Fan-facing "Before you join" copy for every community, keyed by `name`.
 *
 * This is the ONLY text the card's caution box renders. It is written for
 * fans, in house voice, from facts already in `data/communities.json`
 * (join rules, verification gates, what kind of space it is). The research
 * pass's own notes live in `curationNotes` and are never rendered.
 *
 * Every community needs an entry, even an empty one, so a newly added
 * community cannot reach the box without someone writing its copy
 * (`communities-before-you-join.test.ts`).
 */
export const BEFORE_YOU_JOIN: Readonly<Record<string, readonly string[]>> = {
  'r/TaylorSwift (official Discord)': ['New members agree to the server rules before they can chat.'],
  'r/TaylorSwift (subreddit)': ["Posts speculating about Taylor's sexuality are reportedly not allowed here."],
  'ATRL — Taylor Swift megathread': [
    'ATRL is a general pop forum, not a Swiftie-only space, and the tone is blunter than most fan spaces. Anyone can read; posting needs an account.',
  ],
  'Taylor Swift Fan Club (Discord)': ["Fan-run, not Taylor's official server."],
  "Taylor Swift's Vault": [
    'A separate group calling itself Vault 2.0 also exists, and fans have been confused about which admins are real. Check the group name before you join.',
    'Joining may need admin approval.',
  ],
  'New Taylor Connect': ['You need an account to post.'],
  'r/SwiftlyNeutral': ['Fans and skeptics both post here, so expect criticism alongside praise.'],
  'Swifties Want Tickets': [
    'A ticket help desk, not a hangout server.',
    'You will likely need a phone number verified with Discord to join.',
  ],
  'Taylor Swift (discord.gg/taylor)': [],
  'BuzzJack — Taylor Swift forum': [
    'A UK chart forum, so expect plenty of chart and sales talk. Anyone can read; posting needs an account.',
  ],
  'Tales of Kaylor': [
    "This blog speculates about Taylor's real-life relationships and sexuality, which she hasn't confirmed. Some fans find that invasive.",
  ],
  'Based on a Taylor Swift Song': ['Anyone can read. You need an AO3 account to post or comment.'],
  'Kulto ni TAYLOR SWIFT': ['Made for Filipino fans, with lots of local in-jokes.'],
  'r/GaylorSwift': [
    'Reported to have gone private in August 2025, so you may need to request access.',
    "Theories here are about Taylor's sexuality, which she hasn't confirmed.",
  ],
  Swifties: [],
  'Taylor Swift Fan Club (Steam)': [
    'The live chat room is the busiest part of this group. You need a Steam account.',
  ],
  'Taylor Swift Friendship Bracelet Making and Trading (NO SALES)': ['Trading only. Selling is not allowed.'],
  'Taylor Swift Store Updates': ['A merch alert server, not a place to hang out and chat.'],
  'taylorswift (story tag)': ['Some stories have mature themes, and the tag is not moderated or age-gated by fans.'],
  'The Swift Hub': [
    "The server's own description is in Portuguese, though English speakers are welcome.",
    'You will likely need a phone number verified with Discord to join.',
  ],
  'ｓｗｉｆｔｃｏｒｄ': [],
  'Swiftie Super Worldwide Friendship Bracelet Trade': [],
  'Swifties ♡': [],
  'Taylor Swift Daily': ['An unofficial fan blog, not run by Taylor or her team.'],
  'Taylor Swift Updates': [],
  'Karlie Kloss/Taylor Swift': [
    "Fiction about a real-life relationship theory Taylor hasn't confirmed. Some fans find that invasive.",
    'We could not confirm recent posting here, so it may be quiet.',
  ],
  'SimilarWorlds — Taylor Swift group': [
    'SimilarWorlds is a general discussion site, so you will see posts about other topics around this group.',
  ],
  'Taylor Swift Friendship Bracelets: (Buy / Sell / Trade)': [
    'Buying and selling are allowed here, not just trading.',
    'We could not confirm this group is still active.',
  ],
  'TBN (Taylor Boards)': ['Activity has slowed and the admins post less often now, so expect a quiet board.'],
  'twitter swifties': [
    'A small, casual server that can be quiet.',
    'The invite link is not permanent and may stop working.',
  ],
};
