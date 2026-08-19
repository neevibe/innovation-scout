"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OpportunityStage } from "@/lib/types";

const STAGES: OpportunityStage[] = [
  "Discovered", "Validated", "Contact Identified", "BIAL Outreach", "Discussion",
  "Commercial Evaluation", "Pilot", "Approved", "Implementation", "Live", "Measured",
];

export function StageControl({ id, stage }: { id: string; stage: OpportunityStage }) {
  const router = useRouter();
  const [current, setCurrent] = useState(stage);
  const [pending, startTransition] = useTransition();

  async function change(next: OpportunityStage) {
    setCurrent(next);
    await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage: next }),
    });
    startTransition(() => router.refresh());
  }

  const idx = STAGES.indexOf(current);
  return (
    <div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {STAGES.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => change(s)}
              className="badge"
              style={{
                cursor: "pointer",
                borderColor: i <= idx ? "var(--accent)" : "var(--line-strong)",
                background: i < idx ? "var(--accent-soft)" : i === idx ? "var(--accent)" : "transparent",
                color: i === idx ? "#fff" : i < idx ? "var(--accent)" : "var(--muted)",
              }}
            >
              {i < idx ? "✓ " : i === idx ? "● " : ""}{s}
            </button>
            {i < STAGES.length - 1 && <span style={{ color: "var(--muted)", fontSize: 10 }}>›</span>}
          </div>
        ))}
      </div>
      {pending && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Saving…</div>}
    </div>
  );
}
