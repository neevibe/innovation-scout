import Link from "next/link";
import type { BialGap, CityPulse } from "@/lib/intelligence/sixMonth";
import { Icon } from "@/components/Icon";

const FLAGS: Record<string, string> = {
  India: "IN",
  UAE: "AE",
  Singapore: "SG",
  "United Kingdom": "UK",
};

export function SixMonthLens({
  cityPulses,
  gaps,
  windowLabel,
  compact = false,
}: {
  cityPulses: CityPulse[];
  gaps: BialGap[];
  windowLabel: string;
  compact?: boolean;
}) {
  const topGaps = gaps.slice(0, compact ? 3 : 4);
  return (
    <section className={`six-month-lens ${compact ? "is-compact" : ""}`}>
      <div className="lens-header">
        <div>
          <div className="eyebrow lens-kicker"><span className="live-dot" /> Research window · {windowLabel}</div>
          <h2>{compact ? "Six-month city pulse" : "What the market is teaching BIAL"}</h2>
          {!compact && <p>Recent market evidence, translated into the spaces BIAL can own next.</p>}
        </div>
        <Link className="btn lens-link" href="/trends">See evidence <Icon name="arrow" size={14} /></Link>
      </div>

      <div className="lens-layout">
        <div className="city-orbit" aria-label="Six market pulses">
          <div className="orbit-core">
            <span>BIAL</span>
            <small>market lens</small>
          </div>
          <div className="orbit-ring orbit-ring-one" aria-hidden />
          <div className="orbit-ring orbit-ring-two" aria-hidden />
          <div className="orbit-nodes">
            {cityPulses.map((pulse, index) => (
              <article className="orbit-node" style={{ "--i": index, "--n": cityPulses.length } as React.CSSProperties} key={pulse.city.id}>
                <span className="orbit-flag">{FLAGS[pulse.city.country] || "GL"}</span>
                <div>
                  <strong>{pulse.city.name}</strong>
                  <span>{pulse.category}</span>
                </div>
                <i>{pulse.signals.length}</i>
              </article>
            ))}
          </div>
        </div>

        <div className="gap-stack">
          <div className="gap-stack-title"><span className="signal-label">BIAL white space</span><span>{topGaps.length} priority gaps</span></div>
          {topGaps.map((gap, index) => (
            <article className="gap-card" key={gap.category} style={{ "--gap-index": index } as React.CSSProperties}>
              <div className="gap-card-index">0{index + 1}</div>
              <div>
                <h3>{gap.category}</h3>
                <p>{gap.note}</p>
                {gap.opportunity && <Link href={`/opportunities/${gap.opportunity.id}`}>Open recommendation <Icon name="arrow" size={12} /></Link>}
              </div>
              <div className="gap-score">{gap.opportunity?.score || "—"}<small>/100</small></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
