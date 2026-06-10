"use client";

import { useMemo } from "react";
import { Route, AlertTriangle } from "lucide-react";

import type { PartialVisaLensAnalysis } from "@/types/analysis";
import {
  DEFAULT_TIMELINE_INPUTS,
  findBottleneck,
  simulateTimeline,
} from "@/lib/timelineSimulator";
import { OWNER_BADGE, OWNER_LABEL } from "@/lib/riskColors";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/**
 * Shows the ordered verification steps (the critical path), highlights
 * the bottleneck step, and says what to do first.
 */
export default function CriticalPathCard({
  analysis,
}: {
  analysis: PartialVisaLensAnalysis;
}) {
  const deadline =
    analysis.timeline?.deadline_or_start_date ??
    analysis.extracted?.deadline_or_start_date ??
    null;

  const result = useMemo(
    () => simulateTimeline(deadline, DEFAULT_TIMELINE_INPUTS),
    [deadline]
  );
  const bottleneck = findBottleneck(result);

  return (
    <Card>
      <CardHeader
        icon={<Route size={16} />}
        title="Critical path"
        subtitle="The verification chain, in order — each step waits on the one before it"
      />
      <CardBody>
        <ol className="space-y-0">
          {result.steps.map((step, i) => {
            const isBottleneck = step.label === bottleneck.label;
            const isLast = i === result.steps.length - 1;
            return (
              <li key={step.label} className="relative flex gap-3.5 pb-5 last:pb-0">
                {/* Connector line */}
                {!isLast && (
                  <span className="absolute left-[13px] top-7 h-full w-0.5 bg-slate-200" />
                )}
                {/* Step number */}
                <span
                  className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isBottleneck
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {step.label}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        OWNER_BADGE[step.owner] ?? OWNER_BADGE.system
                      }`}
                    >
                      {OWNER_LABEL[step.owner] ?? step.owner}
                    </span>
                    {isBottleneck && (
                      <span className="flex items-center gap-1 rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                        <AlertTriangle size={10} /> Bottleneck
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    ~{step.days} {step.days === 1 ? "day" : "days"}
                    {isBottleneck &&
                      " — longest step in the chain; everything after it waits"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 rounded-lg bg-slate-50 px-3.5 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Do this first: </span>
          Email the organizer today — their response gates the rest of the
          chain. While you wait, book time with your advisor/DSO so step 2
          starts the moment step 1 finishes.
        </div>
      </CardBody>
    </Card>
  );
}
