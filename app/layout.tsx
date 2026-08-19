import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "BIAL Innovation Scout — Commercial Intelligence",
  description:
    "AI Innovation Scout for Bangalore International Airport: Discover → Validate → Score → Recommend → Identify Decision Maker → Act.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="app-bg" aria-hidden />
        <AmbientBackdrop />
        <div className="app-shell" style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
