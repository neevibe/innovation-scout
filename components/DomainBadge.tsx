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
        background: c + "14",
        fontSize: size === "sm" ? 9 : 9.5,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 0, background: c, display: "inline-block" }} />
      {vertical}
    </span>
  );
}
