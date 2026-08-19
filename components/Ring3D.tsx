"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export interface RingItem {
  id: string;
  brand: string;
  vertical: string;
  score: number;
  image?: string;
  city: string;
}

// Apple-style 3D coverflow: real category images on cards arranged in a ring,
// auto-rotating in true 3D space, draggable, pausing on hover.
export function Ring3D({ items }: { items: RingItem[] }) {
  const CARD_W = 210;
  const CARD_H = 260;
  const n = Math.max(items.length, 1);
  const angle = 360 / n;
  const radius = Math.round(CARD_W / (2 * Math.tan(Math.PI / n)) + 90);

  const [drag, setDrag] = useState(0);
  const dragging = useRef<{ x: number; base: number } | null>(null);

  function onDown(e: React.PointerEvent) {
    dragging.current = { x: e.clientX, base: drag };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    setDrag(dragging.current.base + (e.clientX - dragging.current.x) * 0.35);
  }
  function onUp() {
    dragging.current = null;
  }

  return (
    <div
      className="stage3d"
      style={{ height: CARD_H + 70, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", touchAction: "pan-y" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <div
        className="ring3d"
        style={{ width: CARD_W, height: CARD_H, transform: `rotateY(${drag}deg)` }}
      >
        {items.map((it, i) => (
          <Link
            key={it.id}
            href={`/opportunities/${it.id}`}
            className="face"
            style={{
              width: CARD_W,
              height: CARD_H,
              transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
            }}
          >
            <div
              style={{
                width: "100%", height: "100%", borderRadius: 20, overflow: "hidden",
                background: "var(--surface)", border: "1px solid var(--line)",
                boxShadow: "var(--shadow)",
                display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ position: "relative", height: 168, background: "var(--surface-2)" }}>
                {it.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt={it.brand} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                )}
                <div style={{ position: "absolute", top: 10, right: 10, width: 40, height: 40, borderRadius: 999, background: "rgba(24,28,32,0.82)", backdropFilter: "blur(6px)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 15, border: "1px solid rgba(255,255,255,0.14)" }}>
                  {it.score}
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{it.vertical} · {it.city}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, lineHeight: 1.2 }}>{it.brand}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
