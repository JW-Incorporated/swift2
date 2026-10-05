import { useEffect, useState } from 'react';
import { speedTest } from './speed-test-runtime';

/** Tracks whether speed test mode (#4896) is running. */
export function useSpeedOn(): boolean {
  const [on, setOn] = useState(speedTest.isOn());
  useEffect(() => {
    const sync = () => setOn(speedTest.isOn());
    sync();
    return speedTest.onChange(sync);
  }, []);
  return on;
}
