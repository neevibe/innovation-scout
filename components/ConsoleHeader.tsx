"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The Innovation Scout console header — same wordmark, nav capsule and gold
// action as the live globe landing (public/scout-globe), so every inner page
// reads as part of one product. "/" itself is the static globe (rewritten in
// next.config.mjs), so this header never renders on top of it.
export const CONSOLE_NAV: [string, string][] = [
  ["WORLD", "/"],
  ["TREND INTEL", "/trends-intelligence"],
  ["CITIES", "/cities"],
  ["SIGNALS", "/signals"],
  ["RADAR", "/matrix"],
  ["PIPELINE", "/pipeline"],
  ["AGENTS", "/agents"],
  ["BRIEF", "/brief"],
];

const isActive = (path: string, href: string) =>
  href === "/" ? false : href === "/cities" ? path.startsWith("/cities") || path.startsWith("/markets") : path.startsWith(href);

export function ConsoleHeader() {
  const path = usePathname() || "/";
  return (
    <header className="console-header">
      <a href="/" className="console-brand" aria-label="Innovation Scout — back to the globe">
        <span className="console-word">INNOVATION SCOUT</span>
        <span className="console-sub">BIAL</span>
      </a>
      <nav className="console-nav" aria-label="Primary">
        {CONSOLE_NAV.map(([label, href]) =>
          href === "/" ? (
            // Full document load: "/" is the static globe, not an app-router page.
            <a key={href} href="/" className="console-navlink">{label}</a>
          ) : (
            <Link key={href} href={href} className={`console-navlink ${isActive(path, href) ? "on" : ""}`}>{label}</Link>
          ),
        )}
      </nav>
      <div className="console-actions">
        <Link href="/methodology" className="console-ghost">METHOD</Link>
        <Link href="/admin" className="console-ghost">SETTINGS</Link>
        <a href="/" className="console-gold"><span className="console-blink" />RUN GLOBAL SCOUT</a>
      </div>
    </header>
  );
}
