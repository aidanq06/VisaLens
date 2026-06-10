import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisaLens AI",
  description:
    "Decode opportunity eligibility before you apply. AI-powered eligibility risk and readiness engine for international students.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
