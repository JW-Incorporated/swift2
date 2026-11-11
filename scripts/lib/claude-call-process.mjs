const ENV_ALLOWLIST = [
  'PATH',
  'HOME',
  'USERPROFILE',
  'APPDATA',
  'LOCALAPPDATA',
  'TEMP',
  'TMP',
  'TMPDIR',
  'SystemRoot',
  'ComSpec',
];

export function inputTokenEstimate(system, user) {
  return Math.ceil(Buffer.byteLength(`${system}\n${user}`, 'utf8') / 4);
}

function number(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function usageOf(result) {
  const usage = result?.usage ?? {};
  return {
    inputTokens: number(usage.input_tokens),
    cacheCreationInputTokens: number(usage.cache_creation_input_tokens),
    cacheReadInputTokens: number(usage.cache_read_input_tokens),
    outputTokens: number(usage.output_tokens),
  };
}

export function childEnv(token) {
  const env = {};
  for (const key of ENV_ALLOWLIST) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  env.CLAUDE_CODE_OAUTH_TOKEN = token;
  return env;
}

export function resultOf(stdout) {
  if (!stdout) return null;
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

export function runCli(spawnImpl, args, options, user, timeoutMs) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawnImpl('claude', args, options);
    } catch {
      resolve(null);
      return;
    }

    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // The timeout result is authoritative even when process cleanup fails.
      }
      finish({ timedOut: true, stdout, stderr });
    }, timeoutMs);

    try {
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr?.on('data', (chunk) => {
        stderr += chunk;
      });
      child.on('error', () => finish(null));
      child.on('close', (code) => finish({ code, stdout, stderr, timedOut: false }));
      child.stdin?.on('error', () => finish(null));
      child.stdin?.end(user);
    } catch {
      finish(null);
    }
  });
}
