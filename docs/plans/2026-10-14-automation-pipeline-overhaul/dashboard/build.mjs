import fs from 'fs';
const inv = JSON.parse(fs.readFileSync('joined.json','utf8'));
const wk = JSON.parse(fs.readFileSync('weekly.json','utf8'));
const vault = {'2026-09-14':[4,859],'2026-09-21':[6,575],'2026-09-28':[7,586],'2026-10-05':[6,509],'2026-10-12':[1,32]};
const weeks = Object.entries(wk).map(([id,w])=>({id,runs:w.runs,failures:w.failures,cancelled:w.cancelled,contentPRs:w.contentPRsMerged,socialPRs:w.socialPRsMerged,vaultPRs:vault[id][0],vaultLines:vault[id][1]}));
const sum=f=>inv.filter(f).reduce((s,x)=>s+(x.min||0),0);
const total=sum(()=>true);
const contentMin=sum(x=>['content-generation','content-validation','content-delivery','deploy'].includes(x.c));
const kpis={windowDays:31,vaultDays:21,vaultPRs:24,vaultLines:2561,vaultMedian:100,vaultOk:26,vaultFail:7,socialStateOpen:154,ciSocialShare:1127/1422,contentComputeShare:contentMin/total};
const snapV={vaultDays:21,vaultLines:2561,vaultOkPct:79,contentPRs:203,socialStateOpen:154,ciFailures:1422,openWatchdog:21,appearancePct:21,awinPct:24,limitStreak:3};
const kpiDefs=[
 {k:'vaultDays',l:'Days with a merged Vault PR (30d)',better:'up'},
 {k:'vaultLines',l:'Vault lines added (30d)',better:'up'},
 {k:'vaultOkPct',l:'Vault Run reliability',better:'up',u:'%'},
 {k:'contentPRs',l:'Content PRs merged (30d)',better:'up'},
 {k:'appearancePct',l:'Appearance discovery reliability',better:'up',u:'%'},
 {k:'awinPct',l:'Awin sync reliability',better:'up',u:'%'},
 {k:'socialStateOpen',l:'Social state PRs open',better:'down'},
 {k:'ciFailures',l:'CI failures (30d)',better:'down'},
 {k:'openWatchdog',l:'Open watchdog alerts',better:'down'},
 {k:'limitStreak',l:'Scheduled runs lost to weekly limit',better:'down'}];
const producers=[
 {n:'Vault Run',d:'Opus, up to 6 lanes, branch vault/',app:1,m:24,o:0,h:.37},
 {n:'Merch Awin revenue',d:'Affiliate catalog updates',app:1,m:38,o:0,h:.39},
 {n:'Merch official sync',d:'Official store catalog',app:1,m:35,o:0,h:.10},
 {n:'CIE scan reports',d:'Audit reports, not seed content',app:0,m:31,o:0,h:20.19},
 {n:'Growth snapshots',d:'Weekly usage data',app:0,m:31,o:0,h:.09},
 {n:'Social approval stamps',d:'Owner reaction signed into queue file',app:0,m:38,o:0,h:.08},
 {n:'Social poster state',d:'Post ledger fold-back, 172 opened',app:0,m:18,o:154,h:.07},
 {n:'Tree daily drafts',d:'6 more closed unmerged',app:0,m:9,o:2,h:3.28},
 {n:'Dependabot',d:'Dependency bumps',app:0,m:15,o:5,h:12.2},
 {n:'Feature and fix PRs',d:'Agent-built code, 3 open',app:0,m:403,o:3,h:.31}];
const findings=[
 {sev:'bad',conf:'High',title:'The only app-content producer stops when the Claude weekly limit is hit',one:'The last three scheduled Vault Runs failed on the weekly limit; 7 of 33 runs failed in 30 days.',
  ev:['Scheduled Vault Runs on Oct 12, 13 and 14 failed with "You\'ve hit your weekly limit" (reset Oct 14, 11pm UTC). Routine news triage hit the same limit.','A manual run after the reset succeeded and opened #5798, so the pipeline works when it has budget.','About 27 routine workflows share one CLAUDE_CODE_OAUTH_TOKEN, so chat, ops and desk routines spend the same weekly budget as content.','Issue #5799 blames a checkout flake across 14 workflows. The log line it quotes is script text echoed in the log, not the cause.'],
  fix:'Give Vault Run its own credential or reserve budget for it. Cap turns on chat, status and ops routines. Make the failure reason ("weekly limit") a named alert instead of a generic routine failure.'},
 {sev:'bad',conf:'Medium',title:'Output is thin and uneven even when it runs',one:'24 PRs and 2,561 added lines in 30 days, median 100 lines, with content landing on 21 of 31 days.',
  ev:['PR size ranges from 5 to 316 added lines. Oct 9 and Oct 11 ran only the Photo Enrichment lane (+18 and +5 lines). This week has one PR with 32 lines.','Weekly lines added: 859, 575, 586, 509, then 32 in the partial latest week. The trend is down.','All six lanes run one after another in one Opus session with a 200-turn cap. A lane that does not finish is dropped.','Cause is inferred from PR titles and size. Per-lane run logs were not read.'],
  fix:'Run one job per lane so a slow lane cannot starve the others. Set a yield target per lane and write the lane results into the PR body so output can be counted.'},
 {sev:'bad',conf:'High',title:'The inputs to the producers are failing most of the time',one:'Appearance discovery is 21% reliable, Awin sync 24%, official merch sync 60%.',
  ev:['appearance-discovery: 13 ok, 49 failed of 62 runs. It stages social drafts and files intake issues.','merch-awin-sync: 8 ok, 25 failed, 29 cancelled, and the most wall-clock minutes of any generation workflow (1,745).','merch-official-sync: 37 ok, 25 failed. routine-tree-weekly-plan: 5 of 8 failed, with a turn-limit error (81 of 80 turns) on Oct 9.','Failure causes were collected for only about 22 runs. Several of these workflows have no cause recorded yet.'],
  fix:'Pull the failure log for each of these four workflows and fix the top cause. They are cheap to fix and each feeds Vault Run or Tree directly.'},
 {sev:'warn',conf:'High on counts',title:'A test failure storm is burying real failures, but it is not blocking content',one:'154 social state PRs are open and cause 79% of CI failures.',
  ev:['172 social-poster state PRs were opened in 30 days and 154 are still open. 1,127 of 1,422 CI failures are on their branches.','They fail the build-full test step. The pipeline research traced it to draft-happy-path.test.ts, which reads live social/posted state and trips the photo-reuse rule (lesson L001). I have not read the test myself.','Content PRs are still merging: 203 of 207 merged, median 14 minutes. That contradicts the claim in #5573 that this blocks all content auto-merge.','Real cost is noise: failures get re-filed as watchdog alerts (#5560, #5622) and 21 alerts are open.'],
  fix:'Make the test hermetic with fixture state, and skip the full build for ledger-only state PRs. Close the 154 stuck PRs once the test is fixed.'},
 {sev:'warn',conf:'Medium',title:'Social output dropped to zero this week',one:'No social PRs merged in the week of Oct 12; the poster failed on its last run.',
  ev:['Social PRs merged per week: 24, 12, 20, 10, then 0.','social-poster: 113 failed of 522 runs. One Instagram post fails permanently and an X post returns 403, so each run exits non-zero and re-files an alert.','Tree is moving from Actions routines to a Hermes loop, and Tree can now approve his own IG and X drafts (#5479). The 0 may partly reflect that handover rather than a stall. I did not check the Hermes side.'],
  fix:'Move the two permanently failing items to social/failed so the poster exits clean. Then confirm in a Hermes session that Tree is drafting.'},
 {sev:'warn',conf:'Medium',title:'The bot clock is the biggest compute spender and produces nothing',one:'bot-chat-poll uses 34% of all workflow minutes; 47% of its runs are cancelled.',
  ev:['bot-chat-poll: 8,669 runs and 43,214 minutes. marjorie-status: 1,577 runs, 11,719 minutes, 1,211 of them skipped.','It exists because GitHub cron delivers only 2 to 22% of hourly-or-faster schedules (noted in STATE.md).','This spends Actions minutes, not Claude plan usage, so it does not cause finding 1. Minutes are wall-clock, so the billed share is lower.'],
  fix:'Move the clock to the Hermes doorbell, which already exists as a backup, and drop marjorie-status to a real schedule.'},
 {sev:'none',conf:'High',title:'We count lines, not content',one:'No per-lane yield, no item counts, no app-side engagement per content type.',
  ev:['The dashboard measures PR lines added, which mixes new items, edits and generated files.','Nothing links a shipped item to how often users open it.'],
  fix:'Have Vault Run write a small yield record per lane (items added, edited, skipped) into the PR body, then read it into this dashboard each week.'}];
const fixes=[
 'Give Vault Run its own credential or reserved budget, and alert on "weekly limit" by name. Biggest effect, one workflow edit.',
 'Fix the four failing feeders: appearance-discovery, merch-awin-sync, merch-official-sync, tree-weekly-plan. Pull logs, fix the top cause each.',
 'Fix the draft-happy-path test so social state PRs stop failing, then close the 154 stuck PRs.',
 'Split Vault Run into one job per lane and record items added per lane in the PR body.',
 'Retire the bot-chat-poll clock in favor of the Hermes doorbell and cut marjorie-status runs.',
 'Add item-level yield and app engagement to this dashboard so content quality can be judged, not only volume.'];
const gaps=[
 'Items added, edited or removed per lane. Only added lines are counted today.',
 'Why 28 workflows have no metrics. Some are reusable workflows that other jobs call, and some had no runs in the window.',
 'Failure causes for appearance-discovery, merch-awin-sync, news-worker, auto-merge-keepup and Parity (DOM visual).',
 'Billed Actions minutes and the Claude plan usage per routine. Only wall-clock minutes are available.',
 'Whether Hermes-side Tree and Marjorie are running, and what they posted this week.',
 'Reader-side value: opens, saves or shares per piece of content.'];
const goals=[
 {n:1,status:'none',title:'Critical Taylor news is live within 1 hour, with social and a push notification',target:'90% of critical stories live on the site in 60 minutes or less from the first public report, with a social post and a push sent. A written rule defines "critical".',now:'No definition of "critical" exists and the delay from public to live is not measured. The news worker runs every 4 hours, so a story can wait that long before anything touches it, and the daily Vault Run adds more delay.',measure:'Log first-public timestamp and live-on-site timestamp for every story. Report the median and 90th percentile per week, plus critical stories that missed 60 minutes.'},
 {n:2,status:'none',title:'We never miss a piece of Taylor news',target:'Recall of 98% or higher against a reference list of news from other outlets, with each miss named and traced to a source gap.',now:'Recall is not measured. The news worker polls sources every 4 hours and has failed 6 of 113 runs. Which sources it covers has not been audited against the wider press.',measure:'Weekly, compare our stories to a reference set (major outlets, Taylor\'s own channels, fan accounts) and count what we lack.'},
 {n:3,status:'part',title:'The largest "clowning" database in the world',target:'Theories ingested every day, tagged by Easter egg and by clowning level, with a public count that grows weekly.',now:'The theory miner ran 31 of 31 days and community crawl 30 of 31. Promotion runs weekly. Nobody counts the theories yet, so size and growth are unknown.',measure:'Count theories ingested, promoted and published per week, and the share carrying a clowning tag.'},
 {n:4,status:'none',title:'No content is ever missing a picture or video',target:'Zero shipped items without media. Any item with no media is blocked at merge, not fixed later.',now:'The live news feed hides items with no image. The seed content bundle has no equivalent check that we can confirm, so text-only items may be shipping.',measure:'Run a media-completeness check on every item in the bundle and the feed. Report the share with media and list the exceptions.'},
 {n:5,status:'none',title:'New site content gets priority on our social',target:'Every new item above a quality bar gets a social post within 24 hours. Report the share of new content that was posted.',now:'Tree reads the Vault and a calendar, but nothing links a newly shipped item to a post, so priority is not measurable.',measure:'Join new content IDs to the social queue and posted items. Report coverage and time to post.'},
 {n:6,status:'none',title:'Copy is high quality and always in a swifty voice',target:'Every post has love for Taylor, an opinion, and clowning where it fits. An automated score and a weekly human sample both stay above the agreed bar.',now:'A voice check exists in CI, but it tests rules, not quality. There is no score, no exemplar set and no review loop.',measure:'Score each item against a style guide with a second model pass, and have Joey rate a weekly sample of 10.'},
 {n:7,status:'off',title:'We post in the most important Reddit and Facebook conversations',target:'A daily set of the highest-value threads found, with comments posted in them at a safe, human pace.',now:'Crawlers find threads and send cards to Discord, and the owner posts by hand. Facebook groups are reachable by the crawlers. Posting itself is not automated.',measure:'Count threads found, cards acted on, and comments posted per week, by platform.'},
 {n:8,status:'off',title:'Our Reddit comments get upvotes',target:'Median score of at least 3 on posted comments, rising each month, shown on this dashboard.',now:'We currently do badly and nothing is tracked. There is no record of which comments were posted or how they scored.',measure:'Record every posted comment, then re-read its score at 1 hour, 24 hours and 7 days without a Reddit API key.'},
 {n:9,status:'off',title:'Our Reddit and Facebook comments get replies',target:'At least 30% of comments receive a reply. Reply count and sentiment are shown on this dashboard.',now:'Not tracked on either platform.',measure:'Re-read each posted comment for replies at the same intervals, and count them by platform.'},
 {n:10,status:'part',title:'New fan merch is found and posted automatically',target:'New items appear in the app without anyone touching them, every week.',now:'Official sync merged 35 PRs and Awin 38 PRs in 30 days, but the Awin sync succeeds on only 24% of runs and official sync on 60%. What each PR added is not counted.',measure:'Count distinct new merch items published per week, by source.'},
 {n:11,status:'none',title:'At least 3 new affiliate pieces per week that match what Taylor wears',target:'3 or more new merch items per week with a live affiliate link, each matched to a specific photo of Taylor.',now:'There is no count of affiliate items that are tied to a photo, so the weekly rate is unknown. The merch matcher exists but its output is not tracked.',measure:'Track items with a valid affiliate link and a linked photo, added per week.'}];
const base={window:'Sep 14 to Oct 15, 2026',snapshot:'2026-10-14',goals,kpis,producers,findings,fixes,gaps,kpiDefs,weeks,snap:{date:'2026-10-14',v:snapV},
 annotations:[{date:'2026-10-14',text:'Baseline captured. Dashboard built from 173 inventoried automations, 31,076 workflow runs and 1,078 PRs over 30 days.'}]};
const P=await import('./plan-data.mjs');
Object.assign(base,{goals:P.goals,findings:P.findings,roadmap:P.roadmap,decisions:P.decisions,avoid:P.avoid});
base.plan=JSON.parse(fs.readFileSync('C:/Users/Fourtys/Documents/Claude/plan-inputs/plan-items.json','utf8'));
const GP={
 1:{now:'No breaking lane and no definition of "critical" exist. Through the Vault the path is 24 to 48 hours; through the live feed it is up to 4 hours (real worker gaps are 4.5 to 10 hours) plus a 15-minute cache. Push already fires for confirmed items (5-minute delay for the top tier, then a 15-minute cron). Growth strategy: 12 of 21 events on the site within 48 hours, 1 of 21 on social within hours.'},
 2:{now:'Recall is not measured and the old recall check was retired on Sep 10. The growth strategy found 12 of 21 events on the site within 48 hours.'},
 3:{status:'part',now:'The Reddit crawl has been on since Sep 22 but runs RSS-only and Reddit rate-limits it. The theory miner found 0 theories in each of its last 3 runs and promotion considered 0 candidates. About 70 hand-authored theory records exist in the seed.'},
 4:{status:'part',target:'Every surface gated: 100% of new items have media, and no critical item is held for a missing image.',now:'A seed media gate already runs in CI and its legacy list is empty. The live feed holds items that have no image. The gaps are other content types, the social and merch surfaces, and critical items held for lack of an image.',measure:'Per-surface media rate each week, plus a count of critical items held for a missing image.'},
 5:{now:'Tree auto-approval (#5479) is merged. Retiring the Actions daily draft (#5484) is an open draft. The poster is stuck re-failing one Oct 11 Instagram item and social merged 0 PRs in the week of Oct 12. Nothing feeds Tree what just shipped.'},
 7:{now:'Reddit scans and reply drafts reach Discord as cards and you post by hand. No cards have arrived since Oct 12, because the answerer hit the weekly limit. The Facebook card\'s only link opens a Facebook search, not the post. Reddit cards carry no title, age or score.'},
 8:{measure:'A home reader reads the brand account\'s public comments page (Reddit\'s RSS has no scores) and records each comment\'s score at 1 hour, 24 hours and 7 days.'},
 9:{measure:'Count replies per posted comment. Facebook group replies come from your activity log through the export extension; Page replies come from the reply notifier.'},
 10:{now:'Fan-made discovery has run in dry-run on every schedule, so it files nothing: 0 new fan-made items since Aug 30. The 38 Awin PRs are advertiser-map churn that differs only by a timestamp.'},
 11:{now:'The matcher workflow passes stub functions and has never run, and the step that writes matched products is missing. The Awin sync hangs, so its product index is never saved. 0 Awin advertisers are joined and there is no Amazon tag. 94 moment products, 0 wrapped.'}};
base.goals=base.goals.map(g=>({...g,...(GP[g.n]||{})}));
const F=base.findings;
const sub=(i,fn)=>{F[i]=fn({...F[i]})};
F[0].ev.push('The limit classifier (session-outcome.mjs) does not recognise the new wording, so these runs stay red and keep generating failure issues. The answerer failures since Oct 12 are this same limit, not a missing prompt file.');
sub(3,f=>({...f,title:'The theory engine runs on thin, throttled input',one:'The crawl has been on since Sep 22, but it is RSS-only and throttled, so the miner finds nothing.',ev:['COMMUNITY_CRAWL_ENABLED has been true since Sep 22. The crawl runs RSS-only (no relay) and Reddit returns 429 for three of the main subreddits.','The last 3 miner runs read the same 100 bundles and found 0 theories. The last 2 promote runs considered 0 candidates.','Promotion needs 3 mentions and weaving needs 8, tuned for caution. About 70 hand-authored theory records are the whole database today.'],fix:'Feed the miner full threads from a home Reddit reader and the Facebook export, and lower promotion to 2 mentions with a heat score. Flow: Theory crawl, Clowning database. Goal 3.'}));
sub(4,f=>({...f,one:'Appearance discovery is 21% reliable and Awin sync finishes 0 of its last 20 runs.',ev:['appearance-discovery: 13 ok, 49 failed of 62 runs, and it failed again on Oct 15 with every channel feed returning HTTP 404. It is intermittent.','merch-awin-sync: 0 of the last 20 runs finish. The job hangs around feed 60 and is cancelled at 45 minutes, so the product index cache is never saved. merch-official-sync: 37 ok, 25 failed.','routine-tree-weekly-plan: 5 of 8 failed, with a turn-limit error (81 of 80 turns) on Oct 9.','Failure causes were collected for only about 22 runs.']}));
sub(5,f=>({...f,ev:['Social posts needed your reaction in #longlive-tree. Tree can now approve his own IG and X drafts: #5479 is merged in this repo.',...f.ev.slice(1)]}));
sub(6,f=>({...f,one:'161 social state PRs are open and cause about 79% of CI failures.',ev:f.ev.map(e=>e.replace(/154/g,'161'))}));
sub(7,f=>({...f,title:'Voice has no score, and media has real gaps beyond the seed gate',one:'The voice check catches only surname overuse and six AI phrases. A seed media gate exists, but other surfaces are unchecked.',ev:['scripts/check-voice.mjs catches only surname overuse and six AI-sounding phrases. No exemplar corpus, critic pass or score exists.','A seed media gate already exists (moment-media-gate.mjs inside validate:content, legacy list empty). The gaps are the live feed (items held for a missing image, including critical ones), social, merch and other content types.'],fix:'Add a voice critic with owner-picked exemplars, and audit media on every surface. Flow: CI build gate, Voice critic. Goals 4, 6.'}));
sub(8,f=>({...f,ev:['Social PRs merged per week: 24, 12, 20, 10, then 0.','social-poster: 113 failed of 522 runs. One Instagram item from Oct 11 is stuck more than 48 hours and fails every run; the X half is deferred. An X 403 is unverified.','Tree auto-approval (#5479) is merged and the Actions daily draft retirement (#5484) is an open draft, so part of the zero may be the handover. The Hermes side was not checked.']}));
F.push({sev:'warn',conf:'High',title:'Reddit cards are thin because the answerer sees only the title',one:'Cards carry no title, age or score, and replies are one generic sentence.',ev:['The awareness answerer sees only the thread title, may add no facts, and is capped at 300 characters.','Reddit\'s RSS carries no score or comment count, and the lead table has no score columns.','The Posted link records the thread but not your comment URL, so nothing can be measured afterwards.'],fix:'Give the drafter safe context, rank threads by age and size, and record the comment URL on Posted. Goals 7, 8, 9.'});
F.push({sev:'warn',conf:'Medium',title:'Held live-feed rows still send push events, and only the top tier has a kill window',one:'A row held for a missing image or redline can still trigger a push event; other tiers send with no delay.',ev:['emitLaunchCategoryEvent runs after the current_item insert even when the row is held (the sub-agent\'s reading, not tested).','The 5-minute kill window applies to song, album and tour pushes only.','There is no way to retract a live feed row or a sent push.'],fix:'Stop events for held rows, give every tier a kill window, add a PUSH_FREEZE switch and a retraction path. Goal 1.'});
F.push({sev:'bad',conf:'High',title:'Merch matching and fan-made discovery have produced nothing for six weeks',one:'The matcher workflow is a stub and fan-made discovery runs dry, so goals 10 and 11 are idle.',ev:['merch-matcher-authoring passes stub functions and has never run; the step that writes matched products is missing.','Scheduled fan-made discovery defaults to dry-run, so it files nothing: 0 new fan-made items since Aug 30.','94 moment products exist and none carry an affiliate link; 0 Awin advertisers are joined.'],fix:'Replace the stub with the real matcher, build the writer as a Vault lane, and turn scheduled discovery live. Goals 10, 11.'});
fs.writeFileSync('base.json',JSON.stringify(base));
let html=fs.readFileSync('dash.src.html','utf8');
const a=html.indexOf('/* ---------- flow ---------- */'), b=html.indexOf('/* ---------- automations table ---------- */');
if(a<0||b<0) throw new Error('flow markers missing');
html=html.slice(0,a)+fs.readFileSync('flow.js','utf8')+html.slice(b);
{const s=html.indexOf('/* ---------- roadmap ---------- */'), e=html.indexOf('/* ---------- true north goals ---------- */'); if(s<0||e<0) throw new Error('roadmap markers missing'); html=html.slice(0,s)+fs.readFileSync('plan-ui.js','utf8')+html.slice(e);}
{const s=html.indexOf('<!-- PLAN -->'), e=html.indexOf('<!-- AUTOMATIONS -->'); if(s<0||e<0) throw new Error('plan html markers missing'); html=html.slice(0,s)+fs.readFileSync('plan-ui.html','utf8')+html.slice(e);}
html=html.replace('__INV__',()=>JSON.stringify(inv)).replace('__BASE__',()=>JSON.stringify(base));
fs.writeFileSync('dashboard.html',html);
const m=html.match(/<script>([\s\S]*)<\/script>/i)[1];
try{new Function(m);console.log('syntax ok')}catch(e){console.log('SYNTAX',e.message)}
console.log(html.length,(contentMin/total).toFixed(3));
