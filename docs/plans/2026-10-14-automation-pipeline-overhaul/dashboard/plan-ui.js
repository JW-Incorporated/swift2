/* ---------- plan and tracking ---------- */
const PL = BASE.plan;
const OWNER = {
  'executor-claude-sonnet':['content','Claude Sonnet'],
  'executor-claude-haiku':['content','Claude Haiku'],
  'claude-opus':['content','Claude Opus'],
  'codex':['ops','Codex'],
  'jev':['ops','Jev'],
  'script':['ops','Plain code'],
  'hermes-session':['ops','Hermes session'],
  'OWNER ACTION':['warn','Owner action'],
  'OWNER DECISION':['warn','Owner decision']
};
const ownerPill = o => { const x = OWNER[o] || ['none', o]; return `<span class="pill p-${x[0]}">${esc(x[1])}</span>`; };
const STAT = {todo:['none','To do'],doing:['content','In progress'],review:['warn','In review'],done:['good','Done'],blocked:['bad','Blocked']};
let TRACK = {};
const PFIL = {phase:'all', owner:'all', goal:'all'};
const TFIL = {phase:'all', status:'all'};
const itemStatus = id => (TRACK[id] && TRACK[id].status) || 'todo';
const prLink = pr => { if (!pr) return '—'; const n = String(pr).replace(/\D/g,''); return n ? `<a href="https://github.com/JW-Incorporated/Swift2/pull/${n}" target="_blank" rel="noopener">#${n}</a>` : esc(pr); };

function drawPlanStatic(){
  $('#planTitle').textContent = PL.meta.title;
  $('#planSummary').textContent = PL.meta.summary;
  $('#planPrinciples').innerHTML = PL.principles.map(x => `<li>${esc(x)}</li>`).join('');
  $('#planPhases').innerHTML = PL.phases.map(p => `<div class="kpi"><div class="l">${esc(p.id)} · ${PL.items.filter(i=>i.phase===p.id).length} items</div><div style="font-weight:600;margin:2px 0">${esc(p.name)}</div><div class="d">${esc(p.goal)}</div><div class="d" style="margin-top:4px"><b>Done when:</b> ${esc(p.exitCriteria)}</div></div>`).join('');
  $('#taxTable').innerHTML = `<thead><tr><th>Class</th><th>What it is</th><th class="num">Act now</th><th class="num">Haiku below</th><th class="num">Human below</th><th>Action, push, social, SLA</th></tr></thead><tbody>` +
    PL.taxonomy.map(t => `<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.definition)}<details><summary class="note">Signals and Jev questions</summary><div class="note"><b>Signals:</b> ${t.signals.map(esc).join('; ')}<br>${(t.jevQuestions||[]).map(q=>`<b>${esc(q.type)}</b> ${esc(q.id)}: ${esc(q.instructions)}`).join('<br>')}</div></details></td><td class="num">${t.thresholds.actNow}</td><td class="num">${t.thresholds.haikuFallbackBelow}</td><td class="num">${t.thresholds.humanReviewBelow}</td><td><div><b>Action:</b> ${esc(t.action)}</div><div><b>Push:</b> ${esc(t.notification)}</div><div><b>Social:</b> ${esc(t.social)}</div><div><b>Site:</b> ${esc(t.site)}</div><div><b>SLA:</b> ${esc(t.sla)}</div></td></tr>`).join('') + '</tbody>';
  $('#seenDesign').textContent = PL.seenTracking.design;
  $('#seenTable').innerHTML = `<thead><tr><th>Source</th><th>Key it already has</th></tr></thead><tbody>` + PL.seenTracking.keys.map(k => `<tr><td>${esc(k.source)}</td><td class="mono">${esc(k.key)}</td></tr>`).join('') + '</tbody>';
  $('#balTable').innerHTML = `<thead><tr><th>Work</th><th>Where</th><th>Model</th></tr></thead><tbody>` + PL.codexClaudeBalance.map(b => `<tr><td>${esc(b.workType)}<div class="note">${esc(b.why)}</div></td><td>${esc(b.where)}</td><td>${esc(b.model)}<div class="note">${esc(b.effort)}</div></td></tr>`).join('') + '</tbody>';
  $('#tokTable').innerHTML = `<thead><tr><th>Routine or task</th><th>Today</th><th>New home</th><th>Saving</th></tr></thead><tbody>` + PL.tokenModel.map(t => `<tr><td>${esc(t.task)}</td><td>${esc(t.from)}</td><td>${esc(t.to)}<div class="note">${esc(t.notes)}</div></td><td>${esc(t.estSavingPctOrTurns)}</td></tr>`).join('') + '</tbody>';
  $('#decisions').innerHTML = PL.decisions.map(d => `<li><b>${esc(d.id)}. ${esc(d.question)}</b><div style="color:var(--ink2)"><b>Recommended:</b> ${esc(d.recommendation)}</div>${d.why?`<div class="note">${esc(d.why)}</div>`:''}</li>`).join('');
  $('#ownerActions').innerHTML = PL.ownerActions.map(a => `<details class="card" style="padding:10px 12px"><summary><b>${esc(a.id)}</b> ${esc(a.title)}</summary><ol style="margin:8px 0 0;padding-left:20px;color:var(--ink2);display:grid;gap:4px">${a.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></details>`).join('');
  $('#avoid').innerHTML = BASE.avoid.map(x => `<li>${esc(x)}</li>`).join('');
}

function drawPlanItems(){
  const phases = [['all','All phases'], ...PL.phases.map(p => [p.id, p.id])];
  const owners = [['all','Anyone'], ...[...new Set(PL.items.map(i => i.owner))].map(o => [o, (OWNER[o]||[0,o])[1]])];
  const goals = [['all','Any goal'], ...[1,2,3,4,5,6,7,8,9,10,11].map(g => [String(g), 'Goal ' + g])];
  const sel = (id, opts, cur) => `<select id="${id}" aria-label="${id}">${opts.map(([v,l]) => `<option value="${esc(v)}" ${String(cur)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
  $('#planFilters').innerHTML = sel('pfPhase', phases, PFIL.phase) + sel('pfOwner', owners, PFIL.owner) + sel('pfGoal', goals, PFIL.goal);
  $('#pfPhase').onchange = e => { PFIL.phase = e.target.value; drawPlanItems(); };
  $('#pfOwner').onchange = e => { PFIL.owner = e.target.value; drawPlanItems(); };
  $('#pfGoal').onchange = e => { PFIL.goal = e.target.value; drawPlanItems(); };
  const rows = PL.items.filter(i => (PFIL.phase==='all'||i.phase===PFIL.phase) && (PFIL.owner==='all'||i.owner===PFIL.owner) && (PFIL.goal==='all'||i.goals.includes(+PFIL.goal)));
  $('#planList').innerHTML = rows.map(i => { const s = STAT[itemStatus(i.id)];
    return `<details class="card" style="padding:10px 12px"><summary style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;cursor:pointer"><b class="mono">${esc(i.id)}</b><span style="flex:1 1 260px;font-weight:600">${esc(i.title)}</span>${ownerPill(i.owner)}<span class="pill p-none">${esc(i.effort)}</span><span class="pill p-${s[0]}">${s[1]}</span></summary>
    <div style="display:grid;gap:6px;margin-top:8px"><div style="color:var(--ink2)">${esc(i.summary)}</div>
    <div class="note">Goals ${i.goals.join(', ')} · lane ${esc(i.lane)} · model ${esc(i.model||'—')} · depends on ${i.deps.length?i.deps.map(esc).join(', '):'nothing'}${i.needsDecision?' · needs an owner decision':''}${i.needsHumanAction?' · needs an owner action':''}</div>
    <div class="fix" style="background:var(--surface2);border-radius:4px;padding:8px 10px"><b>Proof it worked.</b> ${esc(i.acceptance)}</div>
    <div class="note"><b>Token impact:</b> ${esc(i.tokenImpact)}</div>
    <div class="note"><b>Risks:</b> ${esc(i.risks)}</div>
    <div class="note"><b>Files:</b> ${i.files.map(f=>`<span class="mono">${esc(f)}</span>`).join(', ')}</div></div></details>`; }).join('') || '<div class="note">No items match.</div>';
}

function drawTrack(){
  const items = PL.items, total = items.length;
  const cnt = {todo:0,doing:0,review:0,done:0,blocked:0}; items.forEach(i => cnt[itemStatus(i.id)]++);
  $('#trackKpis').innerHTML = [['Done', `${cnt.done} of ${total}`, pct(cnt.done/total)+' complete', cnt.done? 'good':'warn'], ['In progress', cnt.doing+cnt.review, `${cnt.doing} building, ${cnt.review} in review`, 'warn'], ['Blocked', cnt.blocked, cnt.blocked?'Needs attention':'Nothing blocked', cnt.blocked?'bad':'good'], ['To do', cnt.todo, 'Not started', 'warn']]
    .map(([l,v,d,s]) => `<div class="kpi ${s}"><div class="l">${l}</div><div class="v">${esc(v)}</div><div class="d">${esc(d)}</div></div>`).join('');
  $('#trackPhases').innerHTML = PL.phases.map(p => { const its = items.filter(i => i.phase===p.id), d = its.filter(i => itemStatus(i.id)==='done').length;
    return `<div class="r"><div class="t">${esc(p.id)} ${esc(p.name)}</div><div class="bar"><i style="width:${its.length?(d/its.length*100).toFixed(1):0}%;background:var(--content)"></i></div><div class="n">${d} of ${its.length} done</div></div>`; }).join('');
  const phases = [['all','All phases'], ...PL.phases.map(p => [p.id, p.id])], stats = [['all','Any status'], ...Object.entries(STAT).map(([k,v]) => [k, v[1]])];
  const sel = (id, opts, cur) => `<select id="${id}" aria-label="${id}">${opts.map(([v,l]) => `<option value="${esc(v)}" ${cur===v?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
  $('#trackFilters').innerHTML = sel('tfPhase', phases, TFIL.phase) + sel('tfStatus', stats, TFIL.status);
  $('#tfPhase').onchange = e => { TFIL.phase = e.target.value; drawTrack(); };
  $('#tfStatus').onchange = e => { TFIL.status = e.target.value; drawTrack(); };
  const rows = items.filter(i => (TFIL.phase==='all'||i.phase===TFIL.phase) && (TFIL.status==='all'||itemStatus(i.id)===TFIL.status));
  $('#trackTable').innerHTML = `<thead><tr><th>Item</th><th>Owner</th><th>Status</th><th>PR</th><th>Done</th><th>Note</th></tr></thead><tbody>` + rows.map(i => { const t = TRACK[i.id] || {}, s = STAT[itemStatus(i.id)];
    return `<tr><td><b class="mono">${esc(i.id)}</b> ${esc(i.title)}</td><td>${ownerPill(i.owner)}</td><td><span class="pill p-${s[0]}">${s[1]}</span></td><td>${prLink(t.pr)}</td><td class="mono">${esc(t.doneAt||'—')}</td><td class="note">${esc(t.note||'')}</td></tr>`; }).join('') + '</tbody>';
}

drawPlanStatic(); drawPlanItems(); drawTrack();

