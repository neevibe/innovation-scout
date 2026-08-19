"use client";

import { useEffect, useRef } from "react";

export interface GlobeCity { name: string; lat: number; lng: number; signals: number }

// Canvas-based cinematic intelligence globe:
// rotating point-sphere world · city nodes that light up · live signal particles
// streaming into a glowing AI core. GPU-light, DPR-aware, reduced-motion safe.
export function IntelligenceGlobe({ cities, events }: { cities: GlobeCity[]; events: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W * 0.5; cy = H * 0.5;
      R = Math.min(W, H) * 0.34;
    }
    resize();
    window.addEventListener("resize", resize);

    // Fibonacci sphere points
    const N = 620;
    const pts: { x: number; y: number; z: number }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = phi * i;
      pts.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r });
    }
    const cityVecs = cities.map((c) => {
      const la = (c.lat * Math.PI) / 180, lo = (c.lng * Math.PI) / 180;
      return { x: Math.cos(la) * Math.sin(lo), y: Math.sin(la), z: Math.cos(la) * Math.cos(lo), city: c };
    });

    const tiltX = -0.42;
    const rot = (p: { x: number; y: number; z: number }, spin: number) => {
      const x = p.x * Math.cos(spin) + p.z * Math.sin(spin);
      const z = -p.x * Math.sin(spin) + p.z * Math.cos(spin);
      const y2 = p.y * Math.cos(tiltX) - z * Math.sin(tiltX);
      const z2 = p.y * Math.sin(tiltX) + z * Math.cos(tiltX);
      return { sx: cx + x * R, sy: cy + y2 * R, z: z2 };
    }

    type P = { ci: number; t: number; sx: number; sy: number };
    let particles: P[] = [];
    type Ring = { r: number; a: number };
    let rings: Ring[] = [];
    let eventText = "";
    let eventAlpha = 0;
    let evIdx = 0;

    let spin = 0.4;
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const spawn = () => {
      if (cityVecs.length === 0) return;
      const withSignals = cityVecs.map((_, i) => i).filter((i) => cityVecs[i].city.signals > 0);
      const pool = withSignals.length ? withSignals : cityVecs.map((_, i) => i);
      const ci = pool[Math.floor((Math.sin(spin * 97.13) * 0.5 + 0.5) * pool.length) % pool.length];
      particles.push({ ci, t: 0, sx: 0, sy: 0 });
    }

    const frame = (now: number) => {
      const dt = Math.min(now - last, 60) / 1000;
      last = now;
      if (!reduce) spin += dt * 0.14;

      ctx.clearRect(0, 0, W, H);

      // core glow
      const coreR = R * (0.16 + Math.sin(now / 700) * 0.012);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3.4);
      g.addColorStop(0, "rgba(150,190,230,0.5)");
      g.addColorStop(0.4, "rgba(120,150,200,0.12)");
      g.addColorStop(1, "rgba(120,150,200,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, coreR * 3.4, 0, Math.PI * 2); ctx.fill();

      // globe points
      for (const p of pts) {
        const pr = rot(p, spin);
        const front = pr.z > 0;
        const depth = (pr.z + 1) / 2;
        const alpha = front ? 0.15 + depth * 0.45 : 0.05 + depth * 0.08;
        const sz = front ? 0.7 + depth * 1.2 : 0.6;
        ctx.fillStyle = `rgba(226,232,240,${alpha})`;
        ctx.beginPath(); ctx.arc(pr.sx, pr.sy, sz, 0, Math.PI * 2); ctx.fill();
      }

      // rings (pulse on signal arrival)
      rings = rings.filter((r) => r.a > 0.02);
      for (const r of rings) {
        ctx.strokeStyle = `rgba(180,205,235,${r.a})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, r.r, 0, Math.PI * 2); ctx.stroke();
        r.r += dt * R * 1.6; r.a *= 0.94;
      }

      // signal particles: city surface → core
      const cityScreen = cityVecs.map((cv) => rot(cv, spin));
      particles = particles.filter((pp) => pp.t < 1);
      for (const pp of particles) {
        pp.t += dt * 0.9;
        const cs = cityScreen[pp.ci];
        const e = pp.t * pp.t * (3 - 2 * pp.t);
        const x = cs.sx + (cx - cs.sx) * e;
        const y = cs.sy + (cy - cs.sy) * e;
        // trail
        ctx.strokeStyle = "rgba(190,215,245,0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cs.sx, cs.sy); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = "rgba(225,240,255,0.95)";
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
        if (pp.t >= 0.985) {
          rings.push({ r: coreR, a: 0.8 });
          if (events.length) { eventText = events[evIdx % events.length]; evIdx++; eventAlpha = 1; }
        }
      }

      // city nodes + labels
      cityVecs.forEach((cv, i) => {
        const cs = cityScreen[i];
        if (cs.z <= -0.15) return;
        const front = cs.z > 0;
        const active = cv.city.signals > 0;
        const glow = active ? "rgba(255,255,255,0.95)" : "rgba(200,210,225,0.6)";
        ctx.beginPath();
        ctx.fillStyle = glow;
        ctx.arc(cs.sx, cs.sy, active ? 3 : 2, 0, Math.PI * 2); ctx.fill();
        if (active) {
          ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cs.sx, cs.sy, 6 + Math.sin(now / 500 + i) * 1.5, 0, Math.PI * 2); ctx.stroke();
        }
        if (front) {
          ctx.font = "600 11px -apple-system, Inter, sans-serif";
          ctx.fillStyle = `rgba(243,244,245,${0.55 + cs.z * 0.4})`;
          ctx.fillText(cv.city.name, cs.sx + 8, cs.sy + 3);
          if (active) {
            ctx.fillStyle = `rgba(150,190,230,${0.5 + cs.z * 0.4})`;
            ctx.font = "500 10px -apple-system, Inter, sans-serif";
            ctx.fillText(`+${cv.city.signals}`, cs.sx + 8, cs.sy + 15);
          }
        }
      });

      // event ticker near core
      if (eventAlpha > 0.02) {
        eventAlpha *= 0.992;
        ctx.font = "500 12px -apple-system, Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(226,232,240,${eventAlpha})`;
        ctx.fillText(eventText, cx, cy + R + 34);
        ctx.textAlign = "left";
      }

      // spawn cadence
      acc += dt;
      if (acc > (reduce ? 1e9 : 1.15)) { spawn(); acc = 0; }

      raf = requestAnimationFrame(frame);
    }

    if (reduce) {
      // static single render
      frame(performance.now());
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(frame);
    }

    let onScreen = true;
    const resume = () => { if (reduce) return; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); };
    const onVis = () => { if (document.hidden || !onScreen) cancelAnimationFrame(raf); else resume(); };
    document.addEventListener("visibilitychange", onVis);

    // Pause the render loop when the hero is scrolled out of view (perf).
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[0]?.isIntersecting ?? true;
      if (onScreen && !document.hidden) resume(); else cancelAnimationFrame(raf);
    }, { threshold: 0.01 });
    io.observe(canvas);

    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); };
  }, [cities, events]);

  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} aria-hidden />;
}
