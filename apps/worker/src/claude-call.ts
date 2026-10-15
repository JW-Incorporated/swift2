import { callClaude as sharedCallClaude } from '../../../scripts/lib/claude-call.mjs';

export type ClaudePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type ClaudeImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
export type ClaudeImageInput =
  | { buffer: Buffer; path?: never; mimeType: ClaudeImageMimeType }
  | { path: string; buffer?: never; mimeType: ClaudeImageMimeType };

export interface ClaudeCallInput {
  caller: string;
  priority: ClaudePriority;
  model: string;
  system: string;
  user: string;
  schema?: Record<string, unknown>;
  maxInputTokens?: number;
  maxCalls?: number;
  images?: ClaudeImageInput[];
}

export type ClaudeCallResult<T = unknown> =
  | { status: 'ok'; data: T; usage?: unknown; loggerError?: boolean }
  | {
      status: 'invalid' | 'capped' | 'unavailable';
      reason: string;
      usage?: unknown;
      loggerError?: boolean;
    };

export type WorkerClaudeCaller = <T = unknown>(
  input: ClaudeCallInput,
) => Promise<ClaudeCallResult<T>>;

export const callWorkerClaude: WorkerClaudeCaller = <T>(input: ClaudeCallInput) => (
  sharedCallClaude(input) as Promise<ClaudeCallResult<T>>
);

export function hasClaudeSubscriptionToken(): boolean {
  return Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN);
}
