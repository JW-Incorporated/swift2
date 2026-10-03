// Release-train step 1 (replaces the EAS workflow's fingerprint + get-build
// jobs): per platform, compute the native fingerprint with the EAS CLI and
// look up an existing finished production build for it. Writes the train
// state file (argv[2]) and GITHUB_OUTPUT lines. Any CLI failure throws, so the
// step goes red and nothing downstream mutates.
import { appendFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decide, fingerprintArgs, initialState, listArgs, parseFingerprint, pickExisting, runEas } from './train-lib.mjs';

const eas = (args) => runEas(args, { timeout: 600000 });

function lookup(platform) {
  const hash = parseFingerprint(
    eas(fingerprintArgs(platform)),
  );
  if (!hash) throw new Error(`could not read a ${platform} fingerprint hash from eas fingerprint:generate`);
  const existing = pickExisting(
    eas(listArgs(platform, hash)));
  return { hash, existing };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const statePath = process.argv[2];
  const force = process.env.FORCE === 'true';
  const planOnly = process.env.PLAN_ONLY === 'true';
  const a = lookup('android');
  const i = lookup('ios');
  const decision = decide({ android: a.existing, ios: i.existing, force });
  writeFileSync(statePath, JSON.stringify(initialState({ android: a.existing, ios: i.existing, decision })));
  const mutate = !planOnly;
  const out = {
    mutate,
    build_android: mutate && decision.buildAndroid,
    build_ios: mutate && decision.buildIos,
    update: mutate ? decision.update : 'none',
  };
  const lines = Object.entries(out).map(([k, v]) => `${k}=${v}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n');
  const row = (n, hash, ex, b) => `| ${n} | \`${hash.slice(0, 12)}\` | ${ex ? ex.id : 'none'} | ${b ? 'store build' : 'reuse'} |`;
  const md = [
    '## Release plan',
    `force_store_build: ${force} | plan_only: ${planOnly} | OTA: ${decision.update}${planOnly ? ' (not executed)' : ''}`,
    '',
    '| Platform | Fingerprint | Existing build | Decision |',
    '|---|---|---|---|',
    row('Android', a.hash, a.existing, decision.buildAndroid),
    row('iOS', i.hash, i.existing, decision.buildIos),
  ].join('\n');
  console.error(md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
}
