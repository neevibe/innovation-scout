"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import type { Role } from "@/lib/types";

const ROLES: Role[] = [
  "Super Admin", "Commercial Leadership", "Retail Team", "F&B Team",
  "Duty Free Team", "Strategy Team", "Analyst",
];

type MasterySummary = {
  totalEntries: number;
  topScore: number;
  topTopic: string | null;
  byVerdict: Record<string, number>;
};

export function Topbar({ title, subtitle, mode, lastRefresh }: { title: string; subtitle?: string; mode: string; lastRefresh?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<Role>("Commercial Leadership");
  const [mastery, setMastery] = useState<MasterySummary | null>(null);

  async function fetchMastery() {
    try {
      const r = await fetch("/api/mastery?limit=1", { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      setMastery(j.summary);
    } catch {}
  }

  useEffect(() => {
    fetchMastery();
    const id = setInterval(fetchMastery, 30000); // poll every 30s
    return () => clearInterval(id);
  }, []);

  async function refresh() {
    setBusy(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      await fetchMastery();
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  const words = title.split(" ");
  const tail = words.pop() || "";
  const head = words.join(" ");

  const live = mode === "live";
  const verdict = mastery && mastery.topScore >= 75 ? "strong" :
                  mastery && mastery.topScore >= 50 ? "moderate" :
                  mastery && mastery.topScore > 0 ? "single" : null;
  const verdictColor = verdict === "strong" ? "var(--ok)" :
                       verdict === "moderate" ? "#d4a64a" :
                       verdict === "single" ? "var(--muted)" : "var(--muted-2)";
  return (
    <header
      className="apple-topbar"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <div style={{ minWidth: 0 }}>
        {subtitle && <div className="topbar-kicker">{subtitle}</div>}
        {/* Console hero: serif title, last word set in gold italic (same register as the globe). */}
        <h1 className="topbar-title">
          {head}{head ? " " : ""}<span className="topbar-accent">{tail}</span>
        </h1>
      </div>
      <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {mastery && mastery.topScore > 0 && (
          <span
            className="badge"
            title={`Mastery: ${mastery.totalEntries} entries · top "${mastery.topTopic}" scored ${mastery.topScore}`}
            style={{ borderColor: verdictColor, color: verdictColor, fontVariantNumeric: "tabular-nums" }}
          >
            <Icon name="check" size={12} color={verdictColor} style={{ marginRight: 4 }} />
            Mastery {mastery.topScore}/100
          </span>
        )}
        <span className="badge" title="Intelligence mode" style={{ borderColor: live ? "#a7e0b8" : "var(--line-strong)", color: live ? "var(--ok)" : "var(--muted)" }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: live ? "var(--ok)" : "#c7c7cc", display: "inline-block" }} />
          {live ? "Live" : "Offline"} mode
        </span>
        {lastRefresh && (
          <span style={{ fontSize: 12, color: "var(--muted-2)" }}>
            Updated {new Date(lastRefresh).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        )}
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="btn" style={{ padding: "9px 14px", appearance: "none" }} title="Viewing role (RBAC)">
          {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
        </select>
        <button className="btn btn-primary" onClick={refresh} disabled={busy || pending}>
          <Icon name="refresh" size={15} color="#23282e" style={{ animation: busy || pending ? "spin 0.9s linear infinite" : undefined }} />
          {busy || pending ? "Refreshing…" : "Refresh Intelligence"}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </header>
  );
}
