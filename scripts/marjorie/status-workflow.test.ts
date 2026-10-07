import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const status = read('.github/workflows/marjorie-status.yml');
const brief = read('.github/workflows/routine-marjorie-brief.yml');
const job = (text: string, name: string, next: string) => text.slice(text.indexOf(`\n  ${name}:`), next ? text.indexOf(`\n  ${next}:`) : undefined);

describe('marjorie-status.yml', () => {
  it('fires hourly, on HA/social pushes to main, on demand, and on issue comments', () => {
    expect(status).toContain('cron: "7 * * * *"');
    expect(status).toMatch(/push:\n {4}branches: \[main\]\n {4}paths:\n {6}- HUMAN-ACTIONS\.md\n {6}- "social\/\*\*"/);
    expect(status).toContain('workflow_dispatch');
    expect(status).toMatch(/issue_comment:\n {4}types: \[created\]/);
  });
  it('starts with no permissions and grants each job only what it needs', () => {
    expect(status).toMatch(/\npermissions: \{\}\n/);
    const render = job(status, 'render', 'heal');
    expect(render).toMatch(/permissions:\n {6}contents: read\n {6}issues: write\n {6}pull-requests: read/);
    // Two secrets, each visible to exactly one step: the daily traffic cache and the change ping.
    expect(render.match(/secrets\.[A-Z_]+/g)).toEqual(['secrets.VERCEL_TOKEN', 'secrets.DISCORD_MARJORIE_WEBHOOK_URL']);
    const [traffic, rewrite] = render.split('      - name: ').slice(-2);
    expect(traffic).toContain('status-traffic.mjs');
    expect(traffic).toContain('VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}');
    expect(traffic).not.toContain('DISCORD');
    expect(rewrite).toContain('status-page.mjs --apply --notify');
    expect(rewrite).toContain('DISCORD_MARJORIE_WEBHOOK_URL: ${{ secrets.DISCORD_MARJORIE_WEBHOOK_URL }}');
    expect(rewrite).not.toContain('VERCEL');
    expect(render).toContain('environment: ops');
    expect(render).toMatch(/- uses: actions\/checkout@v7\n {8}with:\n {10}ref: main/);
    expect(render).toMatch(/concurrency:\n {6}group: marjorie-status-render\n {6}cancel-in-progress: false/);
    expect(render).toContain("if: github.event_name != 'issue_comment' && github.ref == 'refs/heads/main'");
  });
  it('auto-closes verified human actions hourly on the heal lane, through the rolling close PR', () => {
    const auto = job(status, 'autoclose', 'reply');
    expect(auto).toContain("github.event_name != 'push'");
    expect(auto).toMatch(/group: marjorie-status-heal\n {6}cancel-in-progress: false/);
    expect(auto).toContain('token: ${{ secrets.SOCIAL_POSTER_PAT }}');
    expect(auto).toContain('node scripts/human-actions/auto-close.mjs');
  });
  it('keeps the rolling close PR mergeable: a heal job on its own lane, never in the reply group', () => {
    const heal = job(status, 'heal', 'reply');
    expect(heal).toContain("if: github.event_name != 'issue_comment' && github.ref == 'refs/heads/main'");
    expect(heal).toMatch(/permissions:\n {6}contents: write\n {6}pull-requests: write\n/);
    expect(heal).toMatch(/group: marjorie-status-heal\n {6}cancel-in-progress: false/);
    expect(heal).not.toContain('group: marjorie-status-reply');
    expect(heal).toContain('token: ${{ secrets.SOCIAL_POSTER_PAT }}');
    expect(heal).toContain('node scripts/marjorie/status-heal.mjs');
  });
  it('lets only the owner\'s own comment on a status-page issue reach the reply job', () => {
    const reply = job(status, 'reply', '');
    const cond = reply.slice(reply.indexOf('if: >-'), reply.indexOf('runs-on'));
    for (const clause of [
      "github.event_name == 'issue_comment'",
      "github.event.action == 'created'",
      '!github.event.issue.pull_request',
      "github.event.comment.user.login == 'sffan15-sys'",
      "github.event.comment.user.type == 'User'",
      `contains(fromJSON('["OWNER","MEMBER","COLLABORATOR"]'), github.event.comment.author_association)`,
      "contains(github.event.issue.labels.*.name, 'status-page')",
    ]) expect(cond).toContain(clause);
  });
  it('never executes anything but main and never interpolates comment text into a shell', () => {
    for (const checkout of status.split('actions/checkout@v7').slice(1)) expect(checkout.slice(0, 120)).toContain('ref: main');
    expect(status).not.toMatch(/github\.event\.(comment|issue)\.(body|title)/);
    const reply = job(status, 'reply', '');
    expect(reply).toContain('token: ${{ secrets.SOCIAL_POSTER_PAT }}');
    expect(reply).toMatch(/concurrency:\n(?: {6}#[^\n]*\n)* {6}group: marjorie-status-reply\n {6}cancel-in-progress: false/);
    expect(reply).not.toContain('comment.id }}\n      cancel');
    expect(reply).toContain('git checkout --force --quiet main');
  });
  it('may dispatch the free-text relay, with actions: write on the reply job only', () => {
    expect(job(status, 'reply', '')).toContain('actions: write');
    expect(job(status, 'render', 'reply')).not.toContain('actions: write');
  });
  it('posts acks with the workflow token so an ack is never an owner comment', () => {
    const reply = job(status, 'reply', '');
    const act = reply.slice(reply.indexOf("name: Act on the owner's command"), reply.indexOf('name: Re-render'));
    expect(act).toContain('GH_TOKEN: ${{ github.token }}');
    expect(act).toContain('PR_TOKEN: ${{ secrets.SOCIAL_POSTER_PAT }}');
  });
});

describe('routine-marjorie-brief.yml delivery', () => {
  const deliver = job(brief, 'deliver', '');
  it('posts the shared change line (only when the page changed), not a brief issue', () => {
    expect(deliver).toContain('node scripts/marjorie/status-page.mjs --apply --notify');
    expect(deliver).not.toContain('post-or-mail.mjs');
    expect(deliver).not.toContain('/tmp/ping.md');
    expect(deliver).not.toContain('founders-brief');
    expect(deliver).not.toContain('gh issue create');
    expect(deliver).toContain('status-note.mjs stamp-ping');
  });
  it('can read pull requests so it can render the page', () => {
    expect(deliver).toMatch(/permissions:\n {6}contents: read\n {6}issues: write\n {6}pull-requests: read/);
  });
});

describe('routine-marjorie-status-reply.yml', () => {
  const relay = read('.github/workflows/routine-marjorie-status-reply.yml');
  it('is dispatch-only, one lane per comment, and says so in its header', () => {
    expect(relay).toMatch(/^# .*dispatch-only/m);
    expect(relay).not.toContain('schedule:');
    expect(relay).toMatch(/^on:\n {2}workflow_dispatch:\n {4}inputs:\n {6}comment_id:/m);
    expect(relay).toContain('concurrency:\n  group: marjorie-status-reply-${{ inputs.comment_id }}\n  cancel-in-progress: false');
  });
  it('re-verifies the comment before the agent sees it, and never hands the agent a Discord credential', () => {
    expect(relay).toContain('status-relay.mjs context');
    expect(relay).toContain("if: needs.context.outputs.skip != 'true'");
    expect(relay).toContain('pre_run_artifact: status-reply-context');
    expect(relay).toContain('ref: main');
    expect(relay).not.toMatch(/DISCORD/);
    expect(relay).not.toMatch(/Write|Edit/);
  });
});
