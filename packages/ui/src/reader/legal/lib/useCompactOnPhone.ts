'use client';

import { useEffect, useState } from 'react';

const PHONE_QUERY = '(max-width: 767px)';

/**
 * True at phone widths. The feedback pill is then always the 44px icon
 * circle: expanded (label + dismiss X, ~178px) it sat on the hero's "Track
 * guide" / "Share as image" controls and Era Secret text at scroll 0, and no
 * scroll position on a phone feed leaves that corner empty.
 */
export function useCompactOnPhone(): boolean {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(PHONE_QUERY);
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    return () => {
      mq.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return phone;
}
