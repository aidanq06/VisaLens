"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { RiskLevel, VisaLensAnalysis } from "@/types/analysis";
import { getUser, getUserScans, saveProfile, type SavedScan } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import ProfileMenu from "@/components/ui/ProfileMenu";

/* ── Risk + opportunity-type presentation ──────────────────────── */

const RISK_BADGE: Record<
  RiskLevel,
  { label: string; bg: string; color: string; border: string }
> = {
  high: { label: "HIGH RISK", bg: "#FFE8E8", color: "#D83A3A", border: "#F5C0C0" },
  medium_high: {
    label: "MEDIUM RISK",
    bg: "#FFF1C7",
    color: "#8A5600",
    border: "#E8C96A",
  },
  moderate: { label: "MODERATE", bg: "#FFF4D6", color: "#8A5600", border: "#E8DFCF" },
  low: { label: "LOW RISK", bg: "#E6F7ED", color: "#1D9A57", border: "#A8DFC0" },
};

const TYPE_PILL: Record<string, { bg: string; color: string; border: string }> = {
  internship: { bg: "#FFF1C7", color: "#8A5600", border: "#E8C96A" },
  fellowship: { bg: "#EEF4FF", color: "#2563EB", border: "#BFDBFE" },
  research: { bg: "#E6F7ED", color: "#1D9A57", border: "#A8DFC0" },
  hackathon: { bg: "#F3EFE6", color: "#6F6A60", border: "#E8DFCF" },
  other: { bg: "#F3EFE6", color: "#6F6A60", border: "#E8DFCF" },
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

/* ── Pure helpers (logic preserved from prior version) ─────────── */

function greetingPrefix(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Fall back to a friendly name from the email local part: take the segment
 *  before the first dot or @, then capitalize it. */
function nameFromEmail(email?: string | null): string {
  const local = (email?.split("@")[0] ?? "").split(".")[0] ?? "";
  if (!local) return "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

/* ── Presentational sub-components ─────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="db-section-title">
      <span className="db-section-dash" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel | null }) {
  if (!level) return null;
  const c = RISK_BADGE[level];
  return (
    <span
      className="db-risk-badge"
      style={{ background: c.bg, color: c.color, borderColor: c.border }}
    >
      {c.label}
    </span>
  );
}

function ScanCard({ scan }: { scan: SavedScan }) {
  const level = riskLevelOf(scan);
  const { done, total } = checklistOf(scan);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const typeKey = scan.opportunity_type?.toLowerCase() ?? "other";
  const pill = TYPE_PILL[typeKey] ?? TYPE_PILL.other;

  return (
    <Link href={`/results?scan=${scan.id}`} className="db-scan-card">
      <div className="db-scan-top">
        <div className="db-scan-left">
          <span
            className="db-type-pill"
            style={{ background: pill.bg, color: pill.color, borderColor: pill.border }}
          >
            {typeKey}
          </span>
          <div className="db-scan-meta">
            <span className="db-scan-title">
              {scan.title || "Untitled opportunity"}
            </span>
            <span className="db-scan-date">{fmtDate(scan.created_at)}</span>
          </div>
        </div>
        <RiskBadge level={level} />
      </div>

      <div className="db-progress">
        <div className="db-progress-head">
          <span className="db-progress-label">VERIFICATION PROGRESS</span>
          <span className="db-progress-count">
            {done} of {total} steps completed
          </span>
        </div>
        <div className="db-progress-track">
          <div
            className="db-progress-fill"
            style={{
              width: `${pct}%`,
              background: done > 0 ? "#F5A91D" : "#E8DFCF",
            }}
          />
        </div>
      </div>
    </Link>
  );
}

/* ── Icons ─────────────────────────────────────────────────────── */

const RadarIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="3" fill="#11100D" stroke="none" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
  </svg>
);

const SearchIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="3" width="13" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <line x1="7" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
    <line x1="7" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const PersonIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M4 21v-1a8 8 0 0 1 16 0v1" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const CalendarIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/* ── Page ──────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");

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
        if (profile.first_name) setFirstName(profile.first_name);
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
    setProfileMessage(error ? "Could not save profile" : "Profile saved.");
    setTimeout(() => setProfileMessage(null), 3000);
  }

  function openProfile() {
    setProfileOpen(true);
    requestAnimationFrame(() => {
      document
        .getElementById("profile")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (loading || !user) {
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
        <p
          style={{
            fontSize: "13px",
            color: "#AAA398",
            fontFamily: "var(--font-mono)",
          }}
        >
          Loading your dashboard...
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

  const displayName = firstName.trim() || nameFromEmail(user.email);

  const VISA_SHORT: Record<string, string> = {
    "F-1": "F-1",
    "J-1": "J-1",
    international_other: "International",
    domestic: "Domestic",
    unsure: "Unsure",
  };
  const profilePreview = [VISA_SHORT[visaStatus] ?? visaStatus, schoolName.trim()]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="db-page"
      style={{
        backgroundImage: "radial-gradient(circle, #DDD5C4 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="db-nav">
        <Link href="/" className="db-brand">
          <span className="db-brand-icon" aria-hidden="true">
            ◈
          </span>
          <span className="db-brand-name">VISALENS</span>
        </Link>
        <span className="db-nav-center">DASHBOARD</span>
        <div className="db-nav-right">
          <Link href="/radar" className="db-nav-secondary">
            Find Internships
          </Link>
          <Link href="/scan" className="db-nav-primary">
            Analyze Opportunity
          </Link>
          <ProfileMenu />
        </div>
      </nav>

      <div className="db-container">
        {/* ── Section 1: Header ───────────────────────────────── */}
        <header className="db-header">
          <p className="db-eyebrow">ELIGIBILITY DASHBOARD</p>
          <h1 className="db-greeting">
            {greetingPrefix()}, {displayName}.
          </h1>
          <p className="db-subtitle">Here is your eligibility overview.</p>
        </header>

        {/* ── Section 2: Stats ────────────────────────────────── */}
        <section className="db-stats">
          <div className="db-stat-card">
            <p className="db-stat-label">OPPORTUNITIES ANALYZED</p>
            <p className="db-stat-value">{scans.length}</p>
            <p className="db-stat-sub">total scans saved</p>
          </div>
          <div
            className="db-stat-card"
            style={{ background: "#FFE8E8", borderColor: "#F5C0C0" }}
          >
            <p className="db-stat-label" style={{ color: "#D83A3A" }}>
              HIGH RISK
            </p>
            <p className="db-stat-value" style={{ color: "#D83A3A" }}>
              {highRiskCount}
            </p>
            <p className="db-stat-sub">opportunities flagged</p>
          </div>
          <div
            className="db-stat-card"
            style={{ background: "#FFF4D6", borderColor: "#E8C96A" }}
          >
            <p className="db-stat-label" style={{ color: "#8A5600" }}>
              UPCOMING DEADLINES
            </p>
            <p className="db-stat-value" style={{ color: "#8A5600" }}>
              {dueWithin14}
            </p>
            <p className="db-stat-sub">due within 14 days</p>
          </div>
        </section>

        {/* ── Section 3: Quick actions ────────────────────────── */}
        <section className="db-block">
          <SectionLabel>QUICK ACTIONS</SectionLabel>
          <div className="db-actions">
            <Link href="/radar" className="db-action-card">
              <span className="db-action-icon">{RadarIcon}</span>
              <p className="db-action-title">Radar</p>
              <p className="db-action-desc">
                Browse internships, fellowships, and research programs discovered
                by VisaLens.
              </p>
              <p className="db-action-cta">Open Radar →</p>
            </Link>

            <Link href="/scan" className="db-action-card">
              <span className="db-action-icon">{SearchIcon}</span>
              <p className="db-action-title">Manual Analysis</p>
              <p className="db-action-desc">
                Paste any opportunity description to get a full eligibility risk
                report.
              </p>
              <p className="db-action-cta">Analyze Now →</p>
            </Link>

            <button
              type="button"
              onClick={openProfile}
              className="db-action-card"
            >
              <span className="db-action-icon">{PersonIcon}</span>
              <p className="db-action-title">Your Profile</p>
              <p className="db-action-desc">
                Update your visa status, school, and level to personalize your
                risk scoring.
              </p>
              <p className="db-action-cta">Edit Profile →</p>
            </button>

            <Link href="/results" className="db-action-card">
              <span className="db-action-icon">{CalendarIcon}</span>
              <p className="db-action-title">Verification Timeline</p>
              <p className="db-action-desc">
                Track your step-by-step checklist progress on active
                applications.
              </p>
              <p className="db-action-cta">View Timeline →</p>
            </Link>
          </div>
        </section>

        {/* ── Section 4: Saved opportunities ──────────────────── */}
        <section className="db-block">
          <SectionLabel>YOUR OPPORTUNITIES</SectionLabel>
          {scans.length === 0 ? (
            <div className="db-empty">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E8C96A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: "20px" }}
              >
                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                <path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                <circle cx="11" cy="13" r="2.5" />
                <path d="M15 17l-2-2" />
              </svg>
              <h2 className="db-empty-title">No opportunities analyzed yet.</h2>
              <p className="db-empty-text">
                Start by analyzing your first opportunity or browse programs on
                Radar.
              </p>
              <div className="db-empty-actions">
                <Link href="/scan" className="db-btn-primary">
                  Analyze Opportunity
                </Link>
                <Link href="/radar" className="db-btn-secondary">
                  Open Radar
                </Link>
              </div>
            </div>
          ) : (
            <div className="db-scan-list">
              {scans.map((scan) => (
                <ScanCard key={scan.id} scan={scan} />
              ))}
            </div>
          )}
        </section>

        {/* ── Section 5: Upcoming deadlines ───────────────────── */}
        {dueWithin30.length > 0 && (
          <section className="db-block">
            <SectionLabel>UPCOMING DEADLINES</SectionLabel>
            <div className="db-deadlines">
              {dueWithin30.map(({ scan, days }) => {
                const urgent =
                  days < 7
                    ? { bg: "#FFE8E8", color: "#D83A3A", border: "#F5C0C0" }
                    : days <= 14
                    ? { bg: "#FFF1C7", color: "#8A5600", border: "#E8C96A" }
                    : { bg: "#F3EFE6", color: "#6F6A60", border: "#E8DFCF" };
                return (
                  <div key={scan.id} className="db-deadline-row">
                    <span className="db-deadline-title">
                      {scan.title || "Untitled opportunity"}
                    </span>
                    <div className="db-deadline-right">
                      <span
                        className="db-days-badge"
                        style={{
                          background: urgent.bg,
                          color: urgent.color,
                          borderColor: urgent.border,
                        }}
                      >
                        {days === 0 ? "Due today" : `${days} days left`}
                      </span>
                      <RiskBadge level={riskLevelOf(scan)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Section 6: Profile ──────────────────────────────── */}
        <section id="profile" className="db-profile-block">
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="db-profile-toggle"
          >
            <div className="db-section-title" style={{ marginBottom: 0 }}>
              <span className="db-section-dash" aria-hidden="true" />
              <span>YOUR PROFILE</span>
            </div>
            <div className="db-profile-toggle-right">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#AAA398"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
              {!profileOpen && profilePreview && (
                <span className="db-profile-preview">{profilePreview}</span>
              )}
            </div>
          </button>

          {profileOpen && (
            <div className="db-profile-card">
              <div className="db-profile-fields">
                <div className="db-profile-field">
                  <p className="db-field-label">VISA STATUS</p>
                  <div className="db-pill-group">
                    {VISA_OPTIONS.map((opt) => {
                      const active = opt.value === visaStatus;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setVisaStatus(opt.value)}
                          className={`db-pill${active ? " db-pill-active" : ""}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="db-profile-field">
                  <p className="db-field-label">SCHOOL LEVEL</p>
                  <div className="db-pill-group">
                    {LEVEL_OPTIONS.map((opt) => {
                      const active = opt.value === schoolLevel;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSchoolLevel(opt.value)}
                          className={`db-pill${active ? " db-pill-active" : ""}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="db-profile-field">
                  <p className="db-field-label">SCHOOL NAME</p>
                  <input
                    type="text"
                    placeholder="e.g. University of Washington"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="db-input"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="db-btn-primary db-save-btn"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
              {profileMessage && (
                <p
                  className="db-profile-message"
                  style={{
                    color:
                      profileMessage === "Profile saved." ? "#1D9A57" : "#D83A3A",
                  }}
                >
                  {profileMessage}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .db-page {
          position: relative;
          min-height: 100vh;
          padding-top: 56px;
          background-color: #fbf8f1;
          color: #11100d;
        }

        /* ── Nav ─────────────────────────────────────────────── */
        .db-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          height: 56px;
          padding: 0 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(251, 248, 241, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #d8c7a8;
        }
        .db-nav-right {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
        }
        .db-nav-secondary {
          display: inline-flex;
          align-items: center;
          padding: 8px 18px;
          background: transparent;
          color: #6f6a60;
          font-size: 13px;
          border: 1px solid #d8c7a8;
          border-radius: 8px;
          text-decoration: none;
          transition: border-color 0.15s ease;
        }
        .db-nav-secondary:hover {
          border-color: #aaa398;
        }
        .db-nav-primary {
          display: inline-flex;
          align-items: center;
          padding: 8px 18px;
          background: #f5a91d;
          color: #11100d;
          font-size: 13px;
          font-weight: 700;
          border: none;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.15s ease;
        }
        .db-nav-primary:hover {
          background: #d4890f;
        }
        .db-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .db-brand-icon {
          color: #f5a91d;
          font-size: 18px;
          line-height: 1;
        }
        .db-brand-name {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #11100d;
        }
        .db-nav-center {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #aaa398;
        }

        /* ── Container ───────────────────────────────────────── */
        .db-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 64px;
        }

        /* ── Header ──────────────────────────────────────────── */
        .db-header {
          margin-bottom: 56px;
        }
        .db-eyebrow {
          margin: 0 0 8px;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #aaa398;
        }
        .db-greeting {
          margin: 0;
          font-family: var(--font-serif);
          font-size: 48px;
          font-weight: 500;
          line-height: 1.05;
          color: #11100d;
        }
        .db-subtitle {
          margin: 8px 0 0;
          font-size: 15px;
          color: #6f6a60;
        }

        /* ── Buttons ─────────────────────────────────────────── */
        .db-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 24px;
          background: #f5a91d;
          color: #11100d;
          font-size: 14px;
          font-weight: 700;
          border: none;
          border-radius: 8px;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .db-btn-primary:hover {
          background: #d4890f;
        }
        .db-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .db-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 24px;
          background: transparent;
          color: #6f6a60;
          font-size: 14px;
          border: 1px solid #d8c7a8;
          border-radius: 8px;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }
        .db-btn-secondary:hover {
          border-color: #aaa398;
        }

        /* ── Stats ───────────────────────────────────────────── */
        .db-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 48px;
        }
        .db-stat-card {
          background: #fffdf8;
          border: 1px solid #e8dfcf;
          border-radius: 14px;
          padding: 24px 28px;
        }
        .db-stat-label {
          margin: 0;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #aaa398;
        }
        .db-stat-value {
          margin: 8px 0 0;
          font-family: var(--font-serif);
          font-size: 40px;
          font-weight: 500;
          line-height: 1;
          color: #11100d;
        }
        .db-stat-sub {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6f6a60;
        }

        /* ── Section blocks ──────────────────────────────────── */
        .db-block {
          border-top: 1px solid #e8dfcf;
          padding-top: 40px;
          margin-top: 8px;
          margin-bottom: 0;
        }
        .db-section-title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 20px;
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #aaa398;
        }
        .db-section-dash {
          width: 16px;
          height: 2px;
          background: #f5a91d;
          border-radius: 1px;
          flex-shrink: 0;
        }

        /* ── Quick actions ───────────────────────────────────── */
        .db-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .db-action-card {
          display: block;
          text-align: left;
          width: 100%;
          background: #fffdf8;
          border: 1px solid #e8dfcf;
          border-radius: 14px;
          padding: 28px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .db-action-card:hover {
          border-color: #d8c7a8;
          box-shadow: 0 4px 20px rgba(17, 16, 13, 0.06);
          transform: translateY(-1px);
        }
        .db-action-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #e8dfcf;
          background: #fbf8f1;
          color: #6f6a60;
        }
        .db-action-title {
          margin: 20px 0 0;
          font-family: var(--font-sans);
          font-size: 15px;
          font-weight: 600;
          color: #11100d;
        }
        .db-action-desc {
          margin: 6px 0 0;
          font-size: 13px;
          line-height: 1.55;
          color: #6f6a60;
        }
        .db-action-cta {
          margin: 20px 0 0;
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #aaa398;
        }

        /* ── Empty state ─────────────────────────────────────── */
        .db-empty {
          background: #fff4d6;
          border: 1px solid #e8c96a;
          border-radius: 14px;
          padding: 64px 40px;
          text-align: center;
        }
        .db-empty-title {
          margin: 0;
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 500;
          color: #8a5600;
        }
        .db-empty-text {
          margin: 8px auto 0;
          max-width: 360px;
          font-size: 14px;
          line-height: 1.6;
          color: #6f6a60;
        }
        .db-empty-actions {
          display: flex;
          flex-direction: row;
          gap: 12px;
          justify-content: center;
          margin-top: 28px;
        }

        /* ── Scan cards ──────────────────────────────────────── */
        .db-scan-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .db-scan-card {
          display: block;
          background: #fffdf8;
          border: 1px solid #e8dfcf;
          border-radius: 14px;
          padding: 24px;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .db-scan-card:hover {
          border-color: #d8c7a8;
          box-shadow: 0 4px 16px rgba(17, 16, 13, 0.04);
        }
        .db-scan-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .db-scan-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }
        .db-scan-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .db-scan-title {
          font-size: 15px;
          font-weight: 600;
          color: #11100d;
        }
        .db-scan-date {
          margin-top: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #aaa398;
        }

        /* ── Progress ────────────────────────────────────────── */
        .db-progress {
          margin-top: 16px;
        }
        .db-progress-head {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .db-progress-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #aaa398;
        }
        .db-progress-count {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #6f6a60;
        }
        .db-progress-track {
          height: 3px;
          background: #e8dfcf;
          border-radius: 2px;
          overflow: hidden;
        }
        .db-progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        /* ── Deadlines ───────────────────────────────────────── */
        .db-deadlines {
          display: flex;
          flex-direction: column;
        }
        .db-deadline-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #fffdf8;
          border: 1px solid #e8dfcf;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 8px;
        }
        .db-deadline-title {
          font-size: 14px;
          font-weight: 500;
          color: #11100d;
          min-width: 0;
        }
        .db-deadline-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .db-days-badge {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          border: 1px solid transparent;
          border-radius: 4px;
          padding: 3px 10px;
          white-space: nowrap;
        }

        /* ── Profile ─────────────────────────────────────────── */
        .db-profile-block {
          border-top: 1px solid #e8dfcf;
          padding-top: 40px;
          margin-top: 8px;
          margin-bottom: 64px;
        }
        .db-profile-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .db-profile-toggle-right {
          display: flex;
          flex-direction: row-reverse;
          align-items: center;
          gap: 12px;
        }
        .db-profile-preview {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #6f6a60;
        }
        .db-profile-card {
          margin-top: 16px;
          background: #fffdf8;
          border: 1px solid #e8dfcf;
          border-radius: 14px;
          padding: 32px;
        }
        .db-profile-fields {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          align-items: start;
        }
        .db-profile-field {
          display: flex;
          flex-direction: column;
        }
        .db-field-label {
          margin: 0 0 8px;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #aaa398;
        }
        .db-pill-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .db-pill {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-family: var(--font-sans);
          background: #fbf8f1;
          border: 1px solid #e8dfcf;
          color: #6f6a60;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }
        .db-pill:hover {
          border-color: #d8c7a8;
        }
        .db-pill-active {
          background: #f5a91d;
          border-color: #f5a91d;
          color: #11100d;
          font-weight: 600;
        }
        .db-save-btn {
          margin-top: 24px;
        }
        .db-profile-message {
          margin: 12px 0 0;
          font-size: 12px;
        }

        /* ── Risk + type badges ──────────────────────────────── */
        :global(.db-risk-badge) {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          border: 1px solid transparent;
          border-radius: 4px;
          padding: 4px 12px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        :global(.db-type-pill) {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          border: 1px solid transparent;
          border-radius: 4px;
          padding: 3px 10px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Responsive ──────────────────────────────────────── */
        @media (max-width: 768px) {
          .db-nav {
            padding: 0 24px;
          }
          .db-nav-center {
            display: none;
          }
          .db-nav-secondary {
            display: none;
          }
          .db-container {
            padding: 24px;
          }
          .db-header {
            margin-bottom: 40px;
          }
          .db-greeting {
            font-size: 36px;
          }
          .db-stats {
            grid-template-columns: 1fr;
          }
          .db-actions {
            grid-template-columns: 1fr;
          }
          .db-profile-fields {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <style jsx global>{`
        .db-input {
          width: 100%;
          background: #fbf8f1;
          border: 1px solid #e8dfcf;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #11100d;
          font-family: var(--font-sans);
          outline: none;
          transition: border-color 0.15s ease;
        }
        .db-input::placeholder {
          color: #aaa398;
        }
        .db-input:focus {
          border-color: #f5a91d;
          box-shadow: 0 0 0 3px rgba(245, 169, 29, 0.1);
        }
      `}</style>
    </div>
  );
}
