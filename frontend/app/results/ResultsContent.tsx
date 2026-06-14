"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { RiskLevel, VisaLensAnalysis } from "@/types/analysis";
import { riskLabel } from "@/lib/utils";
import { mockAnalysis } from "@/data/mockAnalysis";
import { loadStoredAnalysis } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import RiskScoreCard from "@/components/dashboard/RiskScoreCard";
import ExtractedFieldsCard from "@/components/dashboard/ExtractedFieldsCard";
import BlockerGraph from "@/components/graph/BlockerGraph";
import TimelineRiskCard from "@/components/timeline/TimelineRiskCard";
import VerificationKit from "@/components/dashboard/VerificationKit";

/* Large score-number color per risk level. */
const SCORE_COLOR: Record<string, string> = {
  high: "#D83A3A",
  medium_high: "#8A5600",
  moderate: "#F5A91D",
  low: "#1D9A57",
};

/* Pill/badge palette per risk level. */
const BADGE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  high: { bg: "#FFE8E8", color: "#D83A3A", border: "#F5C0C0" },
  medium_high: { bg: "#FFF1C7", color: "#8A5600", border: "#E8C96A" },
  moderate: { bg: "#FFF4D6", color: "#8A5600", border: "#E8DFCF" },
  low: { bg: "#E6F7ED", color: "#1D9A57", border: "#A8DFC0" },
};

const CARD_SHELL: React.CSSProperties = {
  background: "#FFFDF8",
  border: "1px solid #E8DFCF",
  borderRadius: "14px",
  overflow: "hidden",
};

function LevelBadge({ level }: { level: RiskLevel }) {
  const s = BADGE_STYLE[level] ?? BADGE_STYLE.moderate;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        fontWeight: 700,
        borderRadius: "4px",
        padding: "4px 12px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {riskLabel(level)}
    </span>
  );
}

function downloadReport(analysis: VisaLensAnalysis) {
  if (!analysis.report_markdown) return;
  const blob = new Blob([analysis.report_markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "visalens-report.md";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsContent() {
  const searchParams = useSearchParams();
  const demoRequested = searchParams.get("demo") === "true";

  const scanId = searchParams.get("scan");

  const [analysis, setAnalysis] = useState<VisaLensAnalysis | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<boolean[]>([]);

  useEffect(() => {
    let cancelled = false;

    function initChecklist(a: VisaLensAnalysis, saved?: unknown) {
      const steps = a.timeline?.critical_path?.length ?? 0;
      const savedList = Array.isArray(saved) ? saved : [];
      setChecklist(
        Array.from({ length: steps }, (_, i) => savedList[i] === true)
      );
    }

    function loadLocal(scanFetchFailed: boolean) {
      const stored = demoRequested ? null : loadStoredAnalysis();
      if (stored) {
        setAnalysis(stored);
        setIsDemo(false);
        initChecklist(stored);
      } else {
        if (scanFetchFailed) setLoadError("Could not load saved scan");
        setAnalysis(mockAnalysis);
        setIsDemo(true);
        initChecklist(mockAnalysis);
      }
    }

    if (!scanId) {
      loadLocal(false);
      return;
    }

    // Saved scan requested: fetch from Supabase, fall back to local data.
    (async () => {
      const { data, error } = await supabase
        .from("saved_scans")
        .select("*")
        .eq("id", scanId)
        .single();
      if (cancelled) return;
      if (!error && data?.analysis_json) {
        const saved = data.analysis_json as VisaLensAnalysis;
        setAnalysis(saved);
        setIsDemo(false);
        initChecklist(saved, data.checklist_progress);
      } else {
        loadLocal(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [demoRequested, scanId]);

  async function toggleStep(index: number) {
    const next = checklist.map((v, i) => (i === index ? !v : v));
    setChecklist(next);
    if (!scanId) return;
    const user = await getUser();
    if (!user) return;
    const { error } = await supabase
      .from("saved_scans")
      .update({ checklist_progress: next })
      .eq("id", scanId);
    if (error) console.error("Failed to save checklist progress:", error);
  }

  if (!analysis) {
    return (
      <div
        style={{
          background: "#FBF8F1",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: "13px", color: "#AAA398", fontFamily: "var(--font-mono)" }}>
          Loading analysis...
        </p>
      </div>
    );
  }

  const level = analysis.risk.level;
  const scoreColor = SCORE_COLOR[level] ?? "#D83A3A";
  const title =
    analysis.extracted.opportunity_type.charAt(0).toUpperCase() +
    analysis.extracted.opportunity_type.slice(1);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FBF8F1",
        backgroundImage: "radial-gradient(circle, #DDD5C4 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        color: "#11100D",
      }}
    >
      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav
        className="results-nav"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: "56px",
          padding: "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          background: "rgba(251,248,241,0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid #E8DFCF",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}
        >
          <span style={{ color: "#F5A91D", fontSize: "18px", lineHeight: 1 }}>◈</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "#11100D",
            }}
          >
            VISALENS
          </span>
        </Link>

        {/* Center: risk badge + opportunity title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1, justifyContent: "center" }}>
          <LevelBadge level={level} />
          <span
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#11100D",
              maxWidth: "320px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </span>
        </div>

        {/* Right: chips + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          {loadError && (
            <span
              style={{
                fontSize: "10px",
                padding: "3px 10px",
                borderRadius: "4px",
                color: "#D83A3A",
                background: "#FFE8E8",
                border: "1px solid #F5C0C0",
                fontFamily: "var(--font-mono)",
              }}
            >
              {loadError}
            </span>
          )}
          {isDemo && (
            <span
              style={{
                fontSize: "10px",
                padding: "3px 10px",
                borderRadius: "4px",
                color: "#AAA398",
                background: "#F3EFE6",
                border: "1px solid #E8DFCF",
                fontFamily: "var(--font-mono)",
              }}
            >
              Demo data
            </span>
          )}
          <Link
            href="/case"
            className="results-btn-secondary"
            style={{
              fontSize: "13px",
              padding: "8px 16px",
              borderRadius: "8px",
              color: "#6F6A60",
              background: "transparent",
              border: "1px solid #D8C7A8",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Got a reply?
          </Link>
          {analysis.report_markdown && (
            <button
              onClick={() => downloadReport(analysis)}
              className="results-btn-secondary"
              style={{
                fontSize: "13px",
                padding: "8px 16px",
                borderRadius: "8px",
                color: "#6F6A60",
                background: "transparent",
                border: "1px solid #D8C7A8",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Download Report
            </button>
          )}
          <Link
            href="/scan"
            className="results-btn-primary"
            style={{
              fontSize: "13px",
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: "8px",
              color: "#11100D",
              background: "#F5A91D",
              border: "none",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            New Scan
          </Link>
        </div>
      </nav>

      {/* ── Hero header ───────────────────────────────────────── */}
      <div
        className="results-hero"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px 48px 32px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "32px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#AAA398",
              marginBottom: "8px",
            }}
          >
            OPPORTUNITY RISK REPORT
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "36px",
              fontWeight: 500,
              lineHeight: 1.1,
              color: "#11100D",
              margin: 0,
            }}
          >
            {title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
            <LevelBadge level={level} />
            <span
              style={{
                background: "#FBF8F1",
                border: "1px solid #E8DFCF",
                color: "#6F6A60",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "4px",
              }}
            >
              Score: {analysis.risk.score}/100
            </span>
            {analysis.extracted.paid_status === "paid" && (
              <span
                style={{
                  background: "#E6F7ED",
                  border: "1px solid #A8DFC0",
                  color: "#1D9A57",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "4px",
                }}
              >
                Paid
              </span>
            )}
            {analysis.extracted.location_requirement && (
              <span
                style={{
                  background: "#FBF8F1",
                  border: "1px solid #E8DFCF",
                  color: "#6F6A60",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  padding: "3px 10px",
                  borderRadius: "4px",
                }}
              >
                📍 {analysis.extracted.location_requirement}
              </span>
            )}
          </div>
        </div>

        {/* Score display card */}
        <div
          style={{
            flexShrink: 0,
            background: "#FFFDF8",
            border: "1px solid #E8DFCF",
            borderRadius: "14px",
            padding: "20px 24px",
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(17,16,13,0.05)",
          }}
        >
          <p style={{ margin: 0, lineHeight: 1 }}>
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "52px",
                fontWeight: 500,
                color: scoreColor,
              }}
            >
              {analysis.risk.score}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                color: "#AAA398",
                marginLeft: "4px",
              }}
            >
              /100
            </span>
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#AAA398",
              marginTop: "6px",
            }}
          >
            RISK SCORE
          </p>
        </div>
      </div>

      {/* ── Content grid ──────────────────────────────────────── */}
      <div
        className="results-content results-grid"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 48px 80px",
          display: "grid",
          gap: "20px",
        }}
      >
        {/* Risk Score Card — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <RiskScoreCard risk={analysis.risk} />
        </div>

        {/* Extracted fields + Verification kit, side by side */}
        <ExtractedFieldsCard extracted={analysis.extracted} />
        <VerificationKit verification={analysis.verification} />

        {/* Blocker graph + Timeline, side by side (kept in card shells) */}
        <div style={CARD_SHELL}>
          <BlockerGraph graph={analysis.graph} />
        </div>
        <div style={CARD_SHELL}>
          <TimelineRiskCard
            timeline={analysis.timeline}
            checklistProgress={isDemo ? undefined : checklist}
            onToggleStep={isDemo ? undefined : toggleStep}
          />
        </div>
      </div>

      <style jsx>{`
        .results-grid {
          grid-template-columns: 1fr 1fr;
        }
        .results-btn-secondary:hover {
          border-color: #aaa398 !important;
        }
        .results-btn-primary:hover {
          background: #d4890f !important;
        }
        @media (max-width: 860px) {
          .results-nav {
            padding: 0 24px;
          }
          .results-hero {
            padding: 32px 24px 24px;
            flex-direction: column;
          }
          .results-content {
            padding: 0 24px 64px;
          }
          .results-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
