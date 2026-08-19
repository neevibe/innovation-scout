"use client";

/** Decorative depth field. CSS animations pause automatically for reduced motion. */
export function AmbientBackdrop() {
  return (
    <div className="ambient-backdrop" aria-hidden>
      <div className="ambient-orb ambient-orb-a" />
      <div className="ambient-orb ambient-orb-b" />
      <div className="ambient-grid" />
    </div>
  );
}
