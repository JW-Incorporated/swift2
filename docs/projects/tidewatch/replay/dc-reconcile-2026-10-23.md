# Tidewatch replay label reconcile with owner decision D-c (2026-10-23)

Scored file: `docs/projects/tidewatch/replay/replay.json` (the file `.github/workflows/tidewatch-classify-eval.yml` passes to `classify.mjs --eval`; the class comes from `class`, falling back to `expectedClass`). Only the `class` field and the `counts` block were edited. Answers, titles and `expectedClass` are untouched. `replay-relabelled.json` (the P2-03 derived fact-check set, not scored by the eval) and its derived files (`replay-relabel-report.json`, `factcheck-eval-results.json`, README table) were regenerated from the edited replay.json by `relabel-replay.mjs` and `factcheck-eval.mjs`.

D-c: critical_breaking = any confirmation of new music (tracklist reveals included), any new planned tour, any super-major life event. VMA appearances, premieres and award-show items = normal_news. Property and home-location stories = privacy_redline.

21 relabels.

| Item id | Title fragment | Old | New | Reason |
|---|---|---|---|---|
| `news_story:eccc876c-37d0-4c3c-a543-faea0714a086` | Kelce and Swift Approved for Fence at Ohio Estate | normal_news | privacy_redline | Ohio estate fence approval: property story |
| `news_story:c481b5ad-76c2-4253-99e6-9d2bab98f940` | Details on Taylor Swift and Travis Kelce’s Pennsylvania Prop | rumor | privacy_redline | Pennsylvania property details: property story |
| `news_story:bab43af3-e0ee-4cd9-8437-06c1eca69de7` | Taylor Swift and Travis Kelce Encounter Opposition on Ohio H | normal_news | privacy_redline | Ohio home plans: property story |
| `news_story:57563c2b-46dc-4fb9-ae3e-adfbd9129270` | Neighbors Oppose Fence Around Taylor Swift and Travis Kelce' | normal_news | privacy_redline | Ohio home fence dispute: property story |
| `news_story:53b44e01-d933-4b67-9d0c-84596ed4b142` | Bratenahl Board Postpones Tree Plan for Swift and Kelce Prop | normal_news | privacy_redline | Property tree plan: property story |
| `news_story:d88c55fc-fba1-428f-bc3c-2ee7857bda76` | Taylor Swift's Former Home Listed for $8 Million | normal_news | privacy_redline | Former home listing: property story |
| `news_story:86f7ad60-db2e-475e-816c-74390b68a850` | Taylor Swift's Former Mansion in Beverly Hills Listed for $8 | normal_news | privacy_redline | Beverly Hills mansion listing: property story |
| `news_story:4d8fb629-cd9d-40a9-a7c8-b0a63410dec4` | Taylor Swift's Beverly Hills Home Listed for $8 Million | normal_news | privacy_redline | Beverly Hills home listing: property story |
| `news_story:ec2816f8-c490-4ac8-b5aa-7cf5a779ea6d` | New Encore Album Featuring Four Songs Available for Pre-Orde | critical_breaking | official_drop | Album pre-order is a pre-order, not a critical confirmation (taxonomy official_drop) |
| `news_story:739ae2ff-1fe6-4f81-b64f-95e22c8b48c3` | Taylor Swift to Premiere New Music Video at 2026 MTV VMAs | critical_breaking | normal_news | VMA premiere announcement (D-c: VMA/premiere is normal_news) |
| `news_story:5ec231aa-8fe7-4531-8bf2-47491ad2f78d` | Taylor Swift's 'Patient Zero' Music Video Premiere Time Anno | critical_breaking | normal_news | Premiere-time announcement (D-c: premiere is normal_news) |
| `news_story:dd350fd3-1e65-4ed8-b72a-e9c2a17436f9` | Taylor Swift Debuts 'Patient Zero' Music Video at VMAs | official_drop | normal_news | Video debuted at the VMAs (D-c: VMA premiere) |
| `news_story:a9caf939-0946-4c89-abbf-88878caa0241` | Taylor Swift Unveils 'Patient Zero' Music Video at VMAs | official_drop | normal_news | Video unveiled at the VMAs (D-c: VMA premiere) |
| `news_story:9828edca-22eb-4b1d-8230-790c3842aaca` | Taylor Swift Receives Positive Update on 'The Life of a Show | rumor | normal_news | Reissue status update, not a drop or rumor (spot-check flag) |
| `news_story:9309ac2a-e59d-412f-bce5-082cccbce7ad` | Fans Question Travis Kelce Following SNL Appearance | privacy_redline | fan_discussion | Fan reaction to SNL appearance (spot-check flag); its own q_class is fan_discussion |
| `news_story:2da734f7-695c-46bb-a20e-94b8f9b701f2` | New Song 'I Knew It, I Knew You' from Toy Story 5 Released | official_drop | critical_breaking | New song released: D-c new music confirmation |
| `theory_bundle:speak-now:speak-now-tv-tracklist-reveal` | The Speak Now (Taylor's Version) track list drops on social  | normal_news | critical_breaking | Tracklist reveal: D-c names tracklist reveals critical |
| `synthetic:critical_breaking:2` | Official: Taylor Swift adds three stadium dates to her tour | tour_ticket | critical_breaking | New tour dates: D-c new planned tour |
| `synthetic:critical_breaking:3` | Presale opens today for newly added Taylor Swift shows | tour_ticket | critical_breaking | Presale for newly added shows: new tour announcement (D-c) |
| `synthetic:critical_breaking:11` | Tour dates for a new international leg announced by Taylor S | tour_ticket | critical_breaking | New tour leg announced: D-c new planned tour |
| `synthetic:critical_breaking:4` | Taylor Swift releases a surprise single tonight | official_drop | critical_breaking | Surprise single: D-c new music |

## Not changed, listed for review

- Untitled Reddit critical leads (no exclusion flag exists in the format; every item must carry a valid class): `reddit_lead:23ab78cc-80a0-4034-a4f4-4b3b...` and `reddit_lead:c680471c-917f-4257-b7a8-b71c...` (full ids in replay.json, titles null, both critical_breaking). One is the unverifiable lead from the P1-04 spot-check.
- Synthetic `critical_breaking:13` (vinyl exclusive drop, merch_official) and `critical_breaking:14` (deluxe edition released today, official_drop): expectedClass says critical_breaking; D-c does not clearly cover merch or a deluxe reissue.
- `news_story:2ac3476a` and `news_story:e148ff2e` ("Debuts" a music video, official_drop, no VMA mention) and the Patient Zero piano version and Opalite remix visualizer: real releases, left official_drop.
- `news_story:73d588a7` (four-song Encore extension, official_drop): reverted to its original label; neither new music confirmation nor a new tour under D-c.
- `news_story:5f4e5916` and `news_story:1393e30a` ("Patient Zero" house sold, $47M home in the video): normal_news, ownership of the property unclear, left as is.
- `news_story:ddb3ae5a` (Kelce's homes incl. proposal location, normal_news): not clearly Swift's own or shared home, and `factcheck-replay.test.ts` pins it normal_news; left.
- Academy Museum Gala performance stories (tour_ticket, 5 items) and `news_story:df204d7e`: not a new planned tour, D-c does not cover them, left.
- VMA stories labeled merch_outfit, fan_discussion, rumor or theory_material: class-specific labels, left.
- No real news item is a first confirmation of a super-major life event; wedding coverage is post-event and stays normal_news.
- Known D-c conflict in the derived `replay-relabelled.json`: the `critical_new_official_work_only` rule in `relabel-replay.mjs` still demotes synthetic critical_breaking 2 (new stadium dates), 3 (presale for new shows) and 7 (tracklist) to official_drop, against D-c (new tour / tracklist = critical_breaking). The rule is generator code, not edited here.
