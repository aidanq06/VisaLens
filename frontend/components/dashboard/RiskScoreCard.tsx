"use client";

import type { VisaLensAnalysis } from "@/types/analysis";

type Props = { risk: VisaLensAnalysis["risk"] };

/* Score-number / gauge color per risk level. */
const LEVEL_COLOR: Record<string, string> = {
  high: "#D83A3A",
  medium_high: "#8A5600",
  moderate: "#F5A91D",
  low: "#1D9A57",
};

/* Category progress-bar fill per level. */
const BAR_FILL: Record<string, { color: string; opacity: number; width: string }> = {
  high: { color: "#D83A3A", opacity: 1, width: "100%" },
  medium_high: { color: "#F5A91D", opacity: 1, width: "75%" },
  moderate: { color: "#F5A91D", opacity: 0.6, width: "50%" },
  low: { color: "#1D9A57", opacity: 1, width: "25%" },
};

/* Category level badge palette. */
const BADGE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  high: { bg: "#FFE8E8", color: "#D83A3A", border: "#F5C0C0" },
  medium_high: { bg: "#FFF1C7", color: "#8A5600", border: "#E8C96A" },
  moderate: { bg: "#FFF4D6", color: "#8A5600", border: "#E8DFCF" },
  low: { bg: "#E6F7ED", color: "#1D9A57", border: "#A8DFC0" },
};

const labelMicro: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "#AAA398",
};

export default function RiskScoreCard({ risk }: Props) {
  const color = LEVEL_COLOR[risk.level] ?? "#D83A3A";

  const categories = Object.entries(risk.categories) as [
    string,
    { level: string; score: number; explanation: string }
  ][];

  return (
    <div
      style={{
        background: "#FFFDF8",
        border: "1px solid #E8DFCF",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 28px",
          borderBottom: "1px solid #E8DFCF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ ...labelMicro, margin: 0 }}>RISK SCORE</p>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#11100D",
              margin: "4px 0 0",
              lineHeight: 1.3,
            }}
          >
            {risk.main_label}
          </h2>
        </div>

        {/* Score circle */}
        <div
          style={{
            flexShrink: 0,
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            border: `3px solid ${color}`,
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "28px",
              fontWeight: 500,
              color,
              lineHeight: 1,
            }}
          >
            {risk.score}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 28px" }}>
        {/* Why this score */}
        <p style={{ ...labelMicro, margin: "0 0 16px" }}>WHY THIS SCORE</p>

        {risk.score_breakdown && risk.score_breakdown.length > 0 ? (
          <div>
            {risk.score_breakdown.map((item, i) => {
              const adds = item.points >= 0;
              const badge = adds
                ? { bg: "#FFE8E8", color: "#D83A3A", border: "#F5C0C0" }
                : { bg: "#E6F7ED", color: "#1D9A57", border: "#A8DFC0" };
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "10px 0",
                    borderBottom: "1px solid #F3EFE6",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      borderRadius: "4px",
                      padding: "2px 8px",
                      minWidth: "36px",
                      textAlign: "center",
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      height: "fit-content",
                    }}
                  >
                    {adds ? "+" : ""}
                    {item.points}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#11100D", margin: 0, lineHeight: 1.4 }}>
                      {item.label}
                    </p>
                    {item.evidence && (
                      <p
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "#AAA398",
                          margin: "2px 0 0",
                          lineHeight: 1.4,
                        }}
                      >
                        &ldquo;{item.evidence}&rdquo;
                        {item.confidence != null && (
                          <span> · {Math.round(item.confidence * 100)}% confidence</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {risk.reasons.map((reason, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "10px 0",
                  borderBottom: "1px solid #F3EFE6",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: color,
                    marginTop: "6px",
                  }}
                />
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#11100D", margin: 0, lineHeight: 1.4 }}>
                  {reason}
                </p>
              </div>
            ))}
          </div>
        )}

        <p
          style={{
            fontSize: "11px",
            color: "#AAA398",
            marginTop: "16px",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          Deterministic rules. The AI extracts evidence, the score itself is
          rule-based and clamped to 0-100.
        </p>

        {/* Category breakdown */}
        <p style={{ ...labelMicro, margin: "24px 0 16px" }}>CATEGORY BREAKDOWN</p>
        <div>
          {categories.map(([key, cat]) => {
            const fill = BAR_FILL[cat.level] ?? BAR_FILL.moderate;
            const badge = BADGE_STYLE[cat.level] ?? BADGE_STYLE.moderate;
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 0",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#11100D",
                    width: "140px",
                    flexShrink: 0,
                    textTransform: "capitalize",
                  }}
                >
                  {key.replace(/_/g, " ")}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "4px",
                    background: "#E8DFCF",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: fill.width,
                      height: "100%",
                      background: fill.color,
                      opacity: fill.opacity,
                      borderRadius: "2px",
                      transition: "width 0.7s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 600,
                    borderRadius: "4px",
                    padding: "2px 8px",
                    minWidth: "80px",
                    textAlign: "center",
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                    textTransform: "uppercase",
                  }}
                >
                  {cat.level.replace(/_/g, "-")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
