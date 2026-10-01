import { describe, expect, it } from 'vitest';
import {
  cronsInHeader,
  checkRoutineWorkflows,
  extractAllowedTools,
  extractCron,
  extractHeaderComment,
  extractName,
  listRoutineWorkflowFiles,
  runsPerWeek,
  taskJustification,
  templateQuotesAllowedTools,
  unquotedSpacedAllowedTools,
} from './check-routine-workflows.mjs';

describe('listRoutineWorkflowFiles', () => {
  it('picks routine-*.yml files and excludes the template', () => {
    expect(
      listRoutineWorkflowFiles([
        'routine-template.yml',
        'routine-karen-nightly.yml',
        'ci.yml',
        'routine-vault-run.yml',
      ]),
    ).toEqual(['routine-karen-nightly.yml', 'routine-vault-run.yml']);
  });
});

describe('extractors', () => {
  const sample = `# header line 1
# mentions cron 17 11 * * 0 for context
name: routine-example

on:
  schedule:
    - cron: "17 11 * * 0"
  workflow_dispatch:

jobs:
  run:
    uses: ./.github/workflows/routine-template.yml
    with:
      allowed_tools: "Bash,Read,Task"
`;

  it('extractName finds the top-level name', () => {
    expect(extractName(sample)).toBe('routine-example');
  });

  it('extractCron finds the schedule cron string', () => {
    expect(extractCron(sample)).toBe('17 11 * * 0');
  });

  it('extractAllowedTools splits the comma list', () => {
    expect(extractAllowedTools(sample)).toEqual(['Bash', 'Read', 'Task']);
  });

  it('extractAllowedTools returns [] when the input is absent', () => {
    expect(extractAllowedTools('name: x\n')).toEqual([]);
  });

  it('extractHeaderComment stops at the first non-comment line', () => {
    expect(extractHeaderComment(sample)).toBe(
      '# header line 1\n# mentions cron 17 11 * * 0 for context',
    );
  });

  it('cronsInHeader pulls every cron-shaped substring out of the header', () => {
    const header = extractHeaderComment(sample);
    expect(cronsInHeader(header)).toEqual(['17 11 * * 0']);
  });
});

describe('taskJustification', () => {
  it('finds a justifying comment near a Task mention', () => {
    const text = '# Task is in allowed_tools deliberately — invariant #4 allows it.\n';
    expect(taskJustification(text)).not.toBeNull();
  });

  it('returns null when Task appears with no justification language', () => {
    expect(taskJustification('allowed_tools: "Bash,Task"\n')).toBeNull();
  });
});

describe('runsPerWeek', () => {
  it('daily single-fire cadence is 7/week', () => {
    expect(runsPerWeek('7 16 * * *')).toBe(7);
  });
  it('weekly (single dow) cadence is 1/week', () => {
    expect(runsPerWeek('17 11 * * 0')).toBe(1);
  });
  it('multi-dow cadence multiplies by the day count', () => {
    expect(runsPerWeek('20 18 * * 2,5')).toBe(2);
  });
  it('multi-hour-per-day cadence multiplies runs/day', () => {
    expect(runsPerWeek('23 1,13 * * *')).toBe(14);
  });
  it('returns null for cadences this checker does not model (step/range/dom)', () => {
    expect(runsPerWeek('*/15 * * * *')).toBeNull();
    expect(runsPerWeek('0 9 15 * *')).toBeNull();
  });
  it('returns null for malformed input', () => {
    expect(runsPerWeek('not a cron')).toBeNull();
    expect(runsPerWeek('')).toBeNull();
  });
});

describe('checkRoutineWorkflows — the whole gate as a pure function', () => {
  const good = (name: string, cron: string, tools = 'Bash,Read') => `# ${name}, cron ${cron}\nname: ${name}\non:\n  schedule:\n    - cron: "${cron}"\njobs:\n  run:\n    uses: ./.github/workflows/routine-template.yml\n    with:\n      allowed_tools: "${tools}"\n`;

  it('passes a well-formed fleet and reports a cadence sum', () => {
    const files = {
      '.github/workflows/routine-a.yml': good('routine-a', '0 12 * * *'),
      '.github/workflows/routine-b.yml': good('routine-b', '0 9 * * 0'),
    };
    const { problems, report } = checkRoutineWorkflows(files);
    expect(problems).toEqual([]);
    expect(report.some((l: string) => l.includes('Fleet total: 8'))).toBe(true);
  });

  it('flags a Task grant with no justification', () => {
    const files = {
      '.github/workflows/routine-a.yml': good('routine-a', '0 12 * * *', 'Bash,Task'),
    };
    const { problems } = checkRoutineWorkflows(files);
    expect(problems.some((p: string) => p.includes('Task'))).toBe(true);
  });

  it('allows a Task grant with a justifying comment', () => {
    const text =
      '# Task is in allowed_tools deliberately -- invariant #4 justifies it here.\nname: routine-a\non:\n  schedule:\n    - cron: "0 12 * * *"\njobs:\n  run:\n    uses: ./.github/workflows/routine-template.yml\n    with:\n      allowed_tools: "Bash,Task"\n';
    const { problems } = checkRoutineWorkflows({
      '.github/workflows/routine-a.yml': text,
    });
    expect(problems.some((p: string) => p.includes('Task'))).toBe(false);
  });

  it('flags a header comment cron that disagrees with the real schedule', () => {
    const text =
      '# routine-a, cron 0 11 * * * (stale note)\nname: routine-a\non:\n  schedule:\n    - cron: "0 12 * * *"\njobs:\n  run:\n    uses: ./.github/workflows/routine-template.yml\n    with:\n      allowed_tools: "Bash"\n';
    const { problems } = checkRoutineWorkflows({
      '.github/workflows/routine-a.yml': text,
    });
    expect(problems.some((p: string) => p.includes('header comment quotes cron'))).toBe(true);
  });

  it('flags a file missing a name or schedule', () => {
    const text = 'on:\n  workflow_dispatch:\njobs:\n  run:\n    uses: ./x.yml\n';
    const { problems } = checkRoutineWorkflows({
      '.github/workflows/routine-a.yml': text,
    });
    expect(problems.some((p: string) => p.includes('no top-level `name:`'))).toBe(true);
    expect(problems.some((p: string) => p.includes('no `on.schedule.cron`'))).toBe(true);
  });

  it('accepts a workflow_dispatch-only routine whose header says dispatch-only', () => {
    const text = '# routine-chat — dispatch-only: fired once per message by bot-chat-poll.yml\nname: routine-chat\non:\n  workflow_dispatch:\n    inputs:\n      message_id:\n        type: string\njobs:\n  run:\n    uses: ./.github/workflows/routine-template.yml\n    with:\n      allowed_tools: "Bash"\n';
    const { problems, report } = checkRoutineWorkflows({ '.github/workflows/routine-chat.yml': text });
    expect(problems).toEqual([]);
    expect(report.some((l: string) => l.includes('dispatch-only → 0'))).toBe(true);
    expect(report.some((l: string) => l.includes('not modeled'))).toBe(false);
  });

  it('still flags a schedule-less routine that does not declare itself dispatch-only', () => {
    const text = '# routine-chat, fired by hand\nname: routine-chat\non:\n  workflow_dispatch:\njobs:\n  run:\n    uses: ./.github/workflows/routine-template.yml\n';
    const { problems } = checkRoutineWorkflows({ '.github/workflows/routine-chat.yml': text });
    expect(problems.some((p: string) => p.includes('no `on.schedule.cron`'))).toBe(true);
  });
});

describe('allowedTools quoting (claude-code-action splits claude_args with shell-quote)', () => {
  const spaced = (tools: string) => `# routine-a, cron 0 12 * * *\nname: routine-a\non:\n  schedule:\n    - cron: "0 12 * * *"\njobs:\n  run:\n    uses: ./.github/workflows/routine-template.yml\n    with:\n      allowed_tools: "${tools}"\n`;
  const QUOTED = 'claude_args: "--model m --allowedTools \\"${{ inputs.allowed_tools }}\\" --max-turns 3"';
  const UNQUOTED = 'claude_args: "--model m --allowedTools ${{ inputs.allowed_tools }} --max-turns 3"';
  const files = { '.github/workflows/routine-a.yml': spaced('Bash(gh issue comment:*),Bash(node:*),Read') };

  it('templateQuotesAllowedTools sees the quoted form only', () => {
    expect(templateQuotesAllowedTools(QUOTED)).toBe(true);
    expect(templateQuotesAllowedTools("claude_args: '--allowedTools \"${{ inputs.allowed_tools }}\"'")).toBe(true);
    expect(templateQuotesAllowedTools(UNQUOTED)).toBe(false);
    expect(templateQuotesAllowedTools('no claude args here')).toBe(false);
  });

  it('passes spaced entries when the template quotes the list', () => {
    expect(checkRoutineWorkflows(files, { template: QUOTED }).problems).toEqual([]);
  });

  it('fails the template and every spaced entry when the list is unquoted', () => {
    const { problems } = checkRoutineWorkflows(files, { template: UNQUOTED });
    expect(problems.some((p: string) => p.includes('routine-template.yml') && p.includes('not followed by a quoted'))).toBe(true);
    expect(problems.some((p: string) => p.includes('routine-a.yml') && p.includes('Bash(gh issue comment:*)'))).toBe(true);
  });

  it('does not flag space-free lists even when the template is unquoted', () => {
    const { problems } = checkRoutineWorkflows({ '.github/workflows/routine-a.yml': spaced('Bash(gh:*),Read') }, { template: UNQUOTED });
    expect(problems.some((p: string) => p.includes('routine-a.yml'))).toBe(false);
  });

  it('flags a routine writing its own claude_args with an unquoted spaced entry, not a quoted one', () => {
    expect(unquotedSpacedAllowedTools('claude_args: "--allowedTools Bash(gh issue comment:*),Read"')).toEqual(['Bash(gh']);
    expect(unquotedSpacedAllowedTools("claude_args: '--allowedTools \"Bash(gh issue comment:*),Read\"'")).toEqual([]);
    expect(unquotedSpacedAllowedTools('claude_args: "--allowedTools Bash(gh:*),Read --max-turns 3"')).toEqual([]);
    const own = `${spaced('Bash,Read')}      claude_args: "--allowedTools Bash(gh issue comment:*)"\n`;
    expect(checkRoutineWorkflows({ '.github/workflows/routine-a.yml': own }).problems.some((p: string) => p.includes('unquoted'))).toBe(true);
  });
});
