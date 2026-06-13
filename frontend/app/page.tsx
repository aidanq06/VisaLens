import Link from "next/link";
import ProfileMenu from "@/components/ui/ProfileMenu";
import LandingAnimations from "@/components/ui/LandingAnimations";

const trustItems = [
  "CPT / OPT Aware",
  "7 Risk Categories",
  "91 Detection Rules",
  "Free",
];

const dashboardStats = [
  { value: "247", label: "Opportunities Scanned" },
  { value: "18", label: "Strong Matches" },
  { value: "6", label: "Risks Flagged" },
  { value: "4", label: "Deadlines This Month" },
];

const recentAnalysis = [
  {
    title: "Google SWE Research Internship",
    pills: [
      { tone: "red", label: "Citizenship" },
      { tone: "gold", label: "Work Auth" },
    ],
    badge: { tone: "red", label: "High" },
  },
  {
    title: "MIT PRIMES Research Program",
    pills: [
      { tone: "green", label: "Worldwide" },
      { tone: "green", label: "No Work Auth" },
    ],
    badge: { tone: "green", label: "Low" },
  },
];

const darkStats = [
  {
    value: "247+",
    label: "Opportunities",
    description: "Indexed and analyzed",
  },
  {
    value: "91",
    label: "Detection Rules",
    description: "Across 7 risk categories",
  },
  {
    value: "F-1, J-1",
    label: "Visa Support",
    description: "International student focus",
  },
  {
    value: "100%",
    label: "Deterministic",
    description: "No black box scoring",
  },
];

const stepCards = [
  {
    number: "01",
    title: "Build Your Profile",
    description:
      "Tell VisaLens your visa status, school, and level. Your profile pre-fills every scan and personalizes your risk scoring.",
    tileBg: "#E6F7ED",
    tileColor: "#1D9A57",
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  {
    number: "02",
    title: "Scan Any Opportunity",
    description:
      "Paste any description or browse Radar-discovered programs. VisaLens extracts every eligibility requirement in seconds.",
    tileBg: "#FFF1C7",
    tileColor: "#8A5600",
    icon: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </>
    ),
  },
  {
    number: "03",
    title: "Get Your Action Plan",
    description:
      "Receive a structured verification timeline with every step assigned to you, your DSO, or the organizer.",
    tileBg: "#FFE8E8",
    tileColor: "#D83A3A",
    icon: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
  },
];

const detectionCategories = [
  {
    dot: "#D83A3A",
    name: "Citizenship Restrictions",
    description: "U.S. citizens or permanent residents only",
  },
  {
    dot: "#F5A91D",
    name: "Work Authorization",
    description: "Must be eligible to work in the U.S.",
  },
  {
    dot: "#F5A91D",
    name: "Funding Restrictions",
    description: "Federal or citizenship-based funding",
  },
  {
    dot: "#8A5600",
    name: "Location Requirements",
    description: "Remote but must be located in the U.S.",
  },
  {
    dot: "#1D9A57",
    name: "International Friendly",
    description: "Open worldwide, no work auth required",
  },
  {
    dot: "#AAA398",
    name: "Ambiguous Language",
    description: "Phrases that require human verification",
  },
];

const timelineItems = [
  {
    status: "complete",
    tone: "green",
    title: "DSO Verification",
    subtitle: "Confirm CPT eligibility and enrollment status",
    badge: "Complete",
  },
  {
    status: "current",
    tone: "gold",
    title: "Offer Letter Request",
    subtitle: "Obtain formal offer letter from employer",
    badge: "In Progress",
  },
  {
    status: "upcoming",
    tone: "neutral",
    title: "CPT Application",
    subtitle: "Submit packet to international student office",
    badge: "Pending",
  },
  {
    status: "upcoming",
    tone: "neutral",
    title: "I-20 Update",
    subtitle: "Receive updated I-20 with CPT authorization",
    badge: "Pending",
  },
];

const ctaStats = [
  { value: "7", label: "Risk Categories" },
  { value: "91", label: "Detection Rules" },
  { value: "100%", label: "Deterministic" },
];

export default function Home() {
  return (
    <>
      <style>{`
        html {
          background: #FBF8F1;
        }

        .lp {
          position: relative;
          background: #FBF8F1;
          color: #11100D;
          min-height: 100vh;
          font-family: var(--font-sans);
        }
        .lp-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, #DDD5C4 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.4;
        }
        .lp-content {
          position: relative;
          z-index: 1;
        }

        /* ── Scroll reveal ───────────────────────────────────── */
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-stagger > * {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .reveal-stagger.is-visible > * {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-stagger.is-visible > *:nth-child(1) { transition-delay: 0s; }
        .reveal-stagger.is-visible > *:nth-child(2) { transition-delay: 0.1s; }
        .reveal-stagger.is-visible > *:nth-child(3) { transition-delay: 0.2s; }
        .reveal-stagger.is-visible > *:nth-child(4) { transition-delay: 0.3s; }
        @media (prefers-reduced-motion: reduce) {
          .reveal,
          .reveal-stagger > * {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }

        /* ── Chip color system (shared) ──────────────────────── */
        .lp-chip-red {
          background: #FFE8E8;
          color: #D83A3A;
          border: 1px solid #F5C0C0;
        }
        .lp-chip-gold {
          background: #FFF1C7;
          color: #8A5600;
          border: 1px solid #E8DFCF;
        }
        .lp-chip-green {
          background: #E6F7ED;
          color: #1D9A57;
          border: 1px solid #A8DFC0;
        }
        .lp-chip-neutral {
          background: #FBF8F1;
          color: #AAA398;
          border: 1px solid #E8DFCF;
        }
        .lp-pill {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-radius: 4px;
          padding: 2px 8px;
        }

        /* ── Nav ─────────────────────────────────────────────── */
        .lp-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          height: 56px;
          padding: 0 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(251, 248, 241, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #E8DFCF;
        }
        .lp-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .lp-brand-icon {
          color: #F5A91D;
          font-size: 18px;
          line-height: 1;
        }
        .lp-brand-name {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #11100D;
        }
        .lp-nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .lp-nav-link {
          font-size: 13px;
          color: #6F6A60;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .lp-nav-link:hover {
          color: #11100D;
        }

        /* ── Buttons ─────────────────────────────────────────── */
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          border-radius: 8px;
          background: #F5A91D;
          color: #11100D;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .lp-btn-primary:hover {
          background: #D4890F;
        }
        .lp-btn-secondary {
          display: inline-flex;
          align-items: center;
          padding: 14px 32px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid #D8C7A8;
          color: #6F6A60;
          font-size: 15px;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }
        .lp-btn-secondary:hover {
          border-color: #AAA398;
        }

        /* ── Hero ────────────────────────────────────────────── */
        .lp-hero {
          position: relative;
          min-height: 100vh;
          padding-top: 56px;
          overflow: hidden;
        }
        .lp-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 64px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          min-height: calc(100vh - 56px);
        }
        .lp-hero-glow {
          position: absolute;
          right: 5%;
          top: 50%;
          transform: translateY(-50%);
          width: 560px;
          height: 560px;
          background: radial-gradient(
            circle,
            rgba(245, 169, 29, 0.1) 0%,
            transparent 68%
          );
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .lp-hero-copy {
          position: relative;
          z-index: 1;
        }
        .lp-eyebrow {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #F5A91D;
          margin: 0 0 16px;
        }
        .lp-headline {
          font-family: var(--font-serif);
          font-size: 70px;
          font-weight: 400;
          line-height: 1.02;
          color: #11100D;
          margin: 0;
        }
        .lp-headline em {
          display: block;
          color: #F5A91D;
          font-style: italic;
        }
        .lp-subhead {
          font-size: 17px;
          line-height: 1.68;
          color: #6F6A60;
          max-width: 400px;
          margin: 24px 0 0;
        }
        .lp-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 40px;
        }
        .lp-trust {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 28px;
        }
        .lp-trust-item {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #AAA398;
        }
        .lp-trust-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #D8C7A8;
          flex-shrink: 0;
        }

        /* ── Hero visual (dashboard + floats) ────────────────── */
        .lp-hero-visual {
          position: relative;
          z-index: 1;
          min-height: 560px;
        }
        .lp-dashboard {
          position: relative;
          z-index: 5;
          margin-top: 40px;
          margin-right: 16px;
          background: #FFFDF8;
          border: 1px solid #D8C7A8;
          border-radius: 16px;
          box-shadow: 0 20px 80px rgba(17, 16, 13, 0.1),
            0 4px 16px rgba(17, 16, 13, 0.06);
          overflow: hidden;
        }
        .lp-db-top {
          background: #11100D;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .lp-db-top-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lp-db-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .lp-db-top-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #6F6A60;
        }
        .lp-db-live {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .lp-db-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1D9A57;
        }
        .lp-db-live-text {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          color: #1D9A57;
        }
        .lp-db-body {
          padding: 20px;
        }
        .lp-db-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        .lp-db-stat {
          background: #FBF8F1;
          border: 1px solid #E8DFCF;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .lp-db-stat-num {
          display: block;
          font-family: var(--font-mono);
          font-size: 22px;
          font-weight: 700;
          color: #11100D;
          line-height: 1.1;
        }
        .lp-db-stat-label {
          display: block;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #AAA398;
          margin-top: 3px;
        }
        .lp-db-divider {
          height: 1px;
          background: #E8DFCF;
          margin: 4px 0 16px;
        }
        .lp-db-section-label {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #AAA398;
          margin: 0 0 10px;
        }
        .lp-db-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #F0EBE0;
        }
        .lp-db-row-title {
          font-size: 13px;
          font-weight: 600;
          color: #11100D;
        }
        .lp-db-row-pills {
          display: flex;
          gap: 5px;
          margin-top: 6px;
        }
        .lp-db-pill {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-radius: 4px;
          padding: 2px 7px;
        }
        .lp-db-badge {
          flex-shrink: 0;
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-radius: 4px;
          padding: 3px 10px;
        }
        .lp-db-next {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #FFF4D6;
          border: 1px solid #E8C96A;
          border-radius: 10px;
          padding: 14px 16px;
          margin-top: 16px;
        }
        .lp-db-next-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #F5A91D;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-db-next-label {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #8A5600;
        }
        .lp-db-next-text {
          font-size: 13px;
          font-weight: 600;
          color: #11100D;
          margin: 3px 0 0;
        }

        /* ── Floating badges ─────────────────────────────────── */
        .lp-fb {
          position: absolute;
          z-index: 10;
          display: flex;
          flex-direction: column;
        }
        .lp-fb-top {
          top: 0;
          right: -8px;
          width: 164px;
          background: #FFFDF8;
          border: 1px solid #E8DFCF;
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }
        .lp-fb-bottom {
          bottom: -16px;
          left: -16px;
          width: 190px;
          background: #11100D;
          border: 1px solid #2A2820;
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .lp-fb-label {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          color: #AAA398;
        }
        .lp-fb-bottom .lp-fb-label {
          color: #6F6A60;
        }
        .lp-fb-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
        }
        .lp-fb-bar {
          flex: 1;
          height: 4px;
          background: #E8DFCF;
          border-radius: 2px;
          overflow: hidden;
        }
        .lp-fb-bar-fill {
          height: 100%;
          background: #F5A91D;
          border-radius: 2px;
        }
        .lp-fb-pct {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #F5A91D;
        }
        .lp-fb-sub {
          font-size: 12px;
          color: #6F6A60;
          margin-top: 4px;
        }
        .lp-fb-bottom-title {
          font-size: 13px;
          font-weight: 600;
          color: #FFFDF8;
          margin: 6px 0 0;
        }
        .lp-doc-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 8px;
        }
        .lp-doc-pill {
          font-family: var(--font-mono);
          font-size: 9px;
          color: #AAA398;
          background: #2A2820;
          border: 1px solid #3A3830;
          border-radius: 3px;
          padding: 2px 7px;
        }

        /* ── Dark stats strip ────────────────────────────────── */
        .lp-dark-stats {
          background: #11100D;
          border-top: 1px solid #1B1915;
          border-bottom: 1px solid #1B1915;
        }
        .lp-dark-stats-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 48px 64px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 32px;
        }
        .lp-dark-stat {
          text-align: center;
          flex: 1;
          min-width: 160px;
        }
        .lp-dark-stat-num {
          display: block;
          font-family: var(--font-serif);
          font-size: 44px;
          font-weight: 400;
          color: #F5A91D;
          line-height: 1;
        }
        .lp-dark-stat-label {
          display: block;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6F6A60;
          margin-top: 8px;
        }
        .lp-dark-stat-desc {
          display: block;
          font-size: 13px;
          color: #AAA398;
          margin-top: 4px;
        }

        /* ── Sections ────────────────────────────────────────── */
        .lp-section {
          padding: 128px 64px;
          scroll-margin-top: 56px;
        }
        .lp-section-surface {
          background: #FFFDF8;
        }
        .lp-section-inner {
          max-width: 1280px;
          margin: 0 auto;
        }
        .lp-section-label {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #AAA398;
          margin: 0;
        }
        .lp-section-heading {
          font-family: var(--font-serif);
          font-size: 50px;
          font-weight: 400;
          line-height: 1.12;
          color: #11100D;
          max-width: 560px;
          margin: 16px 0 0;
        }

        /* ── How it works cards ──────────────────────────────── */
        .lp-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 72px;
        }
        .lp-card {
          display: flex;
          flex-direction: column;
          background: #FFFDF8;
          border: 1px solid #E8DFCF;
          border-radius: 16px;
          padding: 36px;
        }
        .lp-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }
        .lp-card-number {
          display: block;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #AAA398;
          margin-bottom: 12px;
        }
        .lp-card-title {
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 400;
          color: #11100D;
          margin: 0 0 12px;
        }
        .lp-card-desc {
          font-size: 14px;
          line-height: 1.68;
          color: #6F6A60;
          margin: 0;
        }

        /* ── Detection ───────────────────────────────────────── */
        .lp-detect {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          margin-top: 64px;
        }
        .lp-detect-intro {
          font-size: 17px;
          line-height: 1.7;
          color: #6F6A60;
          max-width: 400px;
          margin: 0;
        }
        .lp-detect-intro + .lp-detect-intro {
          margin-top: 24px;
        }
        .lp-detect-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .lp-detect-item {
          display: flex;
          align-items: baseline;
          gap: 12px;
          padding: 16px 0;
          border-bottom: 1px solid #E8DFCF;
        }
        .lp-detect-item:first-child {
          padding-top: 0;
        }
        .lp-detect-dot {
          flex-shrink: 0;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transform: translateY(-1px);
        }
        .lp-detect-name {
          flex-shrink: 0;
          width: 176px;
          font-size: 13px;
          font-weight: 600;
          color: #11100D;
        }
        .lp-detect-desc {
          font-size: 13px;
          color: #6F6A60;
        }

        /* ── Structured timeline ─────────────────────────────── */
        .lp-timeline-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          margin-top: 64px;
        }
        .lp-timeline-intro {
          font-size: 16px;
          line-height: 1.7;
          color: #6F6A60;
          max-width: 520px;
          margin: 0;
        }
        .lp-timeline-intro + .lp-timeline-intro {
          margin-top: 24px;
        }
        .lp-timeline {
          list-style: none;
          margin: 0;
          padding: 0;
          max-width: 380px;
        }
        .lp-timeline-item {
          position: relative;
          display: flex;
          gap: 16px;
          padding-bottom: 32px;
        }
        .lp-timeline-item:last-child {
          padding-bottom: 0;
        }
        .lp-timeline-connector {
          position: absolute;
          left: 15px;
          top: 32px;
          width: 2px;
          height: calc(100% - 8px);
        }
        .lp-timeline-connector-complete {
          background: #1D9A57;
        }
        .lp-timeline-connector-upcoming {
          background: #E8DFCF;
        }
        .lp-timeline-circle {
          position: relative;
          z-index: 1;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .lp-timeline-item-complete .lp-timeline-circle {
          background: #1D9A57;
          color: #FFFDF8;
        }
        .lp-timeline-item-current .lp-timeline-circle {
          background: #FFFDF8;
          border: 2px solid #F5A91D;
          color: #8A5600;
        }
        .lp-timeline-item-upcoming .lp-timeline-circle {
          background: #FFFDF8;
          border: 1px solid #E8DFCF;
          color: #AAA398;
        }
        .lp-timeline-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }
        .lp-timeline-item-complete .lp-timeline-title {
          color: #1D9A57;
        }
        .lp-timeline-item-current .lp-timeline-title {
          color: #11100D;
        }
        .lp-timeline-item-upcoming .lp-timeline-title {
          color: #AAA398;
        }
        .lp-timeline-subtitle {
          font-size: 13px;
          color: #6F6A60;
          margin: 2px 0 0;
        }
        .lp-timeline-badge {
          margin-top: 6px;
        }

        /* ── CTA ─────────────────────────────────────────────── */
        .lp-cta {
          background: #11100D;
          padding: 128px 0;
        }
        .lp-cta-rule {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin-bottom: 64px;
        }
        .lp-cta-inner {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 64px;
          text-align: center;
        }
        .lp-cta-heading {
          font-family: var(--font-serif);
          font-size: 52px;
          font-weight: 400;
          line-height: 1.1;
          color: #FFFDF8;
          margin: 0;
        }
        .lp-cta-stats {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 48px;
          margin: 40px 0;
        }
        .lp-cta-stat {
          text-align: center;
        }
        .lp-cta-stat-value {
          display: block;
          font-family: var(--font-serif);
          font-size: 40px;
          font-weight: 400;
          line-height: 1;
          color: #F5A91D;
        }
        .lp-cta-stat-label {
          display: block;
          font-family: var(--font-mono);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #6F6A60;
          margin-top: 4px;
        }
        .lp-cta-note {
          font-size: 14px;
          color: #6F6A60;
          margin: 16px 0 0;
        }

        /* ── Footer ──────────────────────────────────────────── */
        .lp-footer {
          background: #FBF8F1;
          border-top: 1px solid #E8DFCF;
          padding: 40px 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .lp-footer-name {
          font-family: var(--font-serif);
          font-size: 14px;
          color: #11100D;
          margin: 0;
        }
        .lp-footer-tagline {
          font-size: 13px;
          color: #AAA398;
          margin: 8px 0 0;
        }
        .lp-footer-credit {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #AAA398;
          margin: 0;
        }

        /* ── Mobile ──────────────────────────────────────────── */
        @media (max-width: 768px) {
          .lp-nav {
            padding: 0 24px;
          }
          .lp-nav-links {
            gap: 16px;
          }
          .lp-hero {
            min-height: 0;
          }
          .lp-hero-inner {
            grid-template-columns: 1fr;
            gap: 56px;
            min-height: 0;
            padding: 96px 24px 64px;
          }
          .lp-hero-glow {
            display: none;
          }
          .lp-headline {
            font-size: 40px;
          }
          .lp-hero-visual {
            min-height: 0;
          }
          .lp-fb {
            display: none;
          }
          .lp-dashboard {
            margin-right: 0;
          }
          .lp-dark-stats-inner {
            padding: 40px 24px;
            gap: 32px;
          }
          .lp-dark-stat {
            min-width: 120px;
          }
          .lp-section {
            padding: 80px 24px;
          }
          .lp-section-heading {
            font-size: 32px;
          }
          .lp-cards {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 48px;
          }
          .lp-detect {
            grid-template-columns: 1fr;
            gap: 40px;
            margin-top: 48px;
          }
          .lp-detect-item {
            flex-wrap: wrap;
          }
          .lp-detect-name {
            width: auto;
          }
          .lp-detect-desc {
            width: 100%;
            padding-left: 16px;
          }
          .lp-timeline-grid {
            grid-template-columns: 1fr;
            gap: 48px;
            margin-top: 48px;
          }
          .lp-cta {
            padding: 80px 0;
          }
          .lp-cta-rule {
            margin-bottom: 48px;
          }
          .lp-cta-inner {
            padding: 0 24px;
          }
          .lp-cta-heading {
            font-size: 36px;
          }
          .lp-cta-stats {
            gap: 32px;
          }
          .lp-footer {
            flex-direction: column;
            align-items: flex-start;
            padding: 40px 24px;
          }
        }
      `}</style>

      <LandingAnimations />

      <div className="lp">
        <span className="lp-bg" aria-hidden="true" />

        {/* ── Nav ─────────────────────────────────────────────── */}
        <nav className="lp-nav">
          <Link href="/" className="lp-brand">
            <span className="lp-brand-icon" aria-hidden="true">
              ◈
            </span>
            <span className="lp-brand-name">VISALENS</span>
          </Link>
          <div className="lp-nav-links">
            <a href="#how-it-works" className="lp-nav-link">
              How it works
            </a>
            <Link href="/radar" className="lp-nav-link">
              Radar
            </Link>
            <ProfileMenu />
          </div>
        </nav>

        <div className="lp-content">
          {/* ── Hero ──────────────────────────────────────────── */}
          <section className="lp-hero">
            <span className="lp-hero-glow" aria-hidden="true" />
            <div className="lp-hero-inner">
              <div className="lp-hero-copy">
                <p className="lp-eyebrow">Eligibility Workflow Engine</p>
                <h1 className="lp-headline">
                  Don&apos;t lose the
                  <em>opportunity</em>
                  after finding it.
                </h1>
                <p className="lp-subhead">
                  VisaLens finds internships, fellowships, and research
                  programs. It scores your eligibility risk on each one and
                  builds a verification timeline so nothing falls through the
                  cracks.
                </p>
                <div className="lp-cta-row">
                  <Link href="/auth?mode=signup" className="lp-btn-primary">
                    Get Started <span aria-hidden="true">→</span>
                  </Link>
                  <a href="#how-it-works" className="lp-btn-secondary">
                    See how it works
                  </a>
                </div>
                <div className="lp-trust">
                  {trustItems.map((item, index) => (
                    <span
                      key={item}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {index > 0 && (
                        <span className="lp-trust-sep" aria-hidden="true" />
                      )}
                      <span className="lp-trust-item">{item}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="lp-hero-visual"
                aria-label="VisaLens dashboard preview"
              >
                <div className="lp-fb lp-fb-top">
                  <span className="lp-fb-label">Profile</span>
                  <div className="lp-fb-progress">
                    <span className="lp-fb-bar">
                      <span
                        className="lp-fb-bar-fill"
                        style={{ width: "92%" }}
                      />
                    </span>
                    <span className="lp-fb-pct">92%</span>
                  </div>
                  <span className="lp-fb-sub">profile complete</span>
                </div>

                <div className="lp-dashboard">
                  <div className="lp-db-top">
                    <div className="lp-db-top-left">
                      <span
                        className="lp-db-dot"
                        style={{ background: "#D83A3A" }}
                        aria-hidden="true"
                      />
                      <span
                        className="lp-db-dot"
                        style={{ background: "#F5A91D" }}
                        aria-hidden="true"
                      />
                      <span
                        className="lp-db-dot"
                        style={{ background: "#1D9A57" }}
                        aria-hidden="true"
                      />
                      <span className="lp-db-top-title">
                        visalens dashboard
                      </span>
                    </div>
                    <div className="lp-db-live">
                      <span className="lp-db-live-dot" aria-hidden="true" />
                      <span className="lp-db-live-text">LIVE</span>
                    </div>
                  </div>

                  <div className="lp-db-body">
                    <div className="lp-db-stats">
                      {dashboardStats.map((stat) => (
                        <div key={stat.label} className="lp-db-stat">
                          <span className="lp-db-stat-num">{stat.value}</span>
                          <span className="lp-db-stat-label">{stat.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="lp-db-divider" />

                    <p className="lp-db-section-label">Recent Analysis</p>
                    {recentAnalysis.map((row) => (
                      <div key={row.title} className="lp-db-row">
                        <div>
                          <div className="lp-db-row-title">{row.title}</div>
                          <div className="lp-db-row-pills">
                            {row.pills.map((pill) => (
                              <span
                                key={pill.label}
                                className={`lp-db-pill lp-chip-${pill.tone}`}
                              >
                                {pill.label}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span
                          className={`lp-db-badge lp-chip-${row.badge.tone}`}
                        >
                          {row.badge.label}
                        </span>
                      </div>
                    ))}

                    <div className="lp-db-next">
                      <span className="lp-db-next-circle" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                          <path
                            d="M3 8h10M9 4l4 4-4 4"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div>
                        <span className="lp-db-next-label">Next Action</span>
                        <p className="lp-db-next-text">
                          Request recommendation letter
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lp-fb lp-fb-bottom">
                  <span className="lp-fb-label">Documents Missing</span>
                  <p className="lp-fb-bottom-title">3 items need attention</p>
                  <div className="lp-doc-pills">
                    <span className="lp-doc-pill">Transcript</span>
                    <span className="lp-doc-pill">Offer Letter</span>
                    <span className="lp-doc-pill">I-20</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Dark stats strip ──────────────────────────────── */}
          <section className="lp-dark-stats reveal">
            <div className="lp-dark-stats-inner">
              {darkStats.map((stat) => (
                <div key={stat.label} className="lp-dark-stat">
                  <span className="lp-dark-stat-num">{stat.value}</span>
                  <span className="lp-dark-stat-label">{stat.label}</span>
                  <span className="lp-dark-stat-desc">{stat.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── How it works ──────────────────────────────────── */}
          <section
            id="how-it-works"
            className="lp-section reveal"
            style={{ background: "#FBF8F1" }}
          >
            <div className="lp-section-inner">
              <p className="lp-section-label">How It Works</p>
              <h2 className="lp-section-heading">
                Three steps from search to start date.
              </h2>
              <div className="lp-cards reveal-stagger">
                {stepCards.map((card) => (
                  <div key={card.number} className="lp-card">
                    <div
                      className="lp-card-icon"
                      style={{ background: card.tileBg, color: card.tileColor }}
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        {card.icon}
                      </svg>
                    </div>
                    <span className="lp-card-number">{card.number}</span>
                    <h3 className="lp-card-title">{card.title}</h3>
                    <p className="lp-card-desc">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Structured timeline ───────────────────────────── */}
          <section className="lp-section lp-section-surface reveal">
            <div className="lp-section-inner">
              <p className="lp-section-label">Structured Timeline</p>
              <h2 className="lp-section-heading">
                Forgotten paperwork should never cost you a dream role.
              </h2>
              <div className="lp-timeline-grid">
                <div>
                  <p className="lp-timeline-intro">
                    Once you receive an offer, the clock starts. CPT
                    authorization, DSO approval, offer letter formatting, I-20
                    updates. Each step has dependencies. Miss one and the whole
                    chain breaks.
                  </p>
                  <p className="lp-timeline-intro">
                    VisaLens builds you a structured verification timeline the
                    moment you scan an opportunity. Every step is assigned an
                    owner, an estimated time, and a status so you always know
                    exactly where you stand.
                  </p>
                </div>
                <ol className="lp-timeline">
                  {timelineItems.map((item, index) => (
                    <li
                      key={item.title}
                      className={`lp-timeline-item lp-timeline-item-${item.status}`}
                    >
                      {index < timelineItems.length - 1 && (
                        <span
                          className={`lp-timeline-connector lp-timeline-connector-${
                            item.status === "complete" ? "complete" : "upcoming"
                          }`}
                          aria-hidden="true"
                        />
                      )}
                      <span className="lp-timeline-circle">{index + 1}</span>
                      <div>
                        <p className="lp-timeline-title">{item.title}</p>
                        <p className="lp-timeline-subtitle">{item.subtitle}</p>
                        <span
                          className={`lp-pill lp-chip-${item.tone} lp-timeline-badge`}
                        >
                          {item.badge}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* ── What VisaLens detects ─────────────────────────── */}
          <section
            className="lp-section reveal"
            style={{ background: "#FBF8F1" }}
          >
            <div className="lp-section-inner">
              <p className="lp-section-label">Intelligence Layer</p>
              <h2 className="lp-section-heading">
                Built to catch what students miss.
              </h2>
              <div className="lp-detect">
                <div>
                  <p className="lp-detect-intro">
                    Most eligibility problems are not obvious. They hide in
                    phrases like must be authorized to work or funding
                    restricted to U.S. citizens. Language that looks standard
                    but can disqualify an international student entirely.
                  </p>
                  <p className="lp-detect-intro">
                    VisaLens is built around a structured extraction engine that
                    identifies these phrases, maps them to risk categories, and
                    surfaces them with evidence so you know exactly what you are
                    dealing with before you apply.
                  </p>
                </div>
                <ul className="lp-detect-list">
                  {detectionCategories.map((category) => (
                    <li key={category.name} className="lp-detect-item">
                      <span
                        className="lp-detect-dot"
                        style={{ background: category.dot }}
                        aria-hidden="true"
                      />
                      <span className="lp-detect-name">{category.name}</span>
                      <span className="lp-detect-desc">
                        {category.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ── CTA ───────────────────────────────────────────── */}
          <section className="lp-cta reveal">
            <div className="lp-cta-rule" />
            <div className="lp-cta-inner">
              <h2 className="lp-cta-heading">
                Your next opportunity is waiting.
              </h2>
              <div className="lp-cta-stats">
                {ctaStats.map((stat) => (
                  <div key={stat.label} className="lp-cta-stat">
                    <span className="lp-cta-stat-value">{stat.value}</span>
                    <span className="lp-cta-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
              <Link href="/scan" className="lp-btn-primary">
                Analyze an Opportunity <span aria-hidden="true">→</span>
              </Link>
              <p className="lp-cta-note">
                No legal advice. No guesswork. Structured eligibility
                intelligence.
              </p>
            </div>
          </section>

          {/* ── Footer ────────────────────────────────────────── */}
          <footer className="lp-footer">
            <div>
              <p className="lp-footer-name">VisaLens</p>
              <p className="lp-footer-tagline">
                Eligibility workflow engine for international students.
              </p>
            </div>
            <p className="lp-footer-credit">Built for STEMINATE HACKS 2026</p>
          </footer>
        </div>
      </div>
    </>
  );
}
