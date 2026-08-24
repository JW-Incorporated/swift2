import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Regression guard for three clownbot chat-UI bugs. Asserted against source
 * rather than a rendered tree — this workspace has no React test renderer
 * (vitest runs `environment: 'node'`), same approach as `moodChatLayout.test.ts`.
 */
const CHAT_SOURCE = readFileSync(join(__dirname, 'ClownChat.tsx'), 'utf8');
const COMPOSER_SOURCE = readFileSync(join(__dirname, 'ClownChatComposer.tsx'), 'utf8');
const HOOKS_SOURCE = readFileSync(join(__dirname, '..', '..', 'lib', 'longlive', 'clown-chat-ui.ts'), 'utf8');

describe('ClownChat empty state', () => {
  it('never pre-fills a fake example conversation', () => {
    expect(CHAT_SOURCE).not.toContain('SEED_EXAMPLE');
    expect(CHAT_SOURCE).not.toContain('SEED_MESSAGE');
    expect(CHAT_SOURCE).not.toContain('Example conversation');
    expect(CHAT_SOURCE).not.toContain('clown-seed-example');
  });

  it('shows a small, unobtrusive line instead', () => {
    expect(CHAT_SOURCE).toContain('EMPTY_STATE_TEXT');
    expect(CHAT_SOURCE).toContain('messages.length === 0');
  });
});

describe('ClownChat composer auto-resize', () => {
  it('grows the textarea with typed content, capped at a fixed max height', () => {
    expect(COMPOSER_SOURCE).toContain('useAutoResizeTextarea');
    expect(HOOKS_SOURCE).toContain('MAX_TEXTAREA_HEIGHT_PX');
    expect(HOOKS_SOURCE).toContain('el.scrollHeight');
    expect(HOOKS_SOURCE).toContain("el.style.height");
  });

  it('scrolls internally instead of growing further past the cap', () => {
    expect(HOOKS_SOURCE).toContain('overflowY');
  });
});

describe('ClownChat message stream auto-scroll', () => {
  it('sticks the stream to its bottom on new content', () => {
    expect(CHAT_SOURCE).toContain('useStickToBottomScroll');
    expect(HOOKS_SOURCE).toContain('el.scrollTop = el.scrollHeight');
  });

  it('does not fight a reader who has scrolled up mid-stream', () => {
    expect(HOOKS_SOURCE).toContain('nearBottomRef');
    expect(HOOKS_SOURCE).toContain('AUTO_SCROLL_THRESHOLD_PX');
  });
});
