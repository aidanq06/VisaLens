import type { Metadata } from "next";
import { Instrument_Serif, IBM_Plex_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VisaLens AI — Opportunity Risk Engine",
  description:
    "Turn confusing STEM opportunity descriptions into structured eligibility risk reports for international students.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${ibmPlexMono.variable} ${dmSans.variable}`}
    >
      <body style={{ fontFamily: "var(--font-sans)" }}>{children}</body>
    </html>
  );
}
