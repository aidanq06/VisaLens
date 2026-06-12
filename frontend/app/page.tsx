import Link from "next/link";
import ProfileMenu from "@/components/ui/ProfileMenu";
import LandingAnimations from "@/components/ui/LandingAnimations";

const flowSteps = [
  {
    title: "Paste any opportunity description",
    description: "Internship, fellowship, scholarship, or research program",
  },
  {
    title: "VisaLens extracts eligibility requirements",
    description: "Citizenship rules, work authorization, funding restrictions",
  },
  {
    title: "Get your risk score and action plan",
    description: "A structured timeline of every step to verify and accept the role",
  },
];

const stepCards = [
  {
    number: "01",
    title: "Find",
    description:
      "VisaLens Radar scans company career pages and surfaces fresh opportunities matched to your field.",
  },
  {
    number: "02",
    title: "Analyze",
    description:
      "Paste any opportunity. VisaLens extracts hidden eligibility requirements and scores your risk across 7 categories.",
  },
  {
    number: "03",
    title: "Act",
    description:
      "Get a structured verification timeline with every step assigned to you, your DSO, or the organizer.",
  },
];

const detectionCategories = [
  {
    dot: "#dc2626",
    name: "Citizenship Restrictions",
    description: "U.S. citizens or permanent residents only",
  },
  {
    dot: "#f5a623",
    name: "Work Authorization",
    description: "Must be eligible to work in the U.S.",
  },
  {
    dot: "#f5a623",
    name: "Funding Restrictions",
    description: "Federal or citizenship-based funding",
  },
  {
    dot: "#ca8a04",
    name: "Location Requirements",
    description: "Remote but must be located in the U.S.",
  },
  {
    dot: "#16a34a",
    name: "International Friendly",
    description: "Open worldwide, no work auth required",
  },
  {
    dot: "#adadad",
    name: "Ambiguous Language",
    description: "Phrases that require human verification",
  },
];

export default function Home() {
  return (
    <>
      <style>{`
        html {
          background: #ffffff;
        }

        .lp {
          background: #ffffff;
          color: #0f0f0f;
          min-height: 100vh;
          font-family: var(--font-sans);
        }

        /* ── Scroll reveal ───────────────────────────────────── */
        .fade-section {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }
        .fade-section.fade-in {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .fade-section {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }

        /* ── Nav ─────────────────────────────────────────────── */
        .lp-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          height: 56px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border-bottom: 1px solid #e8e8e4;
        }
        .lp-brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .lp-brand-icon {
          color: #f5a623;
          font-size: 13px;
          line-height: 1;
        }
        .lp-brand-name {
          font-family: var(--font-serif);
          font-size: 15px;
          font-weight: 500;
          color: #0f0f0f;
        }
        .lp-nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .lp-nav-link {
          font-size: 13px;
          color: #6b6b6b;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .lp-nav-link:hover {
          color: #0f0f0f;
        }

        /* ── Buttons ─────────────────────────────────────────── */
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 8px;
          background: #f5a623;
          color: #0f0f0f;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s ease;
        }
        .lp-btn-primary:hover {
          background: #d4890f;
        }
        .lp-btn-secondary {
          display: inline-flex;
          align-items: center;
          padding: 14px 28px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid #e8e8e4;
          color: #6b6b6b;
          font-size: 14px;
          text-decoration: none;
          transition: border-color 0.15s ease;
        }
        .lp-btn-secondary:hover {
          border-color: #adadad;
        }

        /* ── Hero ────────────────────────────────────────────── */
        .lp-hero {
          min-height: 100vh;
          padding: 56px 32px 0;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 11fr 9fr;
          gap: 64px;
          align-items: center;
        }
        .lp-eyebrow {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #adadad;
          margin: 0;
        }
        .lp-headline {
          font-family: var(--font-serif);
          font-size: 64px;
          font-weight: 400;
          line-height: 1.05;
          color: #0f0f0f;
          margin: 16px 0 0;
        }
        .lp-headline em {
          color: #f5a623;
          font-style: italic;
        }
        .lp-subhead {
          font-size: 17px;
          line-height: 1.65;
          color: #6b6b6b;
          max-width: 420px;
          margin: 24px 0 0;
        }
        .lp-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 40px;
        }

        /* ── Hero flow card ──────────────────────────────────── */
        .lp-flow {
          background: #f8f8f6;
          border: 1px solid #e8e8e4;
          border-radius: 16px;
          padding: 32px;
          max-width: 420px;
          justify-self: end;
          width: 100%;
        }
        .lp-flow-title {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #adadad;
          margin: 0 0 24px;
        }
        .lp-flow-step {
          display: flex;
          gap: 16px;
        }
        .lp-flow-rail {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .lp-flow-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e8e8e4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #adadad;
        }
        .lp-flow-line {
          width: 1px;
          flex: 1;
          min-height: 24px;
          background: #e8e8e4;
        }
        .lp-flow-text {
          padding-bottom: 24px;
        }
        .lp-flow-step:last-of-type .lp-flow-text {
          padding-bottom: 0;
        }
        .lp-flow-step-title {
          font-size: 14px;
          font-weight: 500;
          color: #0f0f0f;
          margin: 0;
        }
        .lp-flow-step-desc {
          font-size: 13px;
          color: #6b6b6b;
          margin: 2px 0 0;
        }
        .lp-flow-separator {
          height: 1px;
          background: #e8e8e4;
          margin: 24px 0;
        }
        .lp-flow-result {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .lp-flow-result-label {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #adadad;
        }
        .lp-flow-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          padding: 2px 8px;
        }
        .lp-flow-result-text {
          font-size: 13px;
          color: #6b6b6b;
          margin: 8px 0 0;
        }

        /* ── Sections ────────────────────────────────────────── */
        .lp-section {
          padding: 120px 32px;
          scroll-margin-top: 56px;
        }
        .lp-section-surface {
          background: #f8f8f6;
        }
        .lp-section-inner {
          max-width: 1080px;
          margin: 0 auto;
        }
        .lp-section-label {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #adadad;
          margin: 0;
        }
        .lp-section-heading {
          font-family: var(--font-serif);
          font-size: 42px;
          font-weight: 400;
          line-height: 1.16;
          color: #0f0f0f;
          margin: 16px 0 0;
        }

        /* ── How it works cards ──────────────────────────────── */
        .lp-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 64px;
        }
        .lp-card {
          background: #ffffff;
          border: 1px solid #e8e8e4;
          border-radius: 12px;
          padding: 32px;
        }
        .lp-card-number {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #adadad;
        }
        .lp-card-title {
          font-family: var(--font-serif);
          font-size: 20px;
          font-weight: 400;
          color: #0f0f0f;
          margin: 16px 0 0;
        }
        .lp-card-desc {
          font-size: 14px;
          line-height: 1.65;
          color: #6b6b6b;
          margin: 12px 0 0;
        }

        /* ── Detection ───────────────────────────────────────── */
        .lp-detect {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          margin-top: 64px;
        }
        .lp-detect-intro {
          font-size: 16px;
          line-height: 1.7;
          color: #6b6b6b;
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
          padding: 14px 0;
          border-bottom: 1px solid #e8e8e4;
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
          font-weight: 500;
          color: #0f0f0f;
        }
        .lp-detect-desc {
          font-size: 13px;
          color: #6b6b6b;
        }

        /* ── CTA ─────────────────────────────────────────────── */
        .lp-cta {
          background: #0f0f0f;
          padding: 120px 32px;
        }
        .lp-cta-inner {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }
        .lp-cta-heading {
          font-family: var(--font-serif);
          font-size: 48px;
          font-weight: 400;
          line-height: 1.1;
          color: #ffffff;
          margin: 0;
        }
        .lp-cta-body {
          font-size: 17px;
          line-height: 1.6;
          color: #6b6b6b;
          margin: 16px 0 0;
        }
        .lp-cta-action {
          margin-top: 40px;
        }

        /* ── Footer ──────────────────────────────────────────── */
        .lp-footer {
          background: #ffffff;
          border-top: 1px solid #e8e8e4;
          padding: 40px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .lp-footer-name {
          font-family: var(--font-serif);
          font-size: 14px;
          color: #0f0f0f;
          margin: 0;
        }
        .lp-footer-tagline {
          font-size: 13px;
          color: #adadad;
          margin: 8px 0 0;
        }
        .lp-footer-credit {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #adadad;
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
            grid-template-columns: 1fr;
            gap: 48px;
            min-height: 0;
            padding: 120px 24px 64px;
          }
          .lp-headline {
            font-size: 40px;
          }
          .lp-flow {
            justify-self: start;
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
          .lp-cta {
            padding: 80px 24px;
          }
          .lp-cta-heading {
            font-size: 36px;
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
        {/* ── Nav ─────────────────────────────────────────────── */}
        <nav className="lp-nav">
          <Link href="/" className="lp-brand">
            <span className="lp-brand-icon" aria-hidden="true">
              ◈
            </span>
            <span className="lp-brand-name">VisaLens</span>
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

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="lp-hero">
          <div>
            <p className="lp-eyebrow">Eligibility Workflow Engine</p>
            <h1 className="lp-headline">
              Don&apos;t lose the
              <br />
              <em>opportunity</em>
              <br />
              after finding it.
            </h1>
            <p className="lp-subhead">
              VisaLens finds internships, fellowships, and research programs.
              It scores your eligibility risk on each one and builds a
              verification timeline so nothing falls through the cracks.
            </p>
            <div className="lp-cta-row">
              <Link href="/scan" className="lp-btn-primary">
                Analyze an Opportunity <span aria-hidden="true">→</span>
              </Link>
              <a href="#how-it-works" className="lp-btn-secondary">
                See how it works
              </a>
            </div>
          </div>

          <div className="lp-flow" aria-label="How VisaLens works, in three steps">
            <p className="lp-flow-title">How it works</p>

            {flowSteps.map((step, index) => (
              <div key={step.title} className="lp-flow-step">
                <div className="lp-flow-rail">
                  <span className="lp-flow-circle">{index + 1}</span>
                  {index < flowSteps.length - 1 && (
                    <span className="lp-flow-line" />
                  )}
                </div>
                <div className="lp-flow-text">
                  <p className="lp-flow-step-title">{step.title}</p>
                  <p className="lp-flow-step-desc">{step.description}</p>
                </div>
              </div>
            ))}

            <div className="lp-flow-separator" />
            <div className="lp-flow-result">
              <span className="lp-flow-result-label">Sample Result</span>
              <span className="lp-flow-badge">High Risk</span>
            </div>
            <p className="lp-flow-result-text">
              Citizenship restriction detected. Work authorization required.
            </p>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="lp-section lp-section-surface fade-section"
        >
          <div className="lp-section-inner">
            <p className="lp-section-label">How It Works</p>
            <h2 className="lp-section-heading">
              Three steps from search to start date.
            </h2>
            <div className="lp-cards">
              {stepCards.map((card) => (
                <div key={card.number} className="lp-card">
                  <span className="lp-card-number">{card.number}</span>
                  <h3 className="lp-card-title">{card.title}</h3>
                  <p className="lp-card-desc">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What VisaLens detects ───────────────────────────── */}
        <section className="lp-section fade-section">
          <div className="lp-section-inner">
            <p className="lp-section-label">Intelligence Layer</p>
            <h2 className="lp-section-heading">
              Built to catch what students miss.
            </h2>
            <div className="lp-detect">
              <div>
                <p className="lp-detect-intro">
                  Most eligibility problems are not obvious. They hide in
                  phrases like must be authorized to work or funding restricted
                  to U.S. citizens. Language that looks standard but can
                  disqualify an international student entirely.
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

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section className="lp-cta fade-section">
          <div className="lp-cta-inner">
            <h2 className="lp-cta-heading">
              Your next opportunity is waiting.
            </h2>
            <p className="lp-cta-body">
              Analyze it before you apply. Know your risk before you commit.
            </p>
            <div className="lp-cta-action">
              <Link href="/scan" className="lp-btn-primary">
                Analyze an Opportunity <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
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
    </>
  );
}
