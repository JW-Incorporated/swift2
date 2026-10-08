#!/usr/bin/env node
// Delegate a single mechanical/low-stakes task to the Gemini CLI to save Claude tokens.
// Usage: node scripts/ask-gemini.mjs "your prompt here"
//    or: echo "context" | node scripts/ask-gemini.mjs "your prompt here"

import { spawnSync } from "node:child_process";
import { runMain } from "./lib/cli.mjs";

function main() {
  const prompt = process.argv.slice(2).join(" ").trim();

  if (!prompt) {
    console.error("Usage: node scripts/ask-gemini.mjs \"<prompt>\"");
    return 1;
  }

  const quotedPrompt = `"${prompt.replace(/"/g, '\\"')}"`;
  const result = spawnSync(`gemini -p ${quotedPrompt}`, {
    stdio: ["inherit", "inherit", "inherit"],
    encoding: "utf-8",
    shell: true
  });

  if (result.error) {
    console.error(`Failed to run gemini CLI: ${result.error.message}`);
    return 1;
  }

  return result.status ?? 0;
}

runMain(main, { name: "ask-gemini" });
