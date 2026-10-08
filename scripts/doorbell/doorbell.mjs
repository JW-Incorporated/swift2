// Long Live Doorbell (Marjorie Overhaul M7, docs/specs/marjorie-overhaul/m7-doorbell.md;
// install, update, stop and logs: docs/ops/doorbell.md). A systemd service on
// the Hermes VM host, outside every Hermes container. Two tokens, read only
// from /etc/longlive-doorbell.env:
//   DOORBELL_DISCORD_TOKEN  the Long Live Doorbell bot: reads #longlive-marjorie
//                           and #longlive-tree and adds reactions there; it can
//                           post nowhere (HA #73)
//   DOORBELL_GITHUB_TOKEN   longlive-doorbell-dispatch: Actions read and write
//                           on swift2 only (HA #74)
//
// For each founder message in either channel, or a thread under one, it adds
// 👀 and dispatches that bot's chat routine. STUCK_MS later, with no ✅ or ❌
// from a bot account, it adds ⚠️ and dispatches bot-chat-alarm.yml. It never
// posts, never adds ✅ or ❌, never touches a bot or webhook message, and never
// logs a token or message text. The 5-minute poll stays the fallback.
//
// No dependencies: node: builtins and repo files only, so a bare clone runs it.
//   node scripts/doorbell/doorbell.mjs           run until stopped
//   node scripts/doorbell/doorbell.mjs --check   print the config and exit; never connects
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BOTS, CLAIM, FAILED, REPLIED } from '../marjorie/lib/chat-inbox.mjs';
import { DISCORD_API, defaultSleep, discordRequest, reactionUrl } from '../marjorie/lib/discord-bot.mjs';
import {
  ALARM_WORKFLOW, INTENTS, STUCK, STUCK_MS,
  chatDispatch, createChannelMap, createSeen, parseConfig, printable, readyLine, ringDecision, stuckDecision, stuckDispatch,
} from './lib/doorbell-core.mjs';
import { connectGateway } from './lib/gateway.mjs';
import { githubRequest } from './lib/github-rest.mjs';
import { checkLines, createClock } from './lib/clock.mjs';

const HOUR_MS = 60 * 60 * 1000;

const systemdNotify = (state) => execFile('systemd-notify', [state], { timeout: 10_000 }, () => {});

export function createDoorbell({ config, fetchImpl = fetch, sleepImpl = defaultSleep, timers = globalThis, log = console.log,
  now = Date.now, processStartMs = now(), notify = systemdNotify }) {
  const channels = createChannelMap({ guildId: config.guildId });
  const seen = createSeen();
  const pending = new Map();
  let gateway = null;
  let stoppedReminder = null;
  let announced = '';
  const clock = createClock({ githubToken: config.githubToken, fetchImpl, timers, log, now, processStartMs, progress: () => notify('WATCHDOG=1') });

  const discord = async (method, url) => {
    try {
      return await discordRequest(method, url, config.discordToken, { fetchImpl, sleepImpl });
    } catch (err) {
      return { ok: false, status: `network error (${err.message})`, data: null };
    }
  };
  const github = (request) => githubRequest(request, config.githubToken, { fetchImpl });

  function announce() {
    const line = readyLine(channels.ids(), config.founders);
    if (line !== announced) log(line);
    announced = line;
  }

  async function checkStuck(place, messageId) {
    pending.delete(messageId);
    const where = place.threadId || place.channelId;
    const users = (emoji) => discord('GET', `${DISCORD_API}/channels/${where}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}?limit=100`);
    const state = stuckDecision(await users(REPLIED), await users(FAILED));
    if (state === 'settled' || state === 'gone') return;
    if (state === 'stuck') {
      const mark = await discord('PUT', reactionUrl(where, messageId, STUCK));
      if (!mark.ok) log(`${STUCK} on ${messageId} refused (HTTP ${mark.status})`);
    }
    const alarm = await github(stuckDispatch(place, messageId));
    const why = state === 'stuck' ? 'no reply' : 'reactions unreadable';
    log(`${place.bot} ${messageId}: ${why} after ${STUCK_MS / 60_000} min → ${alarm.ok ? `dispatched ${ALARM_WORKFLOW}` : `${ALARM_WORKFLOW} dispatch failed (HTTP ${alarm.status})`}`);
  }

  async function ring(place, messageId) {
    const where = place.threadId || place.channelId;
    const claim = await discord('PUT', reactionUrl(where, messageId, CLAIM));
    if (!claim.ok) log(`${CLAIM} on ${messageId} refused (HTTP ${claim.status}); dispatching anyway`);
    const { workflow } = BOTS[place.bot];
    const sent = await github(chatDispatch(place, messageId));
    log(sent.ok ? `rang ${place.bot} ${messageId} → ${workflow}` : `${workflow} dispatch for ${messageId} failed (HTTP ${sent.status}); the poll picks it up`);
    const timer = timers.setTimeout(() => {
      checkStuck(place, messageId).catch((err) => log(`stuck check for ${messageId} failed: ${err.message}`));
    }, STUCK_MS);
    pending.set(messageId, timer);
  }

  async function onMessage(message) {
    const decide = () => ringDecision(message, { channels, founders: config.founders, seen, now: now(), guildId: config.guildId });
    let decision = decide();
    if (decision.lookup) {
      seen.add(message.id);
      const found = await discord('GET', `${DISCORD_API}/channels/${decision.lookup}`);
      if (!found.ok || !found.data) {
        log(`channel ${decision.lookup} unreadable (HTTP ${found.status}); message ${message.id} left to the poll`);
        return;
      }
      channels.channel(found.data);
      decision = ringDecision(message, { channels, founders: config.founders, seen: createSeen(), now: now(), guildId: config.guildId });
      if (decision.lookup) {
        log(`channel ${printable(decision.lookup)} has no known parent; message ${printable(message.id)} left to the poll`);
        return;
      }
    }
    if (!decision.ring) return;
    seen.add(message.id);
    await ring(decision.ring, message.id);
  }

  function onDispatch(type, data) {
    if (type === 'READY') {
      log(`gateway: connected as ${printable(data?.user?.username || 'the doorbell bot')}`);
    } else if (type === 'GUILD_CREATE') {
      channels.guild(data);
      announce();
    } else if (type === 'CHANNEL_CREATE' || type === 'CHANNEL_UPDATE') {
      channels.channel(data);
      announce();
    } else if (type === 'THREAD_CREATE' || type === 'THREAD_UPDATE') {
      channels.channel(data);
    } else if (type === 'CHANNEL_DELETE' || type === 'THREAD_DELETE') {
      channels.forget(data?.id);
    } else if (type === 'THREAD_LIST_SYNC') {
      channels.threadListSync(data);
    } else if (type === 'MESSAGE_CREATE') {
      onMessage(data).catch((err) => log(`message ${printable(data?.id)} failed: ${printable(err.message)}`));
    }
  }

  return {
    channels,
    seen,
    pending,
    clock,
    onDispatch,
    onMessage,
    start(WebSocketImpl) {
      gateway = connectGateway({
        token: config.discordToken, intents: INTENTS, onDispatch, log, WebSocketImpl, timers,
        onFatal: (code) => {
          stoppedReminder = timers.setInterval(() => log(`gateway still stopped since close ${code}; fix the bot, then restart the service`), HOUR_MS);
        },
      });
      clock.start();
      notify('READY=1');
    },
    stop() {
      gateway?.stop();
      for (const timer of pending.values()) timers.clearTimeout(timer);
      pending.clear();
      if (stoppedReminder) timers.clearInterval(stoppedReminder);
      clock.stop();
    },
  };
}

function check(config, { log, major, hasWebSocket }) {
  log('doorbell --check: config only; nothing connects');
  log(`node ${process.versions.node}${major < 22 ? ' (too old: needs 22 or newer)' : ''}`);
  log(`DOORBELL_DISCORD_TOKEN: ${config.discordToken ? 'set' : 'missing'}`);
  log(`DOORBELL_GITHUB_TOKEN: ${config.githubToken ? 'set' : 'missing'}`);
  log(`guild: ${config.guildId || 'any guild the bot is in'}`);
  log(`founders: ${config.founders.size} Discord id(s)`);
  for (const cfg of Object.values(BOTS)) log(`#${cfg.channelName} → ${cfg.workflow}`);
  log(`stuck alarm: ${STUCK_MS / 60_000} min → ${ALARM_WORKFLOW}`);
  log('clock: pinned schedule (next 10 UTC fires)');
  for (const line of checkLines()) log(`  ${line}`);
  for (const problem of config.problems) log(`problem: ${problem}`);
  const ok = config.ok && major >= 22 && hasWebSocket;
  log(ok ? 'config OK' : 'config NOT OK');
  return ok ? 0 : 1;
}

export async function main(argv = process.argv.slice(2), {
  env = process.env, fetchImpl = fetch, WebSocketImpl = globalThis.WebSocket, log = console.log,
  onSignal = (signal, handler) => process.on(signal, handler),
} = {}) {
  const processStartMs = Date.now();
  const config = parseConfig(env);
  const major = Number(process.versions.node.split('.')[0]);
  const hasWebSocket = typeof WebSocketImpl === 'function';
  if (argv.includes('--check')) return check(config, { log, major, hasWebSocket });
  if (!config.ok || major < 22 || !hasWebSocket) {
    for (const problem of config.problems) log(`error: ${problem}`);
    if (major < 22 || !hasWebSocket) log('error: needs Node 22 or newer (global WebSocket)');
    return 1;
  }
  const doorbell = createDoorbell({ config, fetchImpl, log, processStartMs });
  doorbell.start(WebSocketImpl);
  for (const signal of ['SIGTERM', 'SIGINT']) {
    onSignal(signal, () => {
      log(`${signal}: stopping`);
      doorbell.stop();
      process.exit(0);
    });
  }
  return null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.on('unhandledRejection', (err) => console.log(`doorbell: unhandled ${err?.message || err}`));
  main().then(
    (code) => {
      if (code !== null) process.exit(code);
    },
    (err) => {
      console.log(`doorbell: ${err.message}`);
      process.exit(1);
    },
  );
}
