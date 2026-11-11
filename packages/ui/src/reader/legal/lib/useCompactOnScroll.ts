'use client';

import { useEffect, useState } from 'react';

const PHONE_QUERY = '(max-width: 767px)';
const EXPAND_AT_PX = 8;

/** `compact`: phone widths only, true once scrolled past one viewport, false again back at the top. `phone`: the viewport is phone width. */
export function useCompactOnScroll(): { compact: boolean; phone: boolean } {
  const [compact, setCompact] = useState(false);
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(PHONE_QUERY);
    const update = () => {
      setPhone(mq.matches);
      if (!mq.matches) {
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
  return { compact, phone };
}
