"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { VisaLensAnalysis } from "@/types/analysis";
import { mockAnalysis } from "@/data/mockAnalysis";
import { loadStoredAnalysis } from "@/lib/api";
import RiskScoreCard from "@/components/dashboard/RiskScoreCard";
import ExtractedFieldsCard from "@/components/dashboard/ExtractedFieldsCard";
import BlockerGraph from "@/components/graph/BlockerGraph";
import TimelineRiskCard from "@/components/timeline/TimelineRiskCard";
import VerificationKit from "@/components/dashboard/VerificationKit";
import RiskBadge from "@/components/ui/RiskBadge";

const LEVEL_COLOR: Record<string, string> = {
  low: "#22c55e",
  moderate: "#f5a623",
  medium_high: "#fb923c",
  high: "#ef4343",
};

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

  const [analysis, setAnalysis] = useState<VisaLensAnalysis | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const stored = demoRequested ? null : loadStoredAnalysis();
    if (stored) {
      setAnalysis(stored);
      setIsDemo(false);
    } else {
      setAnalysis(mockAnalysis);
      setIsDemo(true);
    }
  }, [demoRequested]);

  if (!analysis) {
    return (
      <div
        style={{
          background: "#080910",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: "13px", color: "#7a7f99", fontFamily: "var(--font-mono)" }}>
          Loading analysis…
        </p>
      </div>
    );
  }

  const scoreColor = LEVEL_COLOR[analysis.risk.level] ?? "#ef4343";

  return (
    <div style={{ background: "#080910", minHeight: "100vh", color: "#e4e6f0" }}>
      {/* Nav */}
      <nav
        style={{
          borderBottom: "1px solid #1a1d2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 32px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(8,9,16,0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
        >
          <span style={{ color: "#f5a623", fontSize: "16px" }}>◈</span>
          <span style={{ fontWeight: "500", fontSize: "14px", color: "#e4e6f0" }}>VisaLens</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isDemo && (
            <span
              style={{
                fontSize: "10px",
                padding: "3px 10px",
                borderRadius: "999px",
                color: "#7a7f99",
                background: "#161823",
                border: "1px dashed #353a52",
                fontFamily: "var(--font-mono)",
              }}
            >
              Demo data
            </span>
          )}
          <RiskBadge level={analysis.risk.level} />
          {analysis.report_markdown && (
            <button
              onClick={() => downloadReport(analysis)}
              style={{
                fontSize: "12px",
                padding: "7px 14px",
                borderRadius: "8px",
                color: "#f5a623",
                background: "rgba(245,166,35,0.08)",
                border: "1px solid rgba(245,166,35,0.25)",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
              }}
            >
              Download report
            </button>
          )}
          <Link
            href="/scan"
            style={{
              fontSize: "12px",
              padding: "7px 14px",
              borderRadius: "8px",
              color: "#7a7f99",
              background: "#161823",
              border: "1px solid #252838",
              textDecoration: "none",
              fontFamily: "var(--font-mono)",
            }}
          >
            New scan
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #1a1d2a",
          padding: "32px",
          background: "#0f1018",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#484d66",
              fontFamily: "var(--font-mono)",
              marginBottom: "6px",
            }}
          >
            Opportunity Risk Report
          </p>
          <div
            style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "28px",
                  color: "#e4e6f0",
                  marginBottom: "4px",
                }}
              >
                {analysis.extracted.opportunity_type.charAt(0).toUpperCase() +
                  analysis.extracted.opportunity_type.slice(1)}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <RiskBadge level={analysis.risk.level} size="sm" />
                <span
                  style={{
                    fontSize: "12px",
                    color: "#7a7f99",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Score: {analysis.risk.score}/100
                </span>
                {analysis.extracted.paid_status === "paid" && (
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      color: "#f5a623",
                      background: "rgba(245,166,35,0.08)",
                      border: "1px solid rgba(245,166,35,0.2)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Paid
                  </span>
                )}
                {analysis.extracted.location_requirement && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#7a7f99",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    📍 {analysis.extracted.location_requirement}
                  </span>
                )}
              </div>
            </div>

            {/* Risk score pill */}
            <div
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                background: `${scoreColor}14`,
                border: `1px solid ${scoreColor}33`,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#7a7f99",
                  fontFamily: "var(--font-mono)",
                  marginBottom: "2px",
                }}
              >
                Risk Score
              </p>
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "600",
                  color: scoreColor,
                  lineHeight: "1",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {analysis.risk.score}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#7a7f99",
                  fontFamily: "var(--font-mono)",
                }}
              >
                /100
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        {/* Risk Score Card — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <RiskScoreCard risk={analysis.risk} />
        </div>

        {/* Extracted fields */}
        <div style={{ gridColumn: "1 / -1" }}>
          <ExtractedFieldsCard extracted={analysis.extracted} />
        </div>

        {/* Blocker graph */}
        <div>
          <BlockerGraph graph={analysis.graph} />
        </div>

        {/* Timeline */}
        <div>
          <TimelineRiskCard timeline={analysis.timeline} />
        </div>

        {/* Verification kit — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <VerificationKit verification={analysis.verification} />
        </div>

        {/* Disclaimer */}
        <div
          style={{
            gridColumn: "1 / -1",
            padding: "16px 20px",
            borderRadius: "12px",
            background: "#0f1018",
            border: "1px solid #1a1d2a",
          }}
        >
          <p style={{ fontSize: "11px", color: "#484d66", lineHeight: "1.5" }}>
            <strong style={{ color: "#7a7f99" }}>Disclaimer:</strong>{" "}
            {analysis.verification.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
