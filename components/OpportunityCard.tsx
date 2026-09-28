import Link from "next/link";
import type { ScoredOpportunity } from "@/lib/scoring/engine";
import { ScoreDonut, TierPill } from "@/components/ScoreBadge";
import { DomainBadge } from "@/components/DomainBadge";
import { Icon } from "@/components/Icon";

export function OpportunityCard({ o }: { o: ScoredOpportunity }) {
  const contact = o.contacts[0];
  return (
    <Link href={`/opportunities/${o.id}`} className="card" style={{ display: "block", overflow: "hidden", borderRadius: 20, height: "100%" }}>
      {/* Image header */}
      <div style={{ position: "relative", height: 156, overflow: "hidden", background: "var(--surface-2)" }}>
        {o.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={o.image} alt={o.imageAlt || o.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,24,28,0.05), rgba(20,24,28,0.5))" }} />
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
          <DomainBadge vertical={o.vertical} />
          {!o.sufficientEvidence && <span className="badge" style={{ background: "rgba(24,28,32,0.7)", borderColor: "var(--warn)", color: "var(--warn)" }}>Insufficient evidence</span>}
        </div>
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(24,28,32,0.78)", backdropFilter: "blur(6px)", borderRadius: 999, padding: 3 }}>
          <ScoreDonut score={o.score} tier={o.tier} size={58} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "15px 17px 17px" }}>
        <div style={{ fontSize: 11.5, color: "var(--muted-2)" }}>{o.city}, {o.country}</div>
        <div style={{ fontSize: 17.5, fontWeight: 600, lineHeight: 1.22, marginTop: 3, letterSpacing: "-0.02em" }}>{o.brand}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {o.recommendation.marketSignal}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <Fact label="BIAL Gap" value={o.recommendation.bialGap} />
          <Fact label="Location" value={o.recommendation.potentialLocation} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 15, paddingTop: 13, borderTop: "1px solid var(--line)" }}>
          <TierPill tier={o.tier} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>
            {o.evidence.length} sources{contact ? " · contact" : ""} <Icon name="arrow" size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "var(--muted-2)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ marginTop: 3, fontSize: 12.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{value}</div>
    </div>
  );
}
