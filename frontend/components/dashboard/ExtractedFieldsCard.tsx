"use client";

import { useState } from "react";
import type { VisaLensAnalysis } from "@/types/analysis";

type Props = { extracted: VisaLensAnalysis["extracted"] };

const FIELD_LABELS: Record<string, string> = {
  opportunity_type: "Opportunity Type",
  paid_status: "Paid Status",
  work_authorization_language: "Work Auth Language",
  citizenship_requirement: "Citizenship Requirement",
  international_eligibility: "Intl. Eligibility",
  location_requirement: "Location",
  deadline_or_start_date: "Deadline / Start Date",
  funding_restriction: "Funding Restriction",
  student_level_requirement: "Student Level",
};

const labelMicro: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#AAA398",
};

const ELIGIBILITY: Record<string, { bg: string; color: string; border: string; label: string }> = {
  likely_eligible: { bg: "#E6F7ED", color: "#1D9A57", border: "#A8DFC0", label: "Likely Eligible" },
  likely_not_eligible: { bg: "#FFE8E8", color: "#D83A3A", border: "#F5C0C0", label: "Likely Not Eligible" },
  unclear: { bg: "#FFF1C7", color: "#8A5600", border: "#E8C96A", label: "Unclear" },
  unknown: { bg: "#F3EFE6", color: "#AAA398", border: "#E8DFCF", label: "Unknown" },
};

function EligibilityChip({ value }: { value: string }) {
  const s = ELIGIBILITY[value] ?? ELIGIBILITY.unknown;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        fontWeight: 600,
        borderRadius: "4px",
        padding: "3px 10px",
      }}
    >
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "warm" | "neutral" }) {
  const style =
    tone === "warm"
      ? { bg: "#FFF4D6", color: "#8A5600", border: "#E8C96A" }
      : { bg: "#FBF8F1", color: "#6F6A60", border: "#E8DFCF" };
  return (
    <span
      style={{
        display: "inline-block",
        margin: "4px",
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: "12px",
        borderRadius: "6px",
        padding: "5px 12px",
      }}
    >
      {children}
    </span>
  );
}

export default function ExtractedFieldsCard({ extracted }: Props) {
  const [showEvidence, setShowEvidence] = useState(false);

  const fields = Object.entries(FIELD_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      value: extracted[key as keyof typeof extracted] as string | null,
    }))
    .filter(({ key }) => key !== "required_materials" && key !== "ambiguous_phrases");

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
        <div>
          <p style={{ ...labelMicro, margin: 0 }}>EXTRACTED FIELDS</p>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#11100D", margin: "4px 0 0" }}>
            Requirement Analysis
          </h3>
        </div>
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className={showEvidence ? undefined : "ef-toggle"}
          style={{
            fontSize: "12px",
            padding: "6px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            color: showEvidence ? "#FFFDF8" : "#6F6A60",
            background: showEvidence ? "#11100D" : "#FBF8F1",
            border: `1px solid ${showEvidence ? "#11100D" : "#E8DFCF"}`,
          }}
        >
          {showEvidence ? "Hide Evidence" : "Show Evidence"}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 28px" }}>
        {/* Field rows */}
        <div>
          {fields.map(({ key, label, value }) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                padding: "12px 0",
                borderBottom: "1px solid #F3EFE6",
              }}
            >
              <span style={{ fontSize: "12px", color: "#6F6A60", flexShrink: 0 }}>{label}</span>
              <div style={{ textAlign: "right", maxWidth: "60%" }}>
                {key === "international_eligibility" && value ? (
                  <EligibilityChip value={value} />
                ) : value ? (
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#11100D" }}>{value}</span>
                ) : (
                  <span style={{ fontSize: "13px", fontWeight: 400, color: "#AAA398", fontStyle: "italic" }}>
                    not detected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Ambiguous phrases */}
        {extracted.ambiguous_phrases.length > 0 && (
          <div>
            <p style={{ ...labelMicro, margin: "20px 0 10px" }}>AMBIGUOUS PHRASES</p>
            <div style={{ margin: "-4px" }}>
              {extracted.ambiguous_phrases.map((phrase) => (
                <Pill key={phrase} tone="warm">
                  &ldquo;{phrase}&rdquo;
                </Pill>
              ))}
            </div>
          </div>
        )}

        {/* Required materials */}
        {extracted.required_materials.length > 0 && (
          <div>
            <p style={{ ...labelMicro, margin: "20px 0 10px" }}>REQUIRED MATERIALS</p>
            <div style={{ margin: "-4px" }}>
              {extracted.required_materials.map((mat) => (
                <Pill key={mat} tone="neutral">
                  {mat}
                </Pill>
              ))}
            </div>
          </div>
        )}

        {/* Evidence */}
        {showEvidence && extracted.evidence.length > 0 && (
          <div>
            <p style={{ ...labelMicro, margin: "20px 0 10px" }}>SOURCE EVIDENCE</p>
            {extracted.evidence.map((ev, i) => {
              const pct = Math.round(ev.confidence * 100);
              return (
                <div
                  key={i}
                  style={{
                    background: "#FBF8F1",
                    border: "1px solid #E8DFCF",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <span style={{ ...labelMicro }}>{ev.field.replace(/_/g, " ")}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6F6A60" }}>
                        {pct}%
                      </span>
                      <div
                        style={{
                          width: "40px",
                          height: "3px",
                          background: "#E8DFCF",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ width: `${pct}%`, height: "100%", background: "#F5A91D", borderRadius: "2px" }} />
                      </div>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#11100D",
                      marginTop: "8px",
                      lineHeight: 1.5,
                      fontStyle: "italic",
                      background: "#FFFDF8",
                      borderLeft: "2px solid #F5A91D",
                      paddingLeft: "10px",
                    }}
                  >
                    &ldquo;{ev.source_text}&rdquo;
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .ef-toggle:hover {
          border-color: #d8c7a8 !important;
        }
      `}</style>
    </div>
  );
}
