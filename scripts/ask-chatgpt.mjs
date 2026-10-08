#!/usr/bin/env node
// Delegate a task to ChatGPT/GPT-5.5 via the already-authenticated `codex`
// CLI (auth mode: chatgpt — the same login used for /codex:review, not a
// separate API key). `codex exec` is a full agentic runner: it can read/
// edit files and run shell commands in this repo, not just answer text.
//
// Usage: node scripts/ask-chatgpt.mjs "your prompt here"

import { spawnSync } from "node:child_process";
import { runMain } from "./lib/cli.mjs";

function main() {
  const prompt = process.argv.slice(2).join(" ").trim();

  if (!prompt) {
    console.error('Usage: node scripts/ask-chatgpt.mjs "<prompt>"');
    return 1;
  }

  const quotedPrompt = `"${prompt.replace(/"/g, '\\"')}"`;
  const result = spawnSync(`codex exec ${quotedPrompt}`, {
    stdio: ["inherit", "inherit", "inherit"],
    encoding: "utf-8",
    shell: true,
  });

  if (result.error) {
    console.error(`Failed to run codex CLI: ${result.error.message}`);
    return 1;
  }

  return result.status ?? 0;
}

runMain(main, { name: "ask-chatgpt" });
