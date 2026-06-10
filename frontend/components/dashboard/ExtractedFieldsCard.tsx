"use client";

import { useState } from "react";
import type { VisaLensAnalysis } from "@/types/analysis";
import { confidenceLabel } from "@/lib/utils";

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

function EligibilityChip({ value }: { value: string }) {
  const map: Record<string, { color: string; label: string }> = {
    likely_eligible:   { color: "#2ecc71", label: "Likely Eligible" },
    likely_not_eligible: { color: "#ef4343", label: "Likely Not Eligible" },
    unclear:           { color: "#f5a623", label: "Unclear" },
    unknown:           { color: "#7a7f99", label: "Unknown" },
  };
  const { color, label } = map[value] ?? { color: "#7a7f99", label: value };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
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
      className="rounded-2xl border"
      style={{ background: "#0f1018", borderColor: "#252838" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "#1a1d2a" }}
      >
        <div>
          <p
            className="text-[11px] uppercase tracking-widest mb-0.5"
            style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
          >
            Extracted Fields
          </p>
          <h3 className="text-sm font-medium" style={{ color: "#e4e6f0" }}>
            Requirement Analysis
          </h3>
        </div>
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            color: showEvidence ? "#f5a623" : "#7a7f99",
            background: showEvidence ? "rgba(245,166,35,0.1)" : "#161823",
            border: `1px solid ${showEvidence ? "rgba(245,166,35,0.3)" : "#252838"}`,
            fontFamily: "var(--font-mono)",
          }}
        >
          {showEvidence ? "Hide" : "Show"} Evidence
        </button>
      </div>

      {/* Fields */}
      <div className="divide-y" style={{ borderColor: "#1a1d2a" }}>
        {fields.map(({ key, label, value }) => (
          <div key={key} className="px-6 py-3 flex items-start justify-between gap-4">
            <span
              className="text-xs flex-shrink-0 w-40"
              style={{ color: "#7a7f99", fontFamily: "var(--font-mono)" }}
            >
              {label}
            </span>
            <div className="text-right">
              {key === "international_eligibility" && value ? (
                <EligibilityChip value={value} />
              ) : value ? (
                <span
                  className="text-sm"
                  style={{ color: "#e4e6f0", fontFamily: "var(--font-mono)" }}
                >
                  {value}
                </span>
              ) : (
                <span
                  className="text-xs italic"
                  style={{ color: "#484d66" }}
                >
                  not detected
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ambiguous phrases */}
      {extracted.ambiguous_phrases.length > 0 && (
        <div className="px-6 py-4 border-t" style={{ borderColor: "#1a1d2a" }}>
          <p
            className="text-[11px] uppercase tracking-widest mb-3"
            style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
          >
            Ambiguous Phrases
          </p>
          <div className="flex flex-wrap gap-2">
            {extracted.ambiguous_phrases.map((phrase) => (
              <span
                key={phrase}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{
                  color: "#f5a623",
                  background: "rgba(245,166,35,0.08)",
                  border: "1px solid rgba(245,166,35,0.2)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                &ldquo;{phrase}&rdquo;
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Evidence panel */}
      {showEvidence && extracted.evidence.length > 0 && (
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: "#1a1d2a", background: "#080910" }}
        >
          <p
            className="text-[11px] uppercase tracking-widest mb-3"
            style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
          >
            Source Evidence
          </p>
          <div className="space-y-3">
            {extracted.evidence.map((ev, i) => (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{ background: "#0f1018", border: "1px solid #1e2130" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[10px] uppercase tracking-wide"
                    style={{ color: "#7a7f99", fontFamily: "var(--font-mono)" }}
                  >
                    {ev.field.replace(/_/g, " ")}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{
                      color:
                        ev.confidence >= 0.95
                          ? "#2ecc71"
                          : ev.confidence >= 0.8
                          ? "#f0c040"
                          : "#7a7f99",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {confidenceLabel(ev.confidence)} confidence ({Math.round(ev.confidence * 100)}%)
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#7a7f99" }}>
                  &ldquo;{ev.source_text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required materials */}
      {extracted.required_materials.length > 0 && (
        <div className="px-6 py-4 border-t" style={{ borderColor: "#1a1d2a" }}>
          <p
            className="text-[11px] uppercase tracking-widest mb-3"
            style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
          >
            Required Materials
          </p>
          <div className="flex flex-wrap gap-2">
            {extracted.required_materials.map((mat) => (
              <span
                key={mat}
                className="text-xs px-2.5 py-1 rounded-lg capitalize"
                style={{
                  color: "#7a7f99",
                  background: "#161823",
                  border: "1px solid #252838",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {mat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
