"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Apple-style scroll reveal: fades + eases content up as it enters the viewport.
// Fail-safe: reveals immediately if already on-screen at mount, and a timeout
// guarantees content can never get stuck hidden if the observer doesn't fire.
export function Reveal({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.classList.add("in");

    // already visible at mount?
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.98) {
      show();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { show(); io.unobserve(el); } }),
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    // safety net — never leave content invisible
    const t = setTimeout(show, 1600);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </div>
  );
}
