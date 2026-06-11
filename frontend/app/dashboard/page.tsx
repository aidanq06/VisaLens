"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { RiskLevel, VisaLensAnalysis } from "@/types/analysis";
import { getUser, getUserScans, saveProfile, type SavedScan } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import ProfileMenu from "@/components/ui/ProfileMenu";

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string }> = {
  high: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  medium_high: { bg: "rgba(245,166,35,0.15)", text: "#f5a623" },
  moderate: { bg: "rgba(234,179,8,0.15)", text: "#eab308" },
  low: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
};

const RISK_LABELS: Record<RiskLevel, string> = {
  high: "High Risk",
  medium_high: "Elevated Risk",
  moderate: "Moderate Risk",
  low: "Low Risk",
};

const VISA_OPTIONS = [
  { value: "F-1", label: "F-1 Student Visa" },
  { value: "J-1", label: "J-1 Exchange Visitor" },
  { value: "international_other", label: "Other International" },
  { value: "domestic", label: "Domestic Student" },
  { value: "unsure", label: "Not Sure" },
];

const LEVEL_OPTIONS = [
  { value: "high_school", label: "High School" },
  { value: "college", label: "College / Undergraduate" },
  { value: "graduate", label: "Graduate" },
];

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#484d66",
  fontFamily: "var(--font-mono)",
  marginBottom: "16px",
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function analysisOf(scan: SavedScan): VisaLensAnalysis | null {
  return (scan.analysis_json as unknown as VisaLensAnalysis) ?? null;
}

function riskLevelOf(scan: SavedScan): RiskLevel | null {
  return analysisOf(scan)?.risk?.level ?? null;
}

/** Days from today until the scan's deadline, or null if it has none. */
function daysUntilDeadline(scan: SavedScan): number | null {
  const timeline = analysisOf(scan)?.timeline;
  if (!timeline) return null;
  if (timeline.deadline_or_start_date) {
    const deadline = new Date(timeline.deadline_or_start_date);
    if (!Number.isNaN(deadline.getTime())) {
      return Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
    }
  }
  return timeline.days_until_deadline;
}

function checklistOf(scan: SavedScan): { done: number; total: number } {
  const total = analysisOf(scan)?.timeline?.critical_path?.length ?? 0;
  const done = Object.values(scan.checklist_progress ?? {}).filter(
    Boolean
  ).length;
  return { done: Math.min(done, total), total };
}

function RiskBadgePill({ level }: { level: RiskLevel | null }) {
  if (!level) return null;
  const c = RISK_COLORS[level];
  return (
    <span
      style={{
        fontSize: "11px",
        padding: "3px 10px",
        borderRadius: "999px",
        color: c.text,
        background: c.bg,
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
      }}
    >
      {RISK_LABELS[level]}
    </span>
  );
}

function ScanCard({ scan }: { scan: SavedScan }) {
  const [hovered, setHovered] = useState(false);
  const level = riskLevelOf(scan);
  const { done, total } = checklistOf(scan);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#0f1018",
        border: `1px solid ${hovered ? "rgba(245,166,35,0.3)" : "#252838"}`,
        borderRadius: "12px",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: "24px",
        transition: "border-color 0.2s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#ffffff",
            }}
          >
            {scan.title || "Untitled opportunity"}
          </span>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "999px",
              color: "#7a7f99",
              background: "#161823",
              border: "1px solid #252838",
              fontFamily: "var(--font-mono)",
              textTransform: "capitalize",
            }}
          >
            {scan.opportunity_type}
          </span>
          <RiskBadgePill level={level} />
        </div>

        {total > 0 && (
          <div style={{ marginBottom: "10px", maxWidth: "320px" }}>
            <p
              style={{
                fontSize: "11px",
                color: "#7a7f99",
                marginBottom: "6px",
              }}
            >
              {done} of {total} steps completed
            </p>
            <div
              style={{
                height: "4px",
                borderRadius: "999px",
                background: "#252838",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${total ? (done / total) * 100 : 0}%`,
                  borderRadius: "999px",
                  background: "#f5a623",
                }}
              />
            </div>
          </div>
        )}

        <p
          style={{
            fontSize: "11px",
            color: "#484d66",
            fontFamily: "var(--font-mono)",
          }}
        >
          Scanned{" "}
          {new Date(scan.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <Link
        href={`/results?scan=${scan.id}`}
        style={{
          fontSize: "12px",
          color: "#f5a623",
          textDecoration: "none",
          fontFamily: "var(--font-mono)",
          whiteSpace: "nowrap",
        }}
      >
        View Results →
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [loading, setLoading] = useState(true);

  const [profileOpen, setProfileOpen] = useState(false);
  const [visaStatus, setVisaStatus] = useState("F-1");
  const [schoolLevel, setSchoolLevel] = useState("college");
  const [schoolName, setSchoolName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getUser();
      if (cancelled) return;
      if (!u) {
        router.replace("/");
        return;
      }
      setUser(u);
      const [{ data }, { data: profile }] = await Promise.all([
        getUserScans(u.id),
        supabase.from("profiles").select("*").eq("id", u.id).single(),
      ]);
      if (cancelled) return;
      setScans(data ?? []);
      if (profile) {
        if (profile.visa_status) setVisaStatus(profile.visa_status);
        if (profile.school_level) setSchoolLevel(profile.school_level);
        if (profile.school_name) setSchoolName(profile.school_name);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSaveProfile() {
    if (!user?.email) return;
    setSavingProfile(true);
    setProfileMessage(null);
    const { error } = await saveProfile(user.id, {
      visa_status: visaStatus,
      school_level: schoolLevel,
      school_name: schoolName.trim() || undefined,
      email: user.email,
    });
    setSavingProfile(false);
    setProfileMessage(error ? "Could not save profile" : "Profile saved");
    setTimeout(() => setProfileMessage(null), 3000);
  }

  if (loading || !user) {
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
        <p
          style={{
            fontSize: "12px",
            color: "#7a7f99",
            fontFamily: "var(--font-mono)",
          }}
        >
          Loading your dashboard…
        </p>
      </div>
    );
  }

  const highRiskCount = scans.filter((s) => {
    const level = riskLevelOf(s);
    return level === "high" || level === "medium_high";
  }).length;

  const upcoming = scans
    .map((s) => ({ scan: s, days: daysUntilDeadline(s) }))
    .filter(
      (d): d is { scan: SavedScan; days: number } =>
        d.days !== null && d.days >= 0
    )
    .sort((a, b) => a.days - b.days);

  const dueWithin14 = upcoming.filter((d) => d.days <= 14).length;
  const dueWithin30 = upcoming.filter((d) => d.days <= 30);

  const emailName = user.email?.split("@")[0] ?? "there";

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
          <span style={{ fontWeight: "500", fontSize: "14px", color: "#e4e6f0" }}>
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
          Dashboard
        </span>
        <ProfileMenu />
      </nav>

      <div
        style={{ maxWidth: "900px", margin: "0 auto", padding: "56px 24px 96px" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "24px",
            flexWrap: "wrap",
            marginBottom: "48px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "32px",
                lineHeight: "1.15",
                color: "#e4e6f0",
                marginBottom: "8px",
              }}
            >
              {greeting()}, {emailName}
            </h1>
            <p style={{ fontSize: "14px", color: "#7a7f99" }}>
              Here&apos;s your eligibility overview
            </p>
          </div>
          <Link
            href="/scan"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              background: "#f5a623",
              color: "#080910",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Analyze New Opportunity →
          </Link>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "56px",
          }}
        >
          {[
            { value: scans.length, label: "Total scans saved" },
            { value: highRiskCount, label: "High risk opportunities" },
            { value: dueWithin14, label: "Deadlines within 14 days" },
          ].map(({ value, label }) => (
            <div
              key={label}
              style={{
                background: "#0f1018",
                border: "1px solid #252838",
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "600",
                  color: "#e4e6f0",
                  marginBottom: "4px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {value}
              </p>
              <p style={{ fontSize: "12px", color: "#7a7f99" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Profile settings */}
        <section style={{ marginBottom: "56px" }}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            style={{
              ...sectionTitleStyle,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span style={{ fontSize: "9px" }}>{profileOpen ? "▼" : "▶"}</span>
            Your Profile
          </button>
          {profileOpen && (
            <div
              style={{
                background: "#0f1018",
                border: "1px solid #252838",
                borderRadius: "12px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {[
                {
                  label: "Visa / status",
                  options: VISA_OPTIONS,
                  value: visaStatus,
                  onChange: setVisaStatus,
                },
                {
                  label: "School level",
                  options: LEVEL_OPTIONS,
                  value: schoolLevel,
                  onChange: setSchoolLevel,
                },
              ].map(({ label, options, value, onChange }) => (
                <div key={label}>
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
                    {label}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {options.map((opt) => {
                      const active = opt.value === value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => onChange(opt.value)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: active ? "#f5a623" : "#7a7f99",
                            background: active
                              ? "rgba(245,166,35,0.1)"
                              : "#161823",
                            border: `1px solid ${
                              active ? "rgba(245,166,35,0.35)" : "#252838"
                            }`,
                            fontFamily: "var(--font-mono)",
                            cursor: "pointer",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
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
                  School name{" "}
                  <span style={{ textTransform: "none", letterSpacing: 0 }}>
                    (optional)
                  </span>
                </p>
                <input
                  type="text"
                  placeholder="e.g. University of Washington"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
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

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    background: savingProfile ? "#1e2130" : "#f5a623",
                    color: savingProfile ? "#484d66" : "#080910",
                    border: "none",
                    cursor: savingProfile ? "wait" : "pointer",
                  }}
                >
                  {savingProfile ? "Saving…" : "Save Profile"}
                </button>
                {profileMessage && (
                  <span
                    style={{
                      fontSize: "12px",
                      color:
                        profileMessage === "Profile saved"
                          ? "#22c55e"
                          : "#ef9a9a",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {profileMessage}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Saved scans */}
        <section style={{ marginBottom: "56px" }}>
          <p style={sectionTitleStyle}>Your Opportunities</p>
          {scans.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 24px",
                background: "#0f1018",
                border: "1px solid #252838",
                borderRadius: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "#7a7f99",
                  marginBottom: "16px",
                }}
              >
                No opportunities analyzed yet. Start by analyzing your first
                opportunity.
              </p>
              <Link
                href="/scan"
                style={{
                  fontSize: "13px",
                  color: "#f5a623",
                  fontFamily: "var(--font-mono)",
                  textDecoration: "none",
                }}
              >
                Analyze an opportunity →
              </Link>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {scans.map((scan) => (
                <ScanCard key={scan.id} scan={scan} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming deadlines */}
        {dueWithin30.length > 0 && (
          <section>
            <p style={sectionTitleStyle}>Upcoming Deadlines</p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {dueWithin30.map(({ scan, days }) => {
                const urgencyColor =
                  days < 7 ? "#ef4444" : days < 14 ? "#f5a623" : "#7a7f99";
                return (
                  <div
                    key={scan.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      padding: "16px 24px",
                      background: "#0f1018",
                      border: "1px solid #252838",
                      borderRadius: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#e4e6f0",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {scan.title || "Untitled opportunity"}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: urgencyColor,
                        fontFamily: "var(--font-mono)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {days === 0 ? "Due today" : `${days} days left`}
                    </span>
                    <RiskBadgePill level={riskLevelOf(scan)} />
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
