"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, ms = 1200) {
  const [v, setV] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); return; }
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min((now - t0) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Stat({ value, label }: { value: number; label: string }) {
  const v = useCountUp(value);
  return (
    <div>
      <div className="tnum" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{v.toLocaleString("en-IN")}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted-2)", marginTop: 5 }}>{label}</div>
    </div>
  );
}

export function LiveCounter({ items }: { items: { value: number; label: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 34, flexWrap: "wrap" }}>
      {items.map((it) => (<Stat key={it.label} value={it.value} label={it.label} />))}
    </div>
  );
}
