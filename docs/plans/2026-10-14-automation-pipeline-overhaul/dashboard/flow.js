/* ---------- flow ---------- */
const COLX = [30,205,380,555,730,905], BW = 150, BH = 54, RSTEP = 90;
const LANES_OLD = [['App content: Vault','content'],['Breaking news','content'],['App content: live feed','content'],['Merch and affiliate','content'],['Theories and clowning','content'],['Quality and voice','content'],['Social','social'],['Reddit and Facebook','social'],['Bots, ops and budget','ops']];
/* st: ex = exists today, chg = exists and changes, new = to build */
const N_OLD = {
 detect:{c:0,r:0,t:'content',st:'chg',n:'Detectors',s:'intake issues · no LLM',ids:['appearance-discovery.yml','cie-scan.yml'],d:'Daily scanners that file intake and CIE tickets and stage social drafts. Appearance discovery was patched on Oct 6 but failed again on Oct 15, so judge it on the last 7 days, not the 30-day blend.',flag:'Appearance flaky',chg:'Crawl and theory miner move to the Theories row. Gains intake from the recall audit and promoted theories.'},
 vault:{c:1,r:0,t:'content',st:'chg',n:'Vault Run',s:'Opus · 6 lanes · daily',ids:['routine-vault-run.yml'],d:'The one LLM producer of seed content. One Claude session runs up to six lanes (Content Shift, Answerer, Photo Enrichment, Rumor Desk, Cross-Link, Stylist) and opens one PR a day. Content Shift is capped at 3 items a run by design, so even a fully funded run adds about 3 moments a day.',flag:'Weekly limit stops it',chg:'One job per lane so a slow lane cannot starve the rest. Each PR body carries a yield record (items added, edited, skipped, voice score).'},
 gate:{c:2,r:0,t:'content',st:'chg',n:'CI build gate',s:'validate · media · voice · tests',ids:['ci.yml'],d:'The required check: schema, sourcing, voice rules, privacy, generated vault and the full test suite. Shared by content, social and code PRs. It has no media-completeness rule today.',flag:'1,422 failures',chg:'Adds check-media.mjs: every new moment needs a photo, video or social post, or a named exception. Existing offenders sit on a ratcheting list. The voice critic score joins the gate.'},
 merge:{c:3,r:0,t:'content',st:'ex',n:'Auto-merge',s:'allowlist · keepup',ids:['auto-merge-content.yml','auto-merge-keepup.yml'],d:'Arms native auto-merge when every changed path is on the content allowlist and no hold label is set. Keepup re-syncs stale branches. Median time to merge is about 14 minutes.'},
 ship:{c:4,r:0,t:'content',st:'ex',n:'Publish bundle',s:'Supabase · Vercel · OTA',ids:['content-publish.yml'],d:'Builds the content bundle on every push to main, mirrors it to Supabase Storage. The web build and the mobile OTA update pick it up.'},
 app:{c:5,r:0,t:'content',st:'ex',n:'Long Live app',s:'web + iOS + Android',ids:[],d:'What users see: era stream, moment detail, track guides, theories and eggs, threads and clue web, mood and Clownbot chat, merch, countdown, search, notifications.'},

 breaking:{c:0,r:1,t:'content',st:'new',n:'Breaking poll',s:'every 10 min · primary sources',ids:['breaking-lane.yml'],d:'New workflow dispatched by the bot clock. Polls a short list of primary sources only: official YouTube channels, taylorswift.com and the store (site-diff), Google News, Bluesky and GDELT. A zero-LLM keyword gate writes a breaking candidate.',flag:'SLA 60 min'},
 classify:{c:1,r:1,t:'content',st:'new',n:'Critical classifier',s:'Sonnet · two-outlet rule',ids:['breaking-lane.yml'],d:'One budget-capped Sonnet call returns tier, category, confidence and sources. Code, not the model, checks the rule: an official source or two independent outlets. "Critical" is defined in a written policy the owner approves once.'},
 livegate:{c:2,r:1,t:'content',st:'new',n:'Live gate',s:'media required · redlines',ids:[],d:'A confirmed story is written to the live feed only if it has an image and passes the privacy redlines. A redline hit is dropped, never stored.'},
 push:{c:5,r:1,t:'content',st:'new',n:'Live card + push',s:'ISR 15 min · governor',ids:[],d:'The live card appears within one 15-minute cache window and a push goes out through the notification governor. Breaking news gets no exemption from the governor.'},

 news:{c:0,r:2,t:'content',st:'chg',n:'News worker',s:'ingest · 4-hourly',ids:['news-worker.yml'],d:'Pulls RSS, Google News, GNews, Bluesky, Tumblr, Reddit RSS, site-diff and GDELT every 4 hours. This is the structural delay behind the 1-hour goal.',chg:'Stays as the broad sweep. Fast detection moves to the breaking row.'},
 extract:{c:1,r:2,t:'content',st:'ex',n:'Extract',s:'Haiku · current_item',ids:[],d:'Haiku classifies and extracts items, then writes current_item, fan_signal and live_theory rows.'},
 triage:{c:2,r:2,t:'content',st:'ex',n:'News triage',s:'Sonnet · daily',ids:['routine-news-triage.yml'],d:'Judgment layer over the digest. Files intake issues for the Vault Run. Failed on the weekly Claude limit on Oct 14.',flag:'Weekly limit'},
 recall:{c:3,r:2,t:'content',st:'new',n:'Recall audit',s:'weekly · reference list',ids:['news-recall.yml'],d:'A zero-LLM weekly diff of our stories against a reference list from Google News, top fan posts and official channels. Reports recall within 48 hours and, for critical stories, within 1 hour. Misses file intake issues automatically.'},
 db:{c:4,r:2,t:'content',st:'ex',n:'Live feed tables',s:'current_item · live_theory',ids:[],d:'Database tables the app reads for the live feed and the Clownbot board. Not part of the Vault bundle.'},

 merchdetect:{c:0,r:3,t:'content',st:'ex',n:'Merch detect',s:'fan-made · verify · audit',ids:['merch-fanmade.yml','merch-verify.yml','merch-audit-detect.yml'],d:'Files fan-made merch candidates daily with no LLM, and checks links. Curation into the seed is a judged step that is not clearly scheduled.'},
 merch:{c:1,r:3,t:'content',st:'ex',n:'Merch syncs',s:'official + Awin index',ids:['merch-official-sync.yml','merch-awin-sync.yml'],d:'Pulls official store pages and the Awin product index. The Awin PRs are coverage-map updates, not new items in the app. Fixed Oct 6; use the 7-day rate.',flag:'Awin flaky'},
 matcher:{c:2,r:3,t:'content',st:'new',n:'Photo to merch matcher',s:'vision + Awin · E6 writer',ids:['merch-matcher.yml','merch-matcher-authoring.yml'],d:'The matcher and authoring plan exist, but the step that writes matched products onto moments is not built. Target is a Vault lane run twice a week, capped at 3 looks, with a weekly spend cap.',flag:'Writer not built'},
 affiliate:{c:3,r:3,t:'content',st:'chg',n:'Affiliate seam',s:'Awin / Amazon tags',ids:[],d:'Code is ready and counsel signed off on Aug 30, but the affiliate tags are not set in Vercel, so no link earns anything.',flag:'Tags unset',chg:'Owner sets the IDs. A visible disclosure line is added wherever an affiliate link shows.'},

 crawl:{c:0,r:4,t:'content',st:'ex',n:'Theory crawl',s:'Reddit RSS · FB export · Haiku',ids:['community-crawl.yml','theory-miner.yml'],d:'A year-deep Reddit crawl plus the weekly Facebook export feeds a Haiku theory miner. The crawl ships switched off, so the green runs ingested nothing.',flag:'Switch OFF'},
 theorydb:{c:1,r:4,t:'content',st:'chg',n:'Clowning database',s:'promote · weave · live_theory',ids:['theory-promote.yml','theory-weaving-intake.yml'],d:'Promotes recurring theories and files weaving intake for the Vault. About 74 hand-authored theory records exist in the seed today.',chg:'Promotion bar drops from 3 mentions to 2, with a heat score. Adds first seen, last seen, status and source threads. Relationship and identity speculation stays excluded.'},

 voice:{c:1,r:5,t:'content',st:'new',n:'Voice critic',s:'Sonnet · exemplars · weekly sample',ids:['voice-sample.yml'],d:'A separate Sonnet pass scores each item on love, insight, opinion, clowning fit and AI tells against an exemplar set the owner picks. Below 3 on any dimension, rewrite once. A weekly sample of 20 feeds the dashboard.'},
 cie:{c:2,r:5,t:'content',st:'ex',n:'CIE scan',s:'tickets · daily',ids:['cie-scan.yml','routine-karen-nightly.yml','routine-kevin-s1-karen-solver.yml'],d:'The knowledge-engine scan files fact and image tickets; Karen and Kevin judge and solve them. Report PRs wait about 20 hours to merge.'},
 austin:{c:3,r:5,t:'content',st:'ex',n:'Austin build',s:'Claude routine',ids:['routine-austin-build.yml'],d:'Builds approved tickets into PRs. Parks PRs for human review when the Codex companion is missing on the runner.'},

 inbox:{c:0,r:6,t:'social',st:'chg',n:'Inbox',s:'intake · fact sheets',ids:['social-event-dispatch.yml'],d:'Intake issues and fact sheets from merch and appearance sync, plus the weekly calendar. Event dispatch runs every two hours.',chg:'Gains a feed of content that just shipped, and breaking stories from the classifier, so new site content is first in line.'},
 tree:{c:1,r:6,t:'social',st:'ex',n:'Tree',s:'bot · daily draft',ids:['routine-tree-daily-draft.yml','routine-tree-weekly-plan.yml'],d:'Discord bot and social manager. Writes an Instagram and X pair into the queue each day. Moving from Actions routines to a Hermes daily loop. Never edits app content. The poster publishes one item per platform per day.',flag:'10 of 32 drafts failed'},
 sgate:{c:2,r:6,t:'social',st:'ex',n:'Queue PR + CI',s:'check-drafts · tests',ids:[],d:'Every queue change is a PR that runs the full build. The poster files a state PR after each post; 154 are open with a failing test.',flag:'154 PRs stuck'},
 approve:{c:3,r:6,t:'social',st:'ex',n:'Approval',s:'tree-auto or owner ✅',ids:['social-approval-poll.yml','social-approval-notify.yml'],d:'Used to need the owner reaction in #longlive-tree. Tree can now stamp his own IG and X drafts (#5479); that change lives on the Hermes side and was not confirmed in this repo.'},
 poster:{c:4,r:6,t:'social',st:'ex',n:'Social poster',s:'every 30 min · clock',ids:['social-poster.yml'],d:'Posts to X, Instagram and the Facebook Page, then moves items to posted or failed. 113 failed runs in 30 days; one Instagram post and an X 403 fail every run.',flag:'Last run failed'},
 out:{c:5,r:6,t:'social',st:'ex',n:'X · IG · Facebook',s:'live accounts',ids:['social-reply-notifier.yml'],d:'Live accounts. The reply notifier reads Page comments and DMs and pings #longlive-tree; replies stay human.'},

 cscan:{c:0,r:7,t:'social',st:'ex',n:'Community scans',s:'Reddit RSS · Gmail · FB export',ids:['community-scan.yml','community-awareness-scan.yml','community-inbox.yml'],d:'Anonymous Reddit RSS about every 20 minutes, Gmail for replies to us, and the owner\'s weekly Facebook export. There is no Facebook crawler by an Aug 11 ruling; no Reddit API key, ever.'},
 answer:{c:1,r:7,t:'social',st:'ex',n:'Reply drafters',s:'Sonnet · no shell',ids:['routine-community-answerer.yml'],d:'Drafts comment replies for the best threads. 7 of 31 runs failed.'},
 cards:{c:2,r:7,t:'social',st:'ex',n:'Discord cards',s:'Posted / Skip links',ids:['community-mailer.yml','community-awareness-deliver.yml'],d:'Sends each thread and draft to Discord with signed Posted and Skip links.'},
 owner:{c:3,r:7,t:'ops',st:'ex',n:'Owner posts',s:'human · brand account',ids:[],d:'The owner posts by hand from the brand account, about 10 to 15 minutes a day. This keeps ban risk low and is the main cap on volume.'},
 outcomes:{c:4,r:7,t:'social',st:'new',n:'Outcomes reader',s:'upvotes · replies · via relay',ids:['community-outcomes.yml'],d:'Daily job that reads the brand account\'s public comment feed through a residential relay (GitHub IPs are blocked), records each comment\'s score and replies at 1 hour, 24 hours and 7 days, and adds Page reply counts. No API key.',flag:'Needs HOME_RELAY_URL'},
 comm:{c:5,r:7,t:'social',st:'ex',n:'Reddit · FB groups',s:'public threads',ids:[],d:'The conversations we want to be in: r/TaylorSwift, r/swifties and fan Facebook groups.'},

 clock:{c:0,r:8,t:'ops',st:'ex',n:'Clock',s:'bot-chat-poll · */5',ids:['bot-chat-poll.yml'],d:'GitHub cron drops most fast schedules, so this workflow polls chat and dispatches other jobs on a clock. Largest runner-time user, 47% of runs cancelled. The repo is public, so these minutes are not billed.',flag:'34% of runner time'},
 marj:{c:1,r:8,t:'ops',st:'chg',n:'Marjorie',s:'bot · site ops',ids:['routine-marjorie-ops.yml','routine-marjorie-triage.yml','routine-marjorie-brief.yml'],d:'Discord bot for Long Live site operations. Hourly ops, daily brief, triage. Ops hit its turn limit and the weekly limit.',flag:'Ops 76% ok',chg:'Ops drops from hourly to every 3 hours and chat routines move to a cheaper model.'},
 chan:{c:2,r:8,t:'ops',st:'ex',n:'Discord channels',s:'#longlive-tree · -marjorie',ids:['marjorie-status.yml'],d:'Founder-facing surface for both bots. Marjorie posts nothing in #longlive-tree.'},
 bot1:{c:3,r:8,t:'ops',st:'ex',n:'bot1 (Hermes1)',s:'Hermes server · #longlive',ids:['marjorie-bot1-bridge.yml'],d:'The third bot, on the Hermes home server. Marjorie can hand it up to three items a day.'},
 watch:{c:4,r:8,t:'ops',st:'ex',n:'Watchdog',s:'alerts · triage sweep',ids:['watchdog.yml'],d:'Files watchdog alerts and routine-failure issues. 21 alerts are open.'},
 budget:{c:5,r:8,t:'ops',st:'new',n:'LLM budget',s:'two pools · turn ledger · limit alert',ids:['routine-template.yml'],d:'Content producers get their own credential or reserved budget with a per-run dollar cap. A named "weekly limit" alert pauses non-content routines until reset. A weekly turn ledger shows spend per routine.',flag:'One shared token today'},
};
const E_OLD = [
 ['detect','vault'],['vault','gate'],['gate','merge'],['merge','ship'],['ship','app'],
 ['breaking','classify','new'],['classify','livegate','new'],['livegate','db','new'],['db','push','new'],['push','app','new'],['classify','inbox','dash new'],
 ['news','extract'],['extract','triage'],['triage','detect','dash'],['extract','db'],['db','app'],['recall','detect','dash new'],['db','recall','dash new'],
 ['merchdetect','merch'],['merch','gate'],['merch','matcher','new'],['matcher','affiliate','new'],['affiliate','gate','new'],
 ['crawl','theorydb'],['theorydb','db'],['theorydb','detect','dash new'],
 ['vault','voice','dash new'],['voice','gate','new'],['cie','austin'],['austin','gate'],
 ['ship','inbox','new'],['inbox','tree'],['tree','sgate'],['sgate','approve'],['approve','poster'],['poster','out'],
 ['cscan','answer'],['answer','cards'],['cards','owner'],['owner','comm'],['comm','outcomes','dash new'],['outcomes','cscan','dash new'],['cscan','crawl','dash'],
 ['clock','marj','dash'],['clock','poster','dash'],['clock','breaking','dash new'],['marj','chan'],['marj','bot1','dash'],['marj','vault','dash'],['tree','chan','dash'],['poster','watch','dash'],
 ['budget','vault','dash new'],['budget','marj','dash new'],['budget','watch','dash new'],
];
const _PF = BASE.plan && BASE.plan.flowTarget;
const LANES = _PF ? BASE.plan.lanes.slice().sort((a,b)=>a.r-b.r).map(l=>[l.label,l.t]) : LANES_OLD;
const N = _PF ? BASE.plan.flowTarget.nodes : N_OLD;
const E = _PF ? BASE.plan.flowTarget.edges : E_OLD;
function agg(ids){ const rows = ids.map(i=>INV.find(x=>x.id===i)).filter(Boolean); const r = rows.filter(x=>x.runs!=null);
  return {rows, runs:r.reduce((s,x)=>s+x.runs,0), ok:r.reduce((s,x)=>s+x.ok,0), fail:r.reduce((s,x)=>s+x.fail,0), can:r.reduce((s,x)=>s+x.can,0), min:r.reduce((s,x)=>s+x.min,0)}; }
let FLOWMODE = 'target', SELNODE = 'vault';
function drawFlow(){
  const tgt = FLOWMODE === 'target';
  const vis = id => tgt || N[id].st !== 'new';
  const rowsUsed = [...new Set(Object.entries(N).filter(([id]) => vis(id)).map(([,n]) => n.r))].sort((a,b)=>a-b);
  const ry = r => 52 + rowsUsed.indexOf(r) * RSTEP;
  const H = 52 + rowsUsed.length * RSTEP;
  $('#flow').setAttribute('viewBox', `0 0 1100 ${H}`);
  let svg = '';
  rowsUsed.forEach(r => { const [l,t] = LANES[r]; svg += `<g class="lane"><rect x="0" y="${ry(r)-16}" width="1100" height="${BH+32}" fill="var(--${t})" opacity=".06"/><text x="8" y="${ry(r)-4}">${esc(l)}</text></g>`; });
  ['Detect','Produce','Check','Merge','Ship','Reach'].forEach((h,i) => { svg += `<text class="colh" x="${COLX[i]}" y="14">${h}</text>`; });
  E.forEach(([a,b,k]) => { const kk = (k||''); const isNew = kk.includes('new'); if (!vis(a) || !vis(b) || (!tgt && isNew)) return;
    const A=N[a], B=N[b]; const x1=COLX[A.c]+BW, y1=ry(A.r)+BH/2, x2=COLX[B.c], y2=ry(B.r)+BH/2; let d;
    if (x2 > x1) { const m=(x1+x2)/2; d=`M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}`; }
    else if (A.c===B.c) { const xm=COLX[A.c]+BW/2; d = ry(A.r)<ry(B.r) ? `M${xm} ${ry(A.r)+BH} L${xm} ${ry(B.r)}` : `M${xm} ${ry(A.r)} L${xm} ${ry(B.r)+BH}`; }
    else { const ya = ry(A.r)<ry(B.r) ? ry(A.r)+BH : ry(A.r), yb = ry(A.r)<ry(B.r) ? ry(B.r) : ry(B.r)+BH; const xa=COLX[A.c]+BW/2, xb=COLX[B.c]+BW/2; d=`M${xa} ${ya} C${xa} ${(ya+yb)/2} ${xb} ${(ya+yb)/2} ${xb} ${yb}`; }
    svg += `<path class="edge ${kk.includes('dash')?'dash':''} ${isNew?'newe':''}" d="${d}"/>`; });
  Object.entries(N).forEach(([id,n]) => { if (!vis(id)) return; const a = agg(n.ids); const isNew = n.st==='new'; const h = health(!isNew && a.runs ? a.ok/Math.max(1,a.ok+a.fail):null);
    const col = `var(--${n.t})`; const stroke = isNew ? col : h[0]==='bad'?'var(--bad)':h[0]==='warn'?'var(--warn)':col;
    const sub = isNew ? n.s : (a.runs ? `${fmt(a.runs)} runs · ${pct(a.ok/Math.max(1,a.ok+a.fail))}` : n.s);
    const x = COLX[n.c], y = ry(n.r);
    svg += `<g class="node ${id===SELNODE?'sel':''}" tabindex="0" role="button" data-id="${id}" aria-label="${esc(n.n)}"><rect class="box" x="${x}" y="${y}" width="${BW}" height="${BH}" rx="4" stroke="${stroke}" ${isNew?'stroke-dasharray="5 3"':''}/><rect x="${x}" y="${y}" width="5" height="${BH}" rx="2" fill="${col}"/><text x="${x+14}" y="${y+21}">${esc(n.n)}</text><text class="s" x="${x+14}" y="${y+37}">${esc(sub)}</text>${tgt&&isNew?`<text class="tagn" x="${x+BW-8}" y="${y+14}" text-anchor="end">NEW</text>`:''}${tgt&&n.st==='chg'?`<text class="tagc" x="${x+BW-8}" y="${y+14}" text-anchor="end">CHANGES</text>`:''}${n.flag?`<text class="fl" x="${x+14}" y="${y+BH+11}">${esc(n.flag)}</text>`:''}</g>`; });
  $('#flow').innerHTML = svg;
  document.querySelectorAll('.node').forEach(g => { g.onclick = () => pick(g.dataset.id); g.onkeydown = e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); pick(g.dataset.id);} }; });
  const cnt = {new:0,chg:0}; Object.values(N).forEach(n => { if (n.st==='new') cnt.new++; if (n.st==='chg') cnt.chg++; });
  $('#flowCount').textContent = tgt ? `${cnt.new} nodes to build, ${cnt.chg} to change, ${Object.keys(N).length - cnt.new - cnt.chg} unchanged.` : `${Object.keys(N).length - cnt.new} nodes running today.`;
}
function pick(id){
  SELNODE = id; const n = N[id], a = agg(n.ids), isNew = n.st==='new', v = a.runs ? a.ok/Math.max(1,a.ok+a.fail) : null, h = health(isNew ? null : v);
  document.querySelectorAll('.node').forEach(g => g.classList.toggle('sel', g.dataset.id===id));
  const feeds = n.t==='content';
  $('#nodePanel').innerHTML = `<div class="head"><h3>${esc(n.n)}</h3><span class="pill p-${n.t}">${feeds?'Feeds the app':n.t==='social'?'Social only':'Bots and ops'}</span>${isNew?'<span class="pill p-warn">To build</span>':`<span class="pill p-${h[0]}">${h[2]} ${h[1]}</span>`}</div>
  <div class="note" style="max-width:80ch;color:var(--ink2)">${esc(n.d)}</div>
  ${n.chg?`<div class="fix" style="background:var(--surface2);border-radius:4px;padding:8px 10px"><b>Target change.</b> ${esc(n.chg)}</div>`:''}
  ${!isNew && a.runs?`<div class="mgrid"><div><b>${fmt(a.runs)}</b><span>runs in 30 days</span></div><div><b>${pct(v)}</b><span>reliability</span></div><div><b>${fmt(a.fail)}</b><span>failed</span></div><div><b>${fmt(a.can)}</b><span>cancelled</span></div><div><b>${fmt(a.min)}</b><span>wall-clock min</span></div></div>`:`<div class="note">${isNew?'Not built yet, so there are no runs to measure.':'No workflow runs of its own in the window (data store, external service, human step or not yet inventoried).'}</div>`}
  ${a.rows.length?`<div class="note">Workflows: ${a.rows.map(r=>`<span class="mono">${esc(r.id)}</span>`).join(', ')}</div>`:''}`;
}
document.querySelectorAll('[data-flow]').forEach(b => b.onclick = () => { FLOWMODE = b.dataset.flow; document.querySelectorAll('[data-flow]').forEach(x=>x.setAttribute('aria-pressed', x===b)); if (FLOWMODE==='current' && N[SELNODE].st==='new') SELNODE='vault'; drawFlow(); pick(SELNODE); });
drawFlow(); pick('vault');

