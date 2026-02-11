import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ai2human — Hybrid Work Market",
  description:
    "A trust-first hybrid labor network for AI agents: ERC-8004 identity, Claw execution, x402 settlement, human fallback.",
  icons: {
    icon: "/brand/ai2human-dual-arrow-256.png",
    apple: "/brand/ai2human-dual-arrow-256.png"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
