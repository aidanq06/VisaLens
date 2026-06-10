"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StudentContext } from "@/types/analysis";
import { sampleOpportunities } from "@/data/mockAnalysis";

const STATUS_OPTIONS: { value: StudentContext["status"]; label: string }[] = [
  { value: "F-1", label: "F-1 Student Visa" },
  { value: "J-1", label: "J-1 Exchange Visitor" },
  { value: "international_other", label: "Other International" },
  { value: "domestic", label: "Domestic Student" },
  { value: "unsure", label: "Not Sure" },
];

const LEVEL_OPTIONS: { value: StudentContext["school_level"]; label: string }[] = [
  { value: "high_school", label: "High School" },
  { value: "college", label: "College / Undergraduate" },
  { value: "graduate", label: "Graduate" },
];

const TYPE_OPTIONS: { value: StudentContext["opportunity_type"]; label: string }[] = [
  { value: "internship", label: "Internship" },
  { value: "research", label: "Research" },
  { value: "scholarship", label: "Scholarship" },
  { value: "hackathon", label: "Hackathon" },
  { value: "fellowship", label: "Fellowship" },
  { value: "other", label: "Other" },
];

function SelectGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p
        className="text-xs mb-2 uppercase tracking-widest"
        style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="px-3 py-2 rounded-lg text-xs transition-all"
              style={{
                color: active ? "#f5a623" : "#7a7f99",
                background: active ? "rgba(245,166,35,0.1)" : "#161823",
                border: `1px solid ${active ? "rgba(245,166,35,0.35)" : "#252838"}`,
                fontFamily: "var(--font-mono)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ScanPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StudentContext["status"]>("F-1");
  const [schoolLevel, setSchoolLevel] =
    useState<StudentContext["school_level"]>("college");
  const [oppType, setOppType] =
    useState<StudentContext["opportunity_type"]>("internship");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = text.trim().length > 30;

  function loadSample(id: string) {
    const opp = sampleOpportunities.find((s) => s.id === id);
    if (!opp) return;
    setTitle(opp.title);
    setText(opp.text);
    setOppType(opp.category as StudentContext["opportunity_type"]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    router.push("/results?demo=true");
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
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
        >
          <span style={{ color: "#f5a623", fontSize: "16px" }}>◈</span>
          <span
            style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#e4e6f0",
            }}
          >
            VisaLens
          </span>
        </Link>
        <span
          style={{
            fontSize: "12px",
            color: "#484d66",
            fontFamily: "var(--font-mono)",
          }}
        >
          Analyze Opportunity
        </span>
      </nav>

      <div
        style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}
      >
        {/* Heading */}
        <div style={{ marginBottom: "40px" }}>
          <p
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#484d66",
              fontFamily: "var(--font-mono)",
              marginBottom: "8px",
            }}
          >
            Step 1 of 1
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "36px",
              lineHeight: "1.1",
              color: "#e4e6f0",
              marginBottom: "8px",
            }}
          >
            Analyze your opportunity
          </h1>
          <p style={{ fontSize: "14px", color: "#7a7f99" }}>
            Paste any opportunity description to get a full eligibility risk report.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Student context */}
          <div
            style={{
              background: "#0f1018",
              border: "1px solid #252838",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "#e4e6f0",
                marginBottom: "20px",
              }}
            >
              Your student context
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <SelectGroup
                label="Visa / status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={setStatus}
              />
              <SelectGroup
                label="School level"
                options={LEVEL_OPTIONS}
                value={schoolLevel}
                onChange={setSchoolLevel}
              />
              <SelectGroup
                label="Opportunity type"
                options={TYPE_OPTIONS}
                value={oppType}
                onChange={setOppType}
              />
            </div>
          </div>

          {/* Opportunity input */}
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
                marginBottom: "20px",
              }}
            >
              <p
                style={{ fontSize: "13px", fontWeight: "500", color: "#e4e6f0" }}
              >
                Opportunity description
              </p>
              {/* Quick load samples */}
              <div style={{ display: "flex", gap: "6px" }}>
                {sampleOpportunities.map((opp) => (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => loadSample(opp.id)}
                    style={{
                      fontSize: "10px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      color: "#7a7f99",
                      background: "#161823",
                      border: "1px solid #252838",
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                    }}
                  >
                    {opp.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="Opportunity title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  background: "#080910",
                  border: "1px solid #252838",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#e4e6f0",
                  outline: "none",
                }}
              />
            </div>

            {/* Text area */}
            <textarea
              placeholder="Paste the full opportunity description here...&#10;&#10;Example: &quot;Paid summer AI internship for undergraduate students enrolled at U.S. universities. Applicants must be eligible to work in the United States...&quot;"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              style={{
                width: "100%",
                background: "#080910",
                border: `1px solid ${text.length > 30 ? "rgba(245,166,35,0.3)" : "#252838"}`,
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "13px",
                color: "#e4e6f0",
                outline: "none",
                resize: "vertical",
                lineHeight: "1.6",
                fontFamily: "var(--font-mono)",
              }}
            />
            <p
              style={{
                fontSize: "11px",
                color: "#484d66",
                marginTop: "6px",
                fontFamily: "var(--font-mono)",
              }}
            >
              {text.length} chars — minimum 30
            </p>
          </div>

          {/* Timeline (optional) */}
          <div
            style={{
              background: "#0f1018",
              border: "1px solid #252838",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "#e4e6f0",
                marginBottom: "4px",
              }}
            >
              Deadline or start date
              <span
                style={{
                  fontSize: "11px",
                  color: "#484d66",
                  marginLeft: "8px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                optional
              </span>
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#7a7f99",
                marginBottom: "14px",
              }}
            >
              Used to simulate verification timeline urgency.
            </p>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={{
                background: "#080910",
                border: "1px solid #252838",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#e4e6f0",
                outline: "none",
                fontFamily: "var(--font-mono)",
                colorScheme: "dark",
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "600",
              background: canSubmit && !loading ? "#f5a623" : "#1e2130",
              color: canSubmit && !loading ? "#080910" : "#484d66",
              border: "none",
              cursor: canSubmit && !loading ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Analyzing…" : "Analyze Eligibility Risk →"}
          </button>

          {loading && (
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <p
                style={{
                  fontSize: "12px",
                  color: "#7a7f99",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Extracting requirements · Scoring risk · Building blocker graph…
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
