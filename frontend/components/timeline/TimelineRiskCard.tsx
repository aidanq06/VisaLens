"use client";

import type { VisaLensAnalysis } from "@/types/analysis";
import { riskColor, riskLabel } from "@/lib/utils";

type Props = { timeline: VisaLensAnalysis["timeline"] };

export default function TimelineRiskCard({ timeline }: Props) {
  const color = riskColor(timeline.risk_level);
  const days = timeline.days_until_deadline;
  const verifyDays = timeline.estimated_verification_days;
  const isTight = days !== null && days <= verifyDays;

  const segments = [
    {
      label: "Today",
      day: 0,
      color: "#2ecc71",
      active: true,
    },
    {
      label: "Ask organizer",
      day: 1,
      color: "#f0c040",
      active: true,
    },
    {
      label: "Organizer responds",
      day: 3,
      color: "#f5a623",
      active: !isTight,
    },
    {
      label: "Advisor check",
      day: 4,
      color: "#f5a623",
      active: !isTight,
    },
    {
      label: "Decision",
      day: verifyDays,
      color: color,
      active: true,
    },
    {
      label: "Deadline",
      day: days ?? verifyDays + 2,
      color: isTight ? "#ef4343" : "#2ecc71",
      active: true,
    },
  ];

  const maxDay = Math.max(...segments.map((s) => s.day)) + 1;

  return (
    <div
      className="rounded-2xl border"
      style={{ background: "#0f1018", borderColor: "#252838" }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#1a1d2a" }}>
        <p
          className="text-[11px] uppercase tracking-widest mb-0.5"
          style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
        >
          Timeline Risk
        </p>
        <h3 className="text-sm font-medium" style={{ color: "#e4e6f0" }}>
          Deadline & Verification Simulator
        </h3>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3 divide-x"
        style={{ borderColor: "#1a1d2a" }}
      >
        {[
          {
            label: "Days until deadline",
            value: days !== null ? `${days}d` : "—",
            color: isTight ? "#ef4343" : "#e4e6f0",
          },
          {
            label: "Verification needed",
            value: `~${verifyDays}d`,
            color: "#f5a623",
          },
          {
            label: "Timeline risk",
            value: riskLabel(timeline.risk_level),
            color,
          },
        ].map(({ label, value, color: c }) => (
          <div key={label} className="px-4 py-4 border-b" style={{ borderColor: "#1a1d2a" }}>
            <p
              className="text-[10px] uppercase tracking-widest mb-1"
              style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
            >
              {label}
            </p>
            <p
              className="text-xl font-semibold"
              style={{ color: c, fontFamily: "var(--font-mono)" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Urgency banner */}
      {isTight && (
        <div
          className="mx-6 mt-5 rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ background: "rgba(239,67,67,0.08)", border: "1px solid rgba(239,67,67,0.2)" }}
        >
          <span className="text-base leading-none mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-medium" style={{ color: "#ef4343" }}>
              Verification window is tighter than the deadline
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#7a7f99" }}>
              You may not receive responses in time. Ask the organizer today.
            </p>
          </div>
        </div>
      )}

      {/* Timeline bar */}
      <div className="px-6 pt-5 pb-2">
        <div className="relative h-8 flex items-center">
          {/* Track */}
          <div
            className="absolute inset-x-0 h-px"
            style={{ background: "#252838" }}
          />
          {/* Segment markers */}
          {segments.map((seg) => {
            const pct = (seg.day / maxDay) * 100;
            return (
              <div
                key={seg.label}
                className="absolute flex flex-col items-center"
                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full border-2 z-10"
                  style={{
                    background: seg.active ? seg.color : "#1e2130",
                    borderColor: seg.color,
                    boxShadow: seg.active ? `0 0 6px ${seg.color}70` : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* Labels below */}
        <div className="relative h-12 mt-1">
          {segments.map((seg) => {
            const pct = (seg.day / maxDay) * 100;
            return (
              <div
                key={seg.label}
                className="absolute text-center"
                style={{
                  left: `${pct}%`,
                  transform: "translateX(-50%)",
                  width: "80px",
                }}
              >
                <p
                  className="text-[9px] leading-tight"
                  style={{
                    color: seg.active ? seg.color : "#484d66",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {seg.label}
                </p>
                <p
                  className="text-[9px]"
                  style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
                >
                  Day {seg.day}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation */}
      <div className="px-6 pb-5">
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: "#161823", border: "1px solid #252838" }}
        >
          <p
            className="text-[11px] uppercase tracking-widest mb-1.5"
            style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
          >
            Recommendation
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#e4e6f0" }}>
            {timeline.recommendation}
          </p>
        </div>
      </div>

      {/* Critical path */}
      {timeline.critical_path.length > 0 && (
        <div
          className="px-6 pb-6 border-t pt-4"
          style={{ borderColor: "#1a1d2a" }}
        >
          <p
            className="text-[11px] uppercase tracking-widest mb-3"
            style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
          >
            Critical Path
          </p>
          <ol className="space-y-2">
            {timeline.critical_path.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "#7a7f99" }}>
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-medium"
                  style={{ background: "#1e2130", color: "#7a7f99" }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
