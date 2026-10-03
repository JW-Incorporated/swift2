// Speed test mode wiring (#4896): the process-wide controller plus the AppState
// listener. The listener ALWAYS runs (not only in the mode) so every report
// gets cold/warm from the process lifecycle and fresh marks per launch.
import { AppState } from 'react-native';
import {
  beginWarmLaunch,
  diagCollector,
  diagMarkOnce,
  setPaintListener,
} from './diagnostics';
import { readDiagEnv } from './diagnostics-env';
import { sendDiagReport } from './diagnostics-send';
import { imageMarks, setImageMarksEnabled } from './image-marks';
import { createLaunchTracker, createSpeedTestController } from './speed-test-controller';
import { loadSpeedOutbox, loadSpeedTestRaw, saveSpeedOutbox, saveSpeedTestRaw } from './speed-test-store';
import type { Ui } from './speed-test';

let ui: Ui = 'unknown';

export const speedTest = createSpeedTestController({
  store: { load: loadSpeedTestRaw, save: saveSpeedTestRaw },
  outbox: { load: loadSpeedOutbox, save: saveSpeedOutbox },
  send: (payload) => sendDiagReport(payload),
  env: readDiagEnv,
  summary: () => diagCollector.summary(),
  ui: () => ui,
  imagesBy: (ms) => imageMarks.loadedBy(ms),
  elapsed: () => diagCollector.elapsed(),
  now: () => Date.now(),
  schedule: (fn, ms) => {
    const t = setTimeout(fn, ms);
    return () => clearTimeout(t);
  },
});

let installed = false;

export function installSpeedTest(): void {
  if (installed) return;
  installed = true;
  speedTest.onChange(() => setImageMarksEnabled(speedTest.isOn()));
  void speedTest.init().then(() => void speedTest.retry());
  setPaintListener((stage, detail) => {
    if (stage === 'first-era-paint') ui = detail === 'shared' ? 'shared' : detail === 'native' ? 'native' : 'unknown';
    void speedTest.onPaint(stage === 'resume-paint' ? 'warm' : 'cold');
  });
  const tracker = createLaunchTracker({
    beginWarm: () => {
      beginWarmLaunch();
      imageMarks.reset();
    },
    onResumed: () => {
      void speedTest.retry();
      requestAnimationFrame(() => diagMarkOnce('resume-paint'));
    },
    onBackground: () => void speedTest.flush(),
  });
  AppState.addEventListener('change', (s) => tracker.change(s));
}
