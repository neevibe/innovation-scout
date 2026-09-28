"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";

const GROUPS: { title: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    title: "Intelligence",
    items: [
      { href: "/", label: "Overview", icon: "dashboard" },
      { href: "/signals", label: "Live Signals", icon: "spark" },
      { href: "/trends", label: "Evidence Pulse", icon: "trend" },
      { href: "/trends-intelligence", label: "Trend Intelligence", icon: "trend" },
      { href: "/cities", label: "Cities", icon: "globe" },
    ],
  },
  {
    title: "Opportunities",
    items: [
      { href: "/matrix", label: "Opportunity Radar", icon: "compass" },
      { href: "/pipeline", label: "Pipeline", icon: "pipeline" },
      { href: "/brief", label: "Executive Brief", icon: "doc" },
    ],
  },
  {
    title: "Research",
    items: [
      { href: "/scout", label: "AI Scout", icon: "spark" },
      { href: "/agents", label: "Scraping Agents", icon: "compass" },
      { href: "/methodology", label: "Methodology", icon: "doc" },
    ],
  },
  {
    title: "Analytics",
    items: [{ href: "/dutyfree", label: "Duty Free Intel", icon: "bag" }],
  },
  {
    title: "Administration",
    items: [{ href: "/admin", label: "Settings & Scoring", icon: "gear" }],
  },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside
      className="sidebar"
      style={{
        width: 258, flexShrink: 0,
      }}
    >
      <div style={{ padding: "4px 8px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 13, background: "linear-gradient(135deg,#edf3ff,#a9baff)", boxShadow: "0 12px 26px -12px rgba(145,182,255,.9), inset 0 1px #fff", display: "grid", placeItems: "center" }}>
            <Icon name="compass" size={19} color="#151927" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em", lineHeight: 1 }}>Innovation Scout</div>
            <div className="eyebrow" style={{ marginTop: 5, fontSize: 9 }}>BIAL Intelligence</div>
          </div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="eyebrow" style={{ padding: "0 12px 7px", fontSize: 9.5 }}>{g.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {g.items.map((n) => {
                const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href} className={`nav-link ${active ? "active" : ""}`} style={{ fontSize: 13 }}>
                    <Icon name={n.icon} size={16} />
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ marginTop: "auto", padding: "16px 8px 4px" }}>
        <div style={{ padding: 12, borderRadius: 16, background: "linear-gradient(135deg,rgba(128,157,235,.16),rgba(141,99,220,.08))", border: "1px solid var(--line)", boxShadow: "inset 0 1px rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span className="live-dot" />
            <span className="eyebrow" style={{ fontSize: 9.5 }}>Scout Active</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>6 markets · any product, service, experience or idea</div>
        </div>
      </div>
    </aside>
  );
}
