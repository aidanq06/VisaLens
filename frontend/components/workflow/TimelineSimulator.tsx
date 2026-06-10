"use client";

import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";

import type { PartialVisaLensAnalysis } from "@/types/analysis";
import {
  DEFAULT_TIMELINE_INPUTS,
  simulateTimeline,
  type TimelineInputs,
} from "@/lib/timelineSimulator";
import {
  RISK_LEVEL_ACCENT,
  RISK_LEVEL_BADGE,
  RISK_LEVEL_LABEL,
} from "@/lib/riskColors";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/** One adjustable input row with a slider + live value. */
function InputSlider({
  label,
  value,
  onChange,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-semibold text-slate-900">
          {value} {value === 1 ? "day" : "days"}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
    </label>
  );
}

/** Compare "days available" vs "days needed" as two bars. */
function ComparisonBars({
  daysAvailable,
  daysNeeded,
  accent,
}: {
  daysAvailable: number | null;
  daysNeeded: number;
  accent: string;
}) {
  const maxDays = Math.max(daysAvailable ?? 0, daysNeeded, 1);
  const rows = [
    {
      label: "Days until deadline",
      value: daysAvailable,
      color: "bg-slate-400",
    },
    { label: "Days verification needs", value: daysNeeded, color: accent },
  ];
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-slate-600">{row.label}</span>
            <span className="font-semibold text-slate-900">
              {row.value === null ? "—" : `${row.value} days`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-300 ${row.color}`}
              style={{
                width: `${Math.min(100, Math.max(2, ((row.value ?? 0) / maxDays) * 100))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TimelineSimulator({
  analysis,
}: {
  analysis: PartialVisaLensAnalysis;
}) {
  const deadline =
    analysis.timeline?.deadline_or_start_date ??
    analysis.extracted?.deadline_or_start_date ??
    null;

  const [inputs, setInputs] = useState<TimelineInputs>(DEFAULT_TIMELINE_INPUTS);

  // Re-simulate live whenever a slider moves.
  const result = useMemo(
    () => simulateTimeline(deadline, inputs),
    [deadline, inputs]
  );

  const badge = RISK_LEVEL_BADGE[result.riskLevel];
  const accent = RISK_LEVEL_ACCENT[result.riskLevel];

  return (
    <Card>
      <CardHeader
        icon={<CalendarClock size={16} />}
        title="Timeline risk simulator"
        subtitle={
          deadline
            ? `Deadline / start date: ${deadline}`
            : "No deadline detected in this opportunity"
        }
        right={
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badge}`}
          >
            {RISK_LEVEL_LABEL[result.riskLevel]}
          </span>
        }
      />
      <CardBody className="space-y-5">
        <ComparisonBars
          daysAvailable={result.daysUntilDeadline}
          daysNeeded={result.daysNeeded}
          accent={accent}
        />

        {/* Recommendation */}
        <div className={`rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${badge}`}>
          {result.recommendation}
        </div>

        {/* Key dates */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Verification done by
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">
              {result.verificationReadyDate}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Latest safe day to ask
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">
              {result.latestAskDate ?? "—"}
            </div>
          </div>
        </div>

        {/* Adjustable assumptions */}
        <div>
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Adjust assumptions
          </div>
          <div className="space-y-3.5">
            <InputSlider
              label="Organizer response time"
              value={inputs.organizerResponseDays}
              onChange={(v) => setInputs({ ...inputs, organizerResponseDays: v })}
            />
            <InputSlider
              label="Advisor/DSO response time"
              value={inputs.advisorResponseDays}
              onChange={(v) => setInputs({ ...inputs, advisorResponseDays: v })}
            />
            <InputSlider
              label="Your decision time"
              value={inputs.studentDecisionDays}
              onChange={(v) => setInputs({ ...inputs, studentDecisionDays: v })}
              max={5}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
