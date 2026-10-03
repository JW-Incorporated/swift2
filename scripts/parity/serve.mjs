#!/usr/bin/env node
// Static server for the parity harness (One UI WP1.1c). Serves the web export
//   cd apps/mobile && EXPO_NO_WEB_SETUP=1 npx expo export --platform web --output-dir dist/parity-web
// on 127.0.0.1 only. Started by playwright.parity.config.ts.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../apps/mobile/dist/parity-web');
const fixture = resolve(dirname(fileURLToPath(import.meta.url)), '../../apps/mobile/dist/parity-fixture');
const webPublic = resolve(dirname(fileURLToPath(import.meta.url)), '../../apps/web/public');
const port = Number(process.env.PARITY_PORT ?? 4173);

if (!existsSync(join(root, 'index.html'))) {
  console.error(
    `parity-serve: ${root}/index.html missing - run the web export first (docs/one-ui/parity.md)`,
  );
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  // /content/** is the fixture bundle (make-fixture.mjs), read from disk: side b never touches a network.
  let base = pathname.startsWith('/content/') ? fixture : root;
  let file = normalize(join(base, pathname === '/' ? 'index.html' : pathname));
  // Static site assets (/eras/*.png ...) come from the web app's public dir, as the site would serve them.
  if (!existsSync(file) && !pathname.startsWith('/content/')) {
    base = webPublic;
    file = normalize(join(base, pathname));
  }
  if (!file.startsWith(base) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, '127.0.0.1');
