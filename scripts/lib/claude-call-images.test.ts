import { readdirSync } from 'node:fs';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClaudeCaller } from './claude-call.mjs';
import {
  IMAGE_SECURITY_INSTRUCTION,
  MAX_CLAUDE_IMAGE_BYTES,
  stageClaudeImages,
} from './claude-call-images.mjs';
import {
  baseInput,
  schema,
  spawnReturning,
  successResult,
} from './claude-call-test-helpers';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = Buffer.from('RIFF0000WEBP');
const GIF = Buffer.from('GIF89a');

beforeEach(() => {
  vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-primary-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function flagValue(args: string[], flag: string) {
  const index = args.indexOf(flag);
  return index < 0 ? undefined : args[index + 1];
}

function fakeCliAllowsRead(args: string[], cwd: string, requestedPath: string) {
  if (flagValue(args, '--tools') !== 'Read' || flagValue(args, '--allowed-tools') !== 'Read') {
    return false;
  }
  if (!args.includes('--restricted')) return true;
  const fromCwd = relative(resolve(cwd), resolve(requestedPath));
  return fromCwd !== '..' && !fromCwd.startsWith(`..${sep}`) && !isAbsolute(fromCwd);
}

describe('Claude image staging', () => {
  it.each([
    ['image/jpeg', 'jpg', JPEG],
    ['image/png', 'png', PNG],
    ['image/webp', 'webp', WEBP],
    ['image/gif', 'gif', GIF],
  ])('accepts %s magic bytes and writes the matching extension', async (mimeType, extension, bytes) => {
    const directory = await mkdtemp(join(tmpdir(), 'claude-image-test-'));
    try {
      const [filename] = await stageClaudeImages([{ buffer: bytes, mimeType }], directory);
      expect(filename).toMatch(new RegExp(`^[a-f0-9]{32}\\.${extension}$`));
      await expect(readFile(join(directory, filename))).resolves.toEqual(bytes);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('copies a path input instead of exposing its original location', async () => {
    const sourceDir = await mkdtemp(join(tmpdir(), 'claude-image-source-'));
    const targetDir = await mkdtemp(join(tmpdir(), 'claude-image-target-'));
    const sourcePath = join(sourceDir, 'untrusted-name.bin');
    try {
      await writeFile(sourcePath, JPEG);
      const [filename] = await stageClaudeImages([
        { path: sourcePath, mimeType: 'image/jpeg' },
      ], targetDir);
      expect(filename).toMatch(/^[a-f0-9]{32}\.jpg$/);
      await expect(readFile(join(targetDir, filename))).resolves.toEqual(JPEG);
    } finally {
      await rm(sourceDir, { recursive: true, force: true });
      await rm(targetDir, { recursive: true, force: true });
    }
  });

  it.each([
    ['a non-array', 'not-an-array'],
    ['more than two images', [
      { buffer: JPEG, mimeType: 'image/jpeg' },
      { buffer: JPEG, mimeType: 'image/jpeg' },
      { buffer: JPEG, mimeType: 'image/jpeg' },
    ]],
    ['an unsupported MIME type', [{ buffer: JPEG, mimeType: 'image/jpg' }]],
    ['both source fields', [{ buffer: JPEG, path: 'photo.jpg', mimeType: 'image/jpeg' }]],
    ['mismatched magic bytes', [{ buffer: PNG, mimeType: 'image/jpeg' }]],
  ])('rejects %s before spawning', async (_name, images) => {
    const spawnImpl = spawnReturning({ stdout: successResult() });
    const callClaude = createClaudeCaller({ spawnImpl });
    await expect(callClaude({ ...baseInput, images, maxInputTokens: 10_000 }))
      .resolves.toMatchObject({ status: 'invalid' });
    expect(spawnImpl).not.toHaveBeenCalled();
  });

  it('enforces the configurable per-image byte limit', async () => {
    const spawnImpl = spawnReturning({ stdout: successResult() });
    const callClaude = createClaudeCaller({ spawnImpl });
    await expect(callClaude({
      ...baseInput,
      images: [{
        buffer: Buffer.alloc(MAX_CLAUDE_IMAGE_BYTES + 1),
        mimeType: 'image/jpeg',
      }],
      maxInputTokens: 10_000,
    })).resolves.toEqual({ status: 'invalid', reason: 'image exceeds the size limit' });
    expect(spawnImpl).not.toHaveBeenCalled();
  });

  it('removes an already-staged image when a later image fails validation', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'claude-image-invalid-'));
    const spawnImpl = spawnReturning({ stdout: successResult() });
    const callClaude = createClaudeCaller({
      spawnImpl,
      createTempDir: () => directory,
    });
    await expect(callClaude({
      ...baseInput,
      images: [
        { buffer: JPEG, mimeType: 'image/jpeg' },
        { buffer: PNG, mimeType: 'image/jpeg' },
      ],
      maxInputTokens: 10_000,
    })).resolves.toMatchObject({ status: 'invalid' });
    expect(spawnImpl).not.toHaveBeenCalled();
    await expect(access(directory)).rejects.toThrow();
  });
});

describe('Claude image call isolation', () => {
  it('uses exact Read-only restricted flags and denies a fake outside Read request', async () => {
    const fakeCli = spawnReturning({ stdout: successResult() });
    let cwd = '';
    let filename = '';
    let outsideReadAllowed = true;
    const spawnImpl = vi.fn((command: string, args: string[], options: { cwd: string }) => {
      cwd = options.cwd;
      filename = readdirSync(cwd)[0];
      outsideReadAllowed = fakeCliAllowsRead(args, cwd, resolve(cwd, '..', 'outside.png'));
      return fakeCli(command, args, options);
    });
    const callClaude = createClaudeCaller({ spawnImpl });

    await expect(callClaude({
      ...baseInput,
      images: [{ buffer: PNG, mimeType: 'image/png' }],
      maxInputTokens: 10_000,
    })).resolves.toMatchObject({ status: 'ok' });

    expect(outsideReadAllowed).toBe(false);
    const args = spawnImpl.mock.calls[0]?.[1] as string[];
    expect(fakeCliAllowsRead(args, cwd, join(cwd, filename))).toBe(true);
    expect(args).toEqual([
      '-p', '--output-format', 'json', '--safe-mode', '--setting-sources', '',
      '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
      '--restricted', '--tools', 'Read', '--allowed-tools', 'Read',
      '--permission-mode', 'dontAsk', '--permission-prompts', 'none',
      '--no-session-persistence', '--model', 'claude-haiku-5-5',
      '--system-prompt', `Return JSON.\n\n${IMAGE_SECURITY_INSTRUCTION}`,
      '--json-schema', JSON.stringify(schema),
    ]);
    expect(args).not.toContain('--add-dir');
    expect(fakeCli.mock.results[0]?.value.stdin.end).toHaveBeenCalledWith(
      `Answer yes.\n\nTrusted wrapper image files (working directory only):\n- ${filename}`,
    );
    await expect(access(cwd)).rejects.toThrow();
  });

  it.each([
    ['a CLI error', { code: 1, stderr: 'failed' }, 100],
    ['a timeout', { hang: true }, 1],
  ])('removes staged images and the temp directory after %s', async (_name, result, timeoutMs) => {
    const fakeCli = spawnReturning(result);
    let cwd = '';
    let stagedFiles: string[] = [];
    const spawnImpl = vi.fn((command: string, args: string[], options: { cwd: string }) => {
      cwd = options.cwd;
      stagedFiles = readdirSync(cwd);
      return fakeCli(command, args, options);
    });
    const callClaude = createClaudeCaller({ spawnImpl, timeoutMs });

    await expect(callClaude({
      ...baseInput,
      images: [{ buffer: GIF, mimeType: 'image/gif' }],
      maxInputTokens: 10_000,
    })).resolves.toMatchObject({ status: 'unavailable' });

    expect(stagedFiles).toHaveLength(1);
    expect(stagedFiles[0]).toMatch(/\.gif$/);
    await expect(access(cwd)).rejects.toThrow();
  });
});
