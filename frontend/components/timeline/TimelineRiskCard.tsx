"use client";

import type { VisaLensAnalysis } from "@/types/analysis";
import { riskColor, riskLabel } from "@/lib/utils";

type Props = {
  timeline: VisaLensAnalysis["timeline"];
  /** When provided together with onToggleStep, critical path steps become checkable. */
  checklistProgress?: boolean[];
  onToggleStep?: (index: number) => void;
};

export default function TimelineRiskCard({
  timeline,
  checklistProgress,
  onToggleStep,
}: Props) {
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

  // Distribute points evenly across the track by position so labels never
  // collide when several milestones fall on adjacent days.
  const pointPct = (i: number) =>
    segments.length > 1 ? (i / (segments.length - 1)) * 100 : 50;

  return (
    <div
      className="rounded-2xl border"
      style={{ background: "#FFFDF8", borderColor: "#E8DFCF" }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#E8DFCF" }}>
        <p
          className="text-[11px] uppercase tracking-widest mb-0.5"
          style={{ color: "#AAA398", fontFamily: "var(--font-mono)" }}
        >
          Timeline Risk
        </p>
        <h3 className="text-sm font-medium" style={{ color: "#11100D" }}>
          Deadline & Verification Simulator
        </h3>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3 divide-x"
        style={{ borderColor: "#E8DFCF" }}
      >
        {[
          {
            label: "Days until deadline",
            value: days !== null ? `${days}d` : "—",
            color: isTight ? "#ef4343" : "#11100D",
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
          <div key={label} className="px-4 py-4 border-b" style={{ borderColor: "#E8DFCF" }}>
            <p
              className="text-[10px] uppercase tracking-widest mb-1"
              style={{ color: "#AAA398", fontFamily: "var(--font-mono)" }}
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
            <p className="text-xs mt-0.5" style={{ color: "#6F6A60" }}>
              You may not receive responses in time. Ask the organizer today.
            </p>
          </div>
        </div>
      )}

      {/* Timeline bar */}
      <div className="px-6 pt-5 pb-2" style={{ overflow: "visible" }}>
        <div
          className="relative h-8 flex items-center"
          style={{ overflow: "visible" }}
        >
          {/* Track */}
          <div
            className="absolute inset-x-0 h-px"
            style={{ background: "#E8DFCF" }}
          />
          {/* Segment markers */}
          {segments.map((seg, i) => {
            const pct = pointPct(i);
            return (
              <div
                key={seg.label}
                className="absolute flex flex-col items-center"
                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full border-2 z-10"
                  style={{
                    background: seg.active ? seg.color : "#FBF8F1",
                    borderColor: seg.color,
                    boxShadow: seg.active ? `0 0 6px ${seg.color}70` : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* Labels below: each stacked under its dot, centered, wrapping */}
        <div
          className="relative mt-2"
          style={{ minHeight: "64px", overflow: "visible" }}
        >
          {segments.map((seg, i) => {
            const pct = pointPct(i);
            return (
              <div
                key={seg.label}
                className="absolute"
                style={{
                  left: `${pct}%`,
                  transform: "translateX(-50%)",
                  width: "80px",
                  maxWidth: "80px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: seg.active ? seg.color : "#AAA398",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    lineHeight: 1.3,
                  }}
                >
                  {seg.label}
                </p>
                <p
                  style={{
                    color: "#AAA398",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    lineHeight: 1.3,
                  }}
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
          style={{ background: "#FBF8F1", border: "1px solid #E8DFCF" }}
        >
          <p
            className="text-[11px] uppercase tracking-widest mb-1.5"
            style={{ color: "#AAA398", fontFamily: "var(--font-mono)" }}
          >
            Recommendation
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#11100D" }}>
            {timeline.recommendation}
          </p>
        </div>
      </div>

      {/* Critical path */}
      {timeline.critical_path.length > 0 && (
        <div
          className="px-6 pb-6 border-t pt-4"
          style={{ borderColor: "#E8DFCF" }}
        >
          <p
            className="text-[11px] uppercase tracking-widest mb-3"
            style={{ color: "#AAA398", fontFamily: "var(--font-mono)" }}
          >
            Critical Path
          </p>
          <ol className="space-y-2">
            {timeline.critical_path.map((step, i) => {
              if (!checklistProgress || !onToggleStep) {
                return (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "#6F6A60" }}>
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-medium"
                      style={{ background: "#FBF8F1", color: "#6F6A60" }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                );
              }
              const done = checklistProgress[i] === true;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => onToggleStep(i)}
                    className="flex items-start gap-3 text-sm w-full text-left cursor-pointer"
                    style={{
                      color: done ? "#AAA398" : "#6F6A60",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                    }}
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center"
                      style={{
                        width: "16px",
                        height: "16px",
                        marginTop: "2px",
                        borderRadius: "4px",
                        border: `1px solid ${done ? "#f5a623" : "#E8DFCF"}`,
                        background: done ? "#f5a623" : "transparent",
                      }}
                    >
                      {done && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path
                            d="M2 5 L4.2 7.2 L8 3"
                            stroke="#ffffff"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      style={{ textDecoration: done ? "line-through" : "none" }}
                    >
                      {step}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
