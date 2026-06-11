"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RiskLevel } from "@/types/analysis";
import RiskBadge from "@/components/ui/RiskBadge";
import { storeAnalysis } from "@/lib/api";
import {
  fetchActionQueue,
  fetchOpportunities,
  fetchOpportunityAnalysis,
  fetchSources,
  fetchStats,
  markStatus,
  triggerScan,
  type ActionItem,
  type ActionLabel,
  type ActionQueue,
  type RadarOpportunity,
  type RadarSource,
  type RadarStats,
  type RadarView,
} from "@/lib/radar";

type TabId = RadarView | "source_health" | "action_queue";

const TABS: { id: TabId; label: string }[] = [
  { id: "action_queue", label: "Action Queue" },
  { id: "apply_now", label: "Apply Now" },
  { id: "found_today", label: "Found Today" },
  { id: "source_of_truth", label: "Source-of-Truth Only" },
  { id: "source_health", label: "Source Health" },
];

const ACTION_META: Record<
  ActionLabel,
  { color: string; blurb: string }
> = {
  apply_now: {
    color: "#22c55e",
    blurb: "High fit, fresh, no major eligibility restriction detected.",
  },
  verify_first: {
    color: "#f5a623",
    blurb: "Worth pursuing, but clarify eligibility with the organizer before investing time.",
  },
  ask_advisor: {
    color: "#38bdf8",
    blurb: "Paid role or work-authorization language — bring these to your DSO/advisor.",
  },
  watch: {
    color: "#a78bfa",
    blurb: "Good fit but not urgent today — save and revisit.",
  },
  likely_blocked: {
    color: "#ef4343",
    blurb: "Explicit citizenship, residency, or funding restriction detected.",
  },
  low_priority: {
    color: "#7a7f99",
    blurb: "Low fit or stale — no action needed today.",
  },
};

const ACTION_ORDER: ActionLabel[] = [
  "apply_now",
  "verify_first",
  "ask_advisor",
  "watch",
  "likely_blocked",
  "low_priority",
];

const MONO = "var(--font-mono)";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const ts = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  const hours = (Date.now() - ts.getTime()) / 36e5;
  if (Number.isNaN(hours)) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function scoreColor(score: number): string {
  if (score >= 85) return "#ef4343";
  if (score >= 70) return "#f5a623";
  if (score >= 50) return "#fb923c";
  return "#7a7f99";
}

function healthColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f5a623";
  return "#ef4343";
}

function Chip({ children, color = "#7a7f99" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontSize: "10px",
        padding: "2px 8px",
        borderRadius: "999px",
        color,
        background: `${color}14`,
        border: `1px solid ${color}33`,
        fontFamily: MONO,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ActionRow({
  item,
  onReport,
  onApplied,
  reportLoading,
}: {
  item: ActionItem;
  onReport: (item: ActionItem) => void;
  onApplied: (item: ActionItem) => void;
  reportLoading: boolean;
}) {
  const meta = ACTION_META[item.action_label];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        background: "#0f1018",
        border: "1px solid #252838",
        borderLeft: `3px solid ${meta.color}`,
        borderRadius: "12px",
        padding: "14px 18px",
        flexWrap: "wrap",
      }}
    >
      {/* Action score */}
      <div style={{ width: "52px", textAlign: "center", paddingTop: "2px" }}>
        <p style={{ fontSize: "20px", fontWeight: 600, fontFamily: MONO, color: meta.color }}>
          {Math.round(item.action_score)}
        </p>
        <p style={{ fontSize: "9px", color: "#484d66", fontFamily: MONO }}>action</p>
      </div>

      {/* Role + reasons */}
      <div style={{ flex: "1 1 320px", minWidth: 0 }}>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "#e4e6f0", marginBottom: "4px" }}>
          {item.company_name} — {item.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", color: "#7a7f99", fontFamily: MONO }}>
            {item.location || "Location n/a"}
          </span>
          {item.season && <Chip color="#f5a623">{item.season}</Chip>}
          <Chip color={item.is_source_of_truth ? "#22c55e" : "#7a7f99"}>
            {item.source_type}
          </Chip>
          <span style={{ fontSize: "10px", color: "#484d66", fontFamily: MONO }}>
            fit {Math.round(item.fit_score)} · fresh {Math.round(item.freshness_score)}
          </span>
          {item.visa_risk_level && (
            <RiskBadge level={item.visa_risk_level as RiskLevel} size="sm" />
          )}
        </div>
        <p style={{ fontSize: "11px", color: "#7a7f99", lineHeight: 1.5 }}>
          {item.reasons.join(" · ")}
        </p>
        <p style={{ fontSize: "11px", color: meta.color, lineHeight: 1.5, marginTop: "2px" }}>
          → {item.next_steps[0]}
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "6px", paddingTop: "2px" }}>
        {item.has_analysis && (
          <button
            onClick={() => onReport(item)}
            disabled={reportLoading}
            style={{
              fontSize: "11px",
              padding: "6px 12px",
              borderRadius: "8px",
              color: "#f5a623",
              background: "rgba(245,166,35,0.08)",
              border: "1px solid rgba(245,166,35,0.25)",
              cursor: "pointer",
              fontFamily: MONO,
            }}
          >
            {reportLoading ? "Loading…" : "Eligibility report"}
          </button>
        )}
        <a
          href={item.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "11px",
            padding: "6px 12px",
            borderRadius: "8px",
            color: "#080910",
            background: "#f5a623",
            textDecoration: "none",
            fontWeight: 600,
            fontFamily: MONO,
          }}
        >
          Apply ↗
        </a>
        <button
          onClick={() => onApplied(item)}
          disabled={item.status === "applied"}
          style={{
            fontSize: "11px",
            padding: "6px 12px",
            borderRadius: "8px",
            color: item.status === "applied" ? "#22c55e" : "#7a7f99",
            background: "#161823",
            border: `1px solid ${item.status === "applied" ? "rgba(34,197,94,0.35)" : "#252838"}`,
            cursor: item.status === "applied" ? "default" : "pointer",
            fontFamily: MONO,
          }}
        >
          {item.status === "applied" ? "Applied ✓" : "Mark applied"}
        </button>
      </div>
    </div>
  );
}

export default function RadarPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("action_queue");
  const [opps, setOpps] = useState<RadarOpportunity[]>([]);
  const [sources, setSources] = useState<RadarSource[]>([]);
  const [queue, setQueue] = useState<ActionQueue | null>(null);
  const [stats, setStats] = useState<RadarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [reportLoading, setReportLoading] = useState<number | null>(null);
  const [showLowPriority, setShowLowPriority] = useState(false);

  const load = useCallback(async (activeTab: TabId) => {
    setLoading(true);
    setError(null);
    try {
      const [statsData] = await Promise.all([fetchStats()]);
      setStats(statsData);
      if (activeTab === "source_health") {
        setSources(await fetchSources());
      } else if (activeTab === "action_queue") {
        setQueue(await fetchActionQueue());
      } else {
        setOpps(await fetchOpportunities(activeTab));
      }
    } catch {
      setError(
        "Could not reach the radar service. Make sure the backend is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  async function handleScan() {
    setScanning(true);
    try {
      await triggerScan();
      await load(tab);
    } catch {
      setError("Scan failed — check the backend logs.");
    } finally {
      setScanning(false);
    }
  }

  async function openReport(opp: RadarOpportunity) {
    setReportLoading(opp.id);
    try {
      const analysis = await fetchOpportunityAnalysis(opp.id);
      storeAnalysis(analysis);
      router.push("/results");
    } catch {
      setError("No eligibility report stored for that role.");
      setReportLoading(null);
    }
  }

  async function markApplied(opp: RadarOpportunity) {
    try {
      await markStatus(opp.id, "applied");
      setOpps((prev) =>
        prev.map((o) => (o.id === opp.id ? { ...o, status: "applied" } : o))
      );
      setQueue((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((o) =>
                o.id === opp.id ? { ...o, status: "applied" } : o
              ),
            }
          : prev
      );
    } catch {
      setError("Could not update status.");
    }
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
          <span style={{ fontWeight: 500, fontSize: "14px", color: "#e4e6f0" }}>
            VisaLens
          </span>
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
            RADAR
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{
              fontSize: "12px",
              padding: "7px 14px",
              borderRadius: "8px",
              color: scanning ? "#484d66" : "#080910",
              background: scanning ? "#1e2130" : "#f5a623",
              border: "none",
              cursor: scanning ? "wait" : "pointer",
              fontWeight: 600,
            }}
          >
            {scanning ? "Scanning sources…" : "Scan now"}
          </button>
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
              fontFamily: MONO,
            }}
          >
            Manual analysis
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Header + stats */}
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#484d66",
              fontFamily: MONO,
              marginBottom: "6px",
            }}
          >
            Intern Radar
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "32px",
              marginBottom: "8px",
            }}
          >
            Early internship discovery
          </h1>
          <p style={{ fontSize: "13px", color: "#7a7f99", maxWidth: "640px" }}>
            Monitors company source-of-truth career feeds directly, scores every role
            for fit and urgency, and runs a VisaLens eligibility check on each one —
            before they spread to public job boards.
          </p>
        </div>

        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
              marginBottom: "24px",
            }}
          >
            {[
              ["Tracked roles", stats.opportunities],
              ["Found today", stats.found_today],
              ["Apply now", stats.apply_now],
              ["Source of truth", stats.source_of_truth],
              ["Active sources", stats.active_sources],
              ["Pending discoveries", stats.pending_discoveries],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: "#0f1018",
                  border: "1px solid #252838",
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <p style={{ fontSize: "22px", fontWeight: 600, fontFamily: MONO, color: "#e4e6f0" }}>
                  {value}
                </p>
                <p style={{ fontSize: "11px", color: "#7a7f99" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "16px",
            borderBottom: "1px solid #1a1d2a",
            paddingBottom: "0",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                fontSize: "12px",
                padding: "10px 16px",
                background: "transparent",
                color: tab === t.id ? "#f5a623" : "#7a7f99",
                border: "none",
                borderBottom: `2px solid ${tab === t.id ? "#f5a623" : "transparent"}`,
                cursor: "pointer",
                fontFamily: MONO,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "rgba(239,67,67,0.06)",
              border: "1px solid rgba(239,67,67,0.25)",
              marginBottom: "16px",
            }}
          >
            <p style={{ fontSize: "12px", color: "#ef9a9a" }}>{error}</p>
          </div>
        )}

        {loading ? (
          <p style={{ fontSize: "13px", color: "#7a7f99", fontFamily: MONO, padding: "40px 0", textAlign: "center" }}>
            Loading radar data…
          </p>
        ) : tab === "action_queue" && queue ? (
          /* ── Action Queue: what to do first today ── */
          <div>
            {/* Impact strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                background: "rgba(245,166,35,0.05)",
                border: "1px solid rgba(245,166,35,0.18)",
                borderRadius: "12px",
                padding: "12px 18px",
                marginBottom: "20px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#e4e6f0" }}>
                <strong style={{ color: "#f5a623", fontFamily: MONO }}>{queue.total}</strong>{" "}
                roles triaged automatically
              </p>
              <p style={{ fontSize: "12px", color: "#7a7f99" }}>
                Estimated manual review time saved:{" "}
                <strong style={{ color: "#e4e6f0", fontFamily: MONO }}>
                  ≈ {Math.round(queue.estimated_minutes_saved / 60)} hours
                </strong>{" "}
                ({queue.total} roles × 10 min)
              </p>
              <p style={{ fontSize: "11px", color: "#484d66", fontFamily: MONO }}>
                deterministic · every label has reasons
              </p>
            </div>

            {ACTION_ORDER.filter(
              (label) =>
                queue.counts[label] > 0 &&
                (label !== "low_priority" || showLowPriority)
            ).map((label) => {
              const meta = ACTION_META[label];
              const items = queue.items.filter((i) => i.action_label === label);
              return (
                <div key={label} style={{ marginBottom: "28px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                    <h2 style={{ fontSize: "15px", fontWeight: 600, color: meta.color }}>
                      {items[0].action_title}
                    </h2>
                    <span style={{ fontSize: "11px", color: "#484d66", fontFamily: MONO }}>
                      {items.length} role{items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#7a7f99", marginBottom: "10px" }}>
                    {meta.blurb}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {items.map((item) => (
                      <ActionRow
                        key={item.id}
                        item={item}
                        onReport={openReport}
                        onApplied={markApplied}
                        reportLoading={reportLoading === item.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {queue.counts.low_priority > 0 && (
              <button
                onClick={() => setShowLowPriority((v) => !v)}
                style={{
                  fontSize: "12px",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  color: "#7a7f99",
                  background: "#161823",
                  border: "1px solid #252838",
                  cursor: "pointer",
                  fontFamily: MONO,
                }}
              >
                {showLowPriority
                  ? "Hide low priority"
                  : `Show ${queue.counts.low_priority} low-priority roles`}
              </button>
            )}
          </div>
        ) : tab === "source_health" ? (
          /* ── Source health table ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sources.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  background: "#0f1018",
                  border: "1px solid #252838",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  opacity: s.active ? 1 : 0.45,
                }}
              >
                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#e4e6f0" }}>
                    {s.company_name || s.identifier}
                  </p>
                  <p style={{ fontSize: "11px", color: "#484d66", fontFamily: MONO }}>
                    {s.source_type}/{s.identifier} · tier {s.tier}
                    {!s.active && " · retired"}
                  </p>
                </div>
                {[
                  ["reliability", s.reliability_score],
                  ["freshness", s.freshness_score],
                  ["priority", s.priority_score],
                ].map(([label, score]) => (
                  <div key={label as string} style={{ width: "92px" }}>
                    <p style={{ fontSize: "10px", color: "#484d66", fontFamily: MONO, marginBottom: "3px" }}>
                      {label}
                    </p>
                    <div style={{ height: "4px", borderRadius: "2px", background: "#1a1d2a" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, Number(score))}%`,
                          borderRadius: "2px",
                          background: healthColor(Number(score)),
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div style={{ width: "110px", textAlign: "right" }}>
                  <p style={{ fontSize: "11px", color: "#7a7f99", fontFamily: MONO }}>
                    {s.opportunity_count} roles
                  </p>
                  <p style={{ fontSize: "10px", color: "#484d66", fontFamily: MONO }}>
                    checked {timeAgo(s.last_checked_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : opps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: "13px", color: "#7a7f99", marginBottom: "12px" }}>
              No roles in this view yet.
            </p>
            <button
              onClick={handleScan}
              style={{
                fontSize: "12px",
                padding: "9px 18px",
                borderRadius: "8px",
                background: "#f5a623",
                color: "#080910",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Run first scan
            </button>
          </div>
        ) : (
          /* ── Opportunity list ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {opps.map((opp) => (
              <div
                key={opp.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  background: "#0f1018",
                  border: "1px solid #252838",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  flexWrap: "wrap",
                }}
              >
                {/* Urgency */}
                <div style={{ width: "52px", textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: 600,
                      fontFamily: MONO,
                      color: scoreColor(opp.urgency_score),
                    }}
                  >
                    {Math.round(opp.urgency_score)}
                  </p>
                  <p style={{ fontSize: "9px", color: "#484d66", fontFamily: MONO }}>urgency</p>
                </div>

                {/* Role */}
                <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#e4e6f0", marginBottom: "4px" }}>
                    {opp.company_name} — {opp.title}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "#7a7f99", fontFamily: MONO }}>
                      {opp.location || "Location n/a"}
                    </span>
                    {opp.season && <Chip color="#f5a623">{opp.season}</Chip>}
                    <Chip color={opp.is_source_of_truth ? "#22c55e" : "#7a7f99"}>
                      {opp.source_type}
                    </Chip>
                    {opp.found_early === 1 && <Chip color="#a78bfa">found early</Chip>}
                    <span style={{ fontSize: "10px", color: "#484d66", fontFamily: MONO }}>
                      seen {timeAgo(opp.first_seen_at)}
                    </span>
                  </div>
                </div>

                {/* Fit */}
                <div style={{ width: "48px", textAlign: "center" }}>
                  <p style={{ fontSize: "15px", fontFamily: MONO, color: "#e4e6f0" }}>
                    {Math.round(opp.fit_score)}
                  </p>
                  <p style={{ fontSize: "9px", color: "#484d66", fontFamily: MONO }}>fit</p>
                </div>

                {/* Visa risk */}
                <div style={{ width: "100px", display: "flex", justifyContent: "center" }}>
                  {opp.visa_risk_level ? (
                    <RiskBadge level={opp.visa_risk_level as RiskLevel} size="sm" />
                  ) : (
                    <span style={{ fontSize: "11px", color: "#484d66" }}>—</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => openReport(opp)}
                    disabled={reportLoading === opp.id}
                    style={{
                      fontSize: "11px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      color: "#f5a623",
                      background: "rgba(245,166,35,0.08)",
                      border: "1px solid rgba(245,166,35,0.25)",
                      cursor: "pointer",
                      fontFamily: MONO,
                    }}
                  >
                    {reportLoading === opp.id ? "Loading…" : "Eligibility report"}
                  </button>
                  <a
                    href={opp.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "11px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      color: "#080910",
                      background: "#f5a623",
                      textDecoration: "none",
                      fontWeight: 600,
                      fontFamily: MONO,
                    }}
                  >
                    Apply ↗
                  </a>
                  <button
                    onClick={() => markApplied(opp)}
                    disabled={opp.status === "applied"}
                    style={{
                      fontSize: "11px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      color: opp.status === "applied" ? "#22c55e" : "#7a7f99",
                      background: "#161823",
                      border: `1px solid ${opp.status === "applied" ? "rgba(34,197,94,0.35)" : "#252838"}`,
                      cursor: opp.status === "applied" ? "default" : "pointer",
                      fontFamily: MONO,
                    }}
                  >
                    {opp.status === "applied" ? "Applied ✓" : "Mark applied"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
