import { describe, expect, it } from 'vitest';
import { createImageMarks, imageMarks, noteImageLoaded, setImageMarksEnabled } from './image-marks';

describe('image marks', () => {
  it('records the first VISIBLE image and counts loads inside the window', () => {
    let t = 0;
    const m = createImageMarks(() => t);
    t = 300;
    expect(m.loaded(false)).toBe(false);
    t = 800;
    expect(m.loaded(true)).toBe(true);
    t = 900;
    expect(m.loaded(true)).toBe(false);
    t = 10_000;
    m.loaded(true);
    t = 10_001;
    m.loaded(true);
    expect(m.firstVisibleMs()).toBe(800);
    expect(m.loadedBy(10_000)).toBe(4);
    expect(m.loadedBy(500)).toBe(1);
  });

  it('reset starts a new launch', () => {
    const m = createImageMarks(() => 5);
    m.loaded(true);
    m.reset();
    expect(m.firstVisibleMs()).toBeNull();
    expect(m.loadedBy(10_000)).toBe(0);
    expect(m.loaded(true)).toBe(true);
  });
});

describe('noteImageLoaded gating', () => {
  it('records nothing until Speed test mode enables it', () => {
    imageMarks.reset();
    noteImageLoaded(true);
    expect(imageMarks.loadedBy(1e9)).toBe(0);
    setImageMarksEnabled(true);
    noteImageLoaded(true);
    expect(imageMarks.loadedBy(1e9)).toBe(1);
    setImageMarksEnabled(false);
    noteImageLoaded(true);
    expect(imageMarks.loadedBy(1e9)).toBe(1);
  });
});
