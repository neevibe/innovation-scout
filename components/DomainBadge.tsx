import { domainColor } from "@/lib/domainColors";

// A colour-coded domain chip (Retail, F&B, Wellness, Technology, …).
export function DomainBadge({ vertical, size = "md" }: { vertical: string; size?: "sm" | "md" }) {
  const c = domainColor(vertical);
  return (
    <span
      className="badge"
      style={{
        borderColor: c + "66",
        color: c,
        background: c + "1f",
        fontSize: size === "sm" ? 10.5 : 11,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c, display: "inline-block" }} />
      {vertical}
    </span>
  );
}
