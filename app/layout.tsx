import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConsoleHeader } from "@/components/ConsoleHeader";

// One type system across the product — the same trio the live globe console uses.
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--ti-serif", display: "swap" });
const sans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--ti-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--ti-mono", display: "swap" });

export const metadata: Metadata = {
  title: "BIAL Innovation Scout — Commercial Intelligence",
  description:
    "AI Innovation Scout for Bangalore International Airport: Discover → Validate → Score → Recommend → Identify Decision Maker → Act.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <div className="app-bg" aria-hidden />
        <div className="console-grid" aria-hidden />
        <ConsoleHeader />
        <main className="app-shell" style={{ minWidth: 0 }}>{children}</main>
      </body>
    </html>
  );
}
