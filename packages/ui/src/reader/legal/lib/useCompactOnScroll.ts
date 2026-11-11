'use client';

import { useEffect, useState } from 'react';

const PHONE_QUERY = '(max-width: 767px)';
const EXPAND_AT_PX = 8;

/** Phone widths only: true once scrolled past one viewport, false again back at the top. */
export function useCompactOnScroll(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const phone = window.matchMedia(PHONE_QUERY);
    const update = () => {
      if (!phone.matches) {
        setCompact(false);
        return;
      }
      const y = window.scrollY;
      setCompact((prev) => (y > window.innerHeight ? true : y <= EXPAND_AT_PX ? false : prev));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return compact;
}
