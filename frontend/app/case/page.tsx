"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CaseDiff, RiskLevel, VisaLensAnalysis } from "@/types/analysis";
import { analyzeClarification, loadStoredAnalysis, storeAnalysis } from "@/lib/api";
import RiskBadge from "@/components/ui/RiskBadge";

const MONO = "var(--font-mono)";

const LEVEL_COLOR: Record<string, string> = {
  low: "#22c55e",
  moderate: "#f5a623",
  medium_high: "#fb923c",
  high: "#ef4343",
};

const SAMPLE_REPLY =
  "Thank you for reaching out. F-1 students may apply, but because this is a " +
  "paid internship, students must coordinate with their university to confirm " +
  "CPT or OPT authorization before starting. We do not require U.S. " +
  "citizenship or permanent residency.";

function ScorePill({ score, level, label }: { score: number; level: string; label: string }) {
  const color = LEVEL_COLOR[level] ?? "#7a7f99";
  return (
    <div
      style={{
        padding: "14px 24px",
        borderRadius: "12px",
        background: `${color}14`,
        border: `1px solid ${color}33`,
        textAlign: "center",
        minWidth: "110px",
      }}
    >
      <p style={{ fontSize: "11px", color: "#7a7f99", fontFamily: MONO, marginBottom: "2px" }}>
        {label}
      </p>
      <p style={{ fontSize: "30px", fontWeight: 600, color, lineHeight: 1, fontFamily: MONO }}>
        {score}
      </p>
      <p style={{ fontSize: "10px", color, fontFamily: MONO, marginTop: "4px", textTransform: "uppercase" }}>
        {level.replace("_", "-")}
      </p>
    </div>
  );
}

export default function CasePage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<VisaLensAnalysis | null>(null);
  const [missing, setMissing] = useState(false);
  const [reply, setReply] = useState("");
  const [source, setSource] = useState<"organizer" | "advisor">("organizer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<CaseDiff | null>(null);
  const [updated, setUpdated] = useState<VisaLensAnalysis | null>(null);

  useEffect(() => {
    const stored = loadStoredAnalysis();
    if (stored) setAnalysis(stored);
    else setMissing(true);
  }, []);

  async function handleAnalyze() {
    if (!analysis || reply.trim().length < 20) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeClarification(analysis, reply, source);
      setDiff(result.case_diff);
      setUpdated(result.updated_analysis);
    } catch {
      setError(
        "Could not reach the clarification service. Make sure the backend is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }

  function applyUpdate() {
    if (!updated) return;
    storeAnalysis(updated);
    router.push("/results");
  }

  function downloadUpdatedReport() {
    if (!updated?.report_markdown) return;
    const blob = new Blob([updated.report_markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visalens-updated-report.md";
    a.click();
    URL.revokeObjectURL(url);
  }

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
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
        >
          <span style={{ color: "#f5a623", fontSize: "16px" }}>◈</span>
          <span style={{ fontWeight: 500, fontSize: "14px", color: "#e4e6f0" }}>VisaLens</span>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "4px",
              color: "#f5a623",
              background: "rgba(245,166,35,0.1)",
              border: "1px solid rgba(245,166,35,0.2)",
              fontFamily: MONO,
            }}
          >
            CASE
          </span>
        </Link>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/results"
            style={{
              fontSize: "12px",
              padding: "7px 14px",
              borderRadius: "8px",
              color: "#7a7f99",
              background: "#161823",
              border: "1px solid #252838",
              textDecoration: "none",
              fontFamily: MONO,
            }}
          >
            Back to report
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: "32px" }}>
          <p
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#484d66",
              fontFamily: MONO,
              marginBottom: "8px",
            }}
          >
            Case Workspace
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "32px",
              lineHeight: 1.1,
              marginBottom: "8px",
            }}
          >
            Got a reply? Update your case.
          </h1>
          <p style={{ fontSize: "14px", color: "#7a7f99", maxWidth: "620px" }}>
            Paste the organizer or advisor response below. VisaLens re-analyzes the
            case with the same deterministic rules and shows exactly which blockers
            were resolved and which remain.
          </p>
        </div>

        {missing ? (
          <div
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "#0f1018",
              border: "1px solid #252838",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "13px", color: "#7a7f99", marginBottom: "16px" }}>
              No active case found. Analyze an opportunity first — the case workspace
              picks up from your latest report.
            </p>
            <Link
              href="/scan"
              style={{
                display: "inline-block",
                fontSize: "13px",
                padding: "10px 20px",
                borderRadius: "10px",
                background: "#f5a623",
                color: "#080910",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Analyze an opportunity →
            </Link>
          </div>
        ) : analysis ? (
          <>
            {/* Current case summary */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
                background: "#0f1018",
                border: "1px solid #252838",
                borderRadius: "16px",
                padding: "20px 24px",
                marginBottom: "16px",
              }}
            >
              <ScorePill
                score={analysis.risk.score}
                level={analysis.risk.level}
                label="Current risk"
              />
              <div style={{ flex: "1 1 300px" }}>
                <p style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
                  {analysis.risk.main_label}
                </p>
                <p style={{ fontSize: "12px", color: "#7a7f99", lineHeight: 1.6 }}>
                  {analysis.risk.summary}
                </p>
              </div>
            </div>

            {/* Clarification input */}
            <div
              style={{
                background: "#0f1018",
                border: "1px solid #252838",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "14px",
                }}
              >
                <p style={{ fontSize: "13px", fontWeight: 500 }}>
                  Paste the reply you received
                </p>
                <div style={{ display: "flex", gap: "6px" }}>
                  {(["organizer", "advisor"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSource(s)}
                      style={{
                        fontSize: "11px",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        color: source === s ? "#f5a623" : "#7a7f99",
                        background: source === s ? "rgba(245,166,35,0.1)" : "#161823",
                        border: `1px solid ${source === s ? "rgba(245,166,35,0.35)" : "#252838"}`,
                        cursor: "pointer",
                        fontFamily: MONO,
                        textTransform: "capitalize",
                      }}
                    >
                      From {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setReply(SAMPLE_REPLY)}
                    style={{
                      fontSize: "11px",
                      padding: "5px 12px",
                      borderRadius: "8px",
                      color: "#7a7f99",
                      background: "#161823",
                      border: "1px solid #252838",
                      cursor: "pointer",
                      fontFamily: MONO,
                    }}
                  >
                    Sample reply
                  </button>
                </div>
              </div>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={6}
                placeholder='Example: "F-1 students may apply, but students must coordinate CPT or OPT authorization with their university before starting…"'
                style={{
                  width: "100%",
                  background: "#080910",
                  border: `1px solid ${reply.length >= 20 ? "rgba(245,166,35,0.3)" : "#252838"}`,
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "13px",
                  color: "#e4e6f0",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.6,
                  fontFamily: MONO,
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || reply.trim().length < 20}
                style={{
                  marginTop: "14px",
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  background: !loading && reply.trim().length >= 20 ? "#f5a623" : "#1e2130",
                  color: !loading && reply.trim().length >= 20 ? "#080910" : "#484d66",
                  border: "none",
                  cursor: !loading && reply.trim().length >= 20 ? "pointer" : "not-allowed",
                }}
              >
                {loading ? "Re-analyzing case…" : "Analyze clarification →"}
              </button>
              {error && (
                <p style={{ fontSize: "12px", color: "#ef9a9a", marginTop: "10px" }}>{error}</p>
              )}
            </div>

            {/* Diff */}
            {diff && updated && (
              <div
                style={{
                  background: "#0f1018",
                  border: "1px solid #252838",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#484d66",
                    fontFamily: MONO,
                    marginBottom: "16px",
                  }}
                >
                  Case Update
                </p>

                {/* Status banner */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "12px",
                    background: `${LEVEL_COLOR[diff.level_after]}10`,
                    border: `1px solid ${LEVEL_COLOR[diff.level_after]}30`,
                    marginBottom: "20px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: LEVEL_COLOR[diff.level_after],
                      marginBottom: "4px",
                    }}
                  >
                    {diff.case_status}
                  </p>
                  <p style={{ fontSize: "12px", color: "#7a7f99", lineHeight: 1.6 }}>
                    {diff.new_recommendation}
                  </p>
                </div>

                {/* Before → after */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "20px",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                  }}
                >
                  {diff.score_before !== null && diff.level_before && (
                    <ScorePill score={diff.score_before} level={diff.level_before} label="Before" />
                  )}
                  <span style={{ fontSize: "24px", color: "#484d66" }}>→</span>
                  <ScorePill score={diff.score_after} level={diff.level_after} label="After" />
                </div>

                {/* Blockers */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "rgba(34,197,94,0.05)",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#22c55e", marginBottom: "8px" }}>
                      Resolved
                    </p>
                    {diff.resolved_blockers.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "#484d66" }}>
                        No blockers resolved by this reply.
                      </p>
                    ) : (
                      diff.resolved_blockers.map((b) => (
                        <p key={b} style={{ fontSize: "12px", color: "#7a7f99", marginBottom: "4px" }}>
                          ✓ {b}
                        </p>
                      ))
                    )}
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "rgba(245,166,35,0.05)",
                      border: "1px solid rgba(245,166,35,0.2)",
                    }}
                  >
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#f5a623", marginBottom: "8px" }}>
                      Still needs verification
                    </p>
                    {diff.remaining_blockers.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "#484d66" }}>
                        No remaining blockers detected.
                      </p>
                    ) : (
                      diff.remaining_blockers.map((b) => (
                        <p key={b} style={{ fontSize: "12px", color: "#7a7f99", marginBottom: "4px" }}>
                          ⚠ {b}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {/* Change summary */}
                <div style={{ marginBottom: "20px" }}>
                  <p
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#484d66",
                      fontFamily: MONO,
                      marginBottom: "8px",
                    }}
                  >
                    What changed
                  </p>
                  {diff.change_summary.map((c, i) => (
                    <p
                      key={i}
                      style={{
                        fontSize: "13px",
                        color: "#e4e6f0",
                        lineHeight: 1.6,
                        marginBottom: "4px",
                      }}
                    >
                      • {c}
                    </p>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={applyUpdate}
                    style={{
                      fontSize: "13px",
                      padding: "12px 22px",
                      borderRadius: "10px",
                      background: "#f5a623",
                      color: "#080910",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    View updated report →
                  </button>
                  {updated.report_markdown && (
                    <button
                      onClick={downloadUpdatedReport}
                      style={{
                        fontSize: "13px",
                        padding: "12px 22px",
                        borderRadius: "10px",
                        color: "#f5a623",
                        background: "rgba(245,166,35,0.08)",
                        border: "1px solid rgba(245,166,35,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      Download updated report
                    </button>
                  )}
                  <span style={{ alignSelf: "center" }}>
                    <RiskBadge level={diff.level_after as RiskLevel} size="sm" />
                  </span>
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Disclaimer */}
        <p style={{ fontSize: "11px", color: "#484d66", marginTop: "24px", lineHeight: 1.6 }}>
          VisaLens never asserts legal eligibility. A cleared question still
          requires written confirmation — keep every organizer and advisor reply
          with your application materials.
        </p>
      </div>
    </div>
  );
}
