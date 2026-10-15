import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../../docs/content-ops/voice-exemplars/', import.meta.url));
const ENTRY = /^- ((?:EX-[SV]|CX-)\d+) \| ([^|]+) \| (.+)$/;

export function parseCorpus(markdown) {
  const entries = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = ENTRY.exec(line);
    if (match) entries.push({ id: match[1], source: match[2].trim(), text: match[3].trim() });
  }
  return entries;
}

export function loadCorpus(dir = DIR) {
  const read = (name) => parseCorpus(readFileSync(`${dir}${name}`, 'utf8'));
  return {
    exemplars: [...read('exemplars-social.md'), ...read('exemplars-vault.md')],
    counterExamples: read('counter-examples.md'),
  };
}
