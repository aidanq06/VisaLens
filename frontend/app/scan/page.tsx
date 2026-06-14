"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StudentContext } from "@/types/analysis";
import { sampleOpportunities } from "@/data/mockAnalysis";
import { analyzeOpportunity, storeAnalysis } from "@/lib/api";
import { getUser, saveScan } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import ProfileMenu from "@/components/ui/ProfileMenu";

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
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#AAA398",
          marginBottom: "10px",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={active ? undefined : "scan-pill"}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "var(--font-sans)",
                border: "1px solid",
                background: active ? "#F5A91D" : "#FBF8F1",
                color: active ? "#11100D" : "#6F6A60",
                borderColor: active ? "#F5A91D" : "#E8DFCF",
                fontWeight: active ? 600 : 400,
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

const cardStyle: React.CSSProperties = {
  background: "#FFFDF8",
  border: "1px solid #E8DFCF",
  borderRadius: "14px",
  padding: "28px",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#11100D",
};

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
  const [error, setError] = useState<string | null>(null);

  const canSubmit = text.trim().length > 30;

  // Pre-fill visa status and school level from the saved profile, silently.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (!data || cancelled) return;
        if (STATUS_OPTIONS.some((o) => o.value === data.visa_status)) {
          setStatus(data.visa_status);
        }
        if (LEVEL_OPTIONS.some((o) => o.value === data.school_level)) {
          setSchoolLevel(data.school_level);
        }
      } catch {
        // Not logged in or no profile — keep defaults.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    setError(null);
    try {
      const analysis = await analyzeOpportunity({
        title,
        text,
        context: {
          status,
          school_level: schoolLevel,
          opportunity_type: oppType,
        },
        deadlineOverride: deadline || undefined,
      });
      storeAnalysis(analysis);

      // Auto-save to Supabase for logged-in users; never block the redirect.
      let scanId: string | null = null;
      try {
        const user = await getUser();
        // Only save when we have an authenticated user id. An anonymous
        // visitor has no row to own the scan and would trip the RLS policy.
        if (user?.id) {
          const { id, error: saveError } = await saveScan(
            user.id,
            title.trim() || "Untitled Opportunity",
            oppType,
            analysis
          );
          if (saveError) {
            // Log and continue: a failed save must never block the user.
            console.error("Failed to save scan:", saveError.message ?? saveError);
          } else {
            scanId = id;
          }
        }
      } catch (saveError) {
        // Network or unexpected error while saving; proceed to results anyway.
        console.error("Failed to save scan:", saveError);
      }

      // Always redirect, with the saved scan when available, otherwise local.
      router.push(scanId ? `/results?scan=${scanId}` : "/results");
    } catch {
      setLoading(false);
      setError(
        "Could not reach the analysis service. Make sure the backend is running, or view a demo report instead."
      );
    }
  }

  const overMin = text.length > 30;

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
        className="scan-nav"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
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
          style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
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
        <span
          className="scan-nav-center"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#AAA398",
          }}
        >
          ANALYZE OPPORTUNITY
        </span>
        <ProfileMenu />
      </nav>

      {/* ── Main ──────────────────────────────────────────────── */}
      <div style={{ paddingTop: "56px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>
          {/* Page header */}
          <div style={{ marginBottom: "40px" }}>
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
              ELIGIBILITY ANALYSIS
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
              Analyze your opportunity.
            </h1>
            <p style={{ fontSize: "14px", color: "#6F6A60", marginTop: "8px", lineHeight: 1.55 }}>
              Paste any opportunity description to get a full eligibility risk report.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Section 1 — student context */}
            <div style={{ ...cardStyle, marginBottom: "16px" }}>
              <p style={{ ...cardTitleStyle, marginBottom: "20px" }}>Your student context</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <SelectGroup
                  label="Visa / Status"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={setStatus}
                />
                <SelectGroup
                  label="School Level"
                  options={LEVEL_OPTIONS}
                  value={schoolLevel}
                  onChange={setSchoolLevel}
                />
                <SelectGroup
                  label="Opportunity Type"
                  options={TYPE_OPTIONS}
                  value={oppType}
                  onChange={setOppType}
                />
              </div>
            </div>

            {/* Section 2 — opportunity description */}
            <div style={{ ...cardStyle, marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <p style={cardTitleStyle}>Opportunity description</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {sampleOpportunities.map((opp) => (
                    <button
                      key={opp.id}
                      type="button"
                      onClick={() => loadSample(opp.id)}
                      className="scan-chip"
                      style={{
                        fontSize: "11px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: "#FBF8F1",
                        border: "1px solid #E8DFCF",
                        color: "#6F6A60",
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
              <input
                type="text"
                placeholder="Opportunity title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="scan-input"
                style={{
                  width: "100%",
                  background: "#FBF8F1",
                  border: "1px solid #E8DFCF",
                  borderRadius: "8px",
                  padding: "11px 14px",
                  fontSize: "13px",
                  color: "#11100D",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                  marginBottom: "12px",
                  transition: "border-color 0.15s ease",
                }}
              />

              {/* Text area */}
              <textarea
                placeholder="Paste the full opportunity description here...&#10;&#10;Example: &quot;Paid summer AI internship for undergraduate students enrolled at U.S. universities. Applicants must be eligible to work in the United States...&quot;"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                className="scan-textarea"
                style={{
                  width: "100%",
                  background: "#FBF8F1",
                  border: `1px solid ${overMin ? "#F5A91D" : "#E8DFCF"}`,
                  borderRadius: "8px",
                  padding: "12px 14px",
                  fontSize: "13px",
                  color: "#11100D",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "200px",
                  lineHeight: 1.6,
                  fontFamily: "var(--font-mono)",
                  transition: "border-color 0.15s ease",
                }}
              />
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: overMin ? "#1D9A57" : "#AAA398",
                  marginTop: "6px",
                }}
              >
                {text.length} chars · minimum 30
              </p>
            </div>

            {/* Section 3 — deadline */}
            <div style={{ ...cardStyle, marginBottom: "24px" }}>
              <p style={cardTitleStyle}>
                Deadline or start date
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "#AAA398",
                    marginLeft: "8px",
                  }}
                >
                  optional
                </span>
              </p>
              <p style={{ fontSize: "12px", color: "#6F6A60", marginTop: "4px", marginBottom: "16px" }}>
                Used to simulate verification timeline urgency.
              </p>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="scan-date"
                style={{
                  background: "#FBF8F1",
                  border: "1px solid #E8DFCF",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#11100D",
                  outline: "none",
                  fontFamily: "var(--font-mono)",
                  colorScheme: "light",
                  transition: "border-color 0.15s ease",
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "#FFE8E8",
                  border: "1px solid #F5C0C0",
                }}
              >
                <p style={{ fontSize: "13px", color: "#D83A3A", margin: 0 }}>{error}</p>
                <Link
                  href="/results?demo=true"
                  style={{
                    display: "inline-block",
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "#8A5600",
                    fontFamily: "var(--font-mono)",
                    textDecoration: "underline",
                  }}
                >
                  View demo results →
                </Link>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="scan-submit"
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: 700,
                border: "none",
                transition: "all 0.2s ease",
                background: canSubmit && !loading ? "#F5A91D" : "#E8DFCF",
                color: canSubmit && !loading ? "#11100D" : "#AAA398",
                cursor: canSubmit && !loading ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Analyzing..." : "Analyze Eligibility Risk →"}
            </button>

            {loading && (
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "#6F6A60", fontFamily: "var(--font-mono)" }}>
                  Extracting requirements · Scoring risk · Building blocker graph...
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      <style jsx>{`
        .scan-pill:hover {
          border-color: #d8c7a8 !important;
          color: #11100d !important;
        }
        .scan-chip:hover {
          border-color: #d8c7a8 !important;
        }
        .scan-submit:not(:disabled):hover {
          background: #d4890f !important;
        }
        @media (max-width: 600px) {
          .scan-nav {
            padding: 0 24px !important;
          }
          .scan-nav-center {
            display: none;
          }
        }
      `}</style>

      <style jsx global>{`
        .scan-input::placeholder,
        .scan-textarea::placeholder {
          color: #aaa398;
        }
        .scan-input:focus,
        .scan-date:focus {
          border-color: #f5a91d;
          box-shadow: 0 0 0 3px rgba(245, 169, 29, 0.1);
        }
      `}</style>
    </div>
  );
}
