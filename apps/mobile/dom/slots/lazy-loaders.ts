/* eslint-disable @typescript-eslint/no-require-imports -- call-time require is deliberate (Metro evaluates a module on its first require; see ./lazy.ts) */
// One call-time require per lazily loaded surface component. Never import these modules statically anywhere in
// dom/slots: a static import evaluates them at startup, which is exactly what this file exists to avoid.
export const loadThreadsMode = () =>
  (require('@swift2/ui/reader/threads/ThreadsMode') as typeof import('@swift2/ui/reader/threads/ThreadsMode')).ThreadsMode;

export const loadCommunitySection = () =>
  (require('@swift2/ui/reader/community/CommunitySection') as typeof import('@swift2/ui/reader/community/CommunitySection')).CommunitySection;

export const loadMoodChat = () =>
  (require('@swift2/ui/reader/clown/MoodChat') as typeof import('@swift2/ui/reader/clown/MoodChat')).MoodChat;

export const loadClownChat = () =>
  (require('@swift2/ui/reader/clown/ClownChat') as typeof import('@swift2/ui/reader/clown/ClownChat')).ClownChat;
