#!/usr/bin/env node
// Delegate a task to ChatGPT/GPT-5.5 via the already-authenticated `codex`
// CLI (auth mode: chatgpt — the same login used for /codex:review, not a
// separate API key). `codex exec` is a full agentic runner: it can read/
// edit files and run shell commands in this repo, not just answer text.
//
// Usage: node scripts/ask-chatgpt.mjs "your prompt here"

import { spawnSync } from "node:child_process";

const prompt = process.argv.slice(2).join(" ").trim();

if (!prompt) {
  console.error('Usage: node scripts/ask-chatgpt.mjs "<prompt>"');
  process.exit(1);
}

const quotedPrompt = `"${prompt.replace(/"/g, '\\"')}"`;
const result = spawnSync(`codex exec ${quotedPrompt}`, {
  stdio: ["inherit", "inherit", "inherit"],
  encoding: "utf-8",
  shell: true,
});

if (result.error) {
  console.error(`Failed to run codex CLI: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
