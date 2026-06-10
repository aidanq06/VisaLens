"use client";

import { Gauge, FileSearch, ClipboardCheck, ShieldAlert } from "lucide-react";

import type { PartialVisaLensAnalysis } from "@/types/analysis";
import BlockerGraph from "@/components/workflow/BlockerGraph";
import TimelineSimulator from "@/components/workflow/TimelineSimulator";
import CriticalPathCard from "@/components/workflow/CriticalPathCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  RISK_LEVEL_ACCENT,
  RISK_LEVEL_BADGE,
  RISK_LEVEL_LABEL,
  scoreToLevel,
} from "@/lib/riskColors";

/**
 * Dashboard shell. Owns layout only.
 *
 * TEAM INTEGRATION POINTS — replace the placeholder components below:
 *  - <RiskScorePlaceholder/>      -> Aidan's RiskScoreCard / RiskBreakdownTable
 *  - <ExtractedFieldsPlaceholder/> -> Pranav's ExtractedFieldsPanel
 *  - <VerificationPlaceholder/>   -> Rahul's VerificationKit
 * Each placeholder already reads from the shared schema, so swapping is
 * a one-line import change.
 */

// ---------------------------------------------------------------------------
// Placeholder: risk score (Aidan replaces with components/risk/RiskScoreCard)
// ---------------------------------------------------------------------------
function RiskScorePlaceholder({ analysis }: { analysis: PartialVisaLensAnalysis }) {
  const score = analysis.risk?.score ?? null;
  const level = analysis.risk?.level ?? (score !== null ? scoreToLevel(score) : null);
  const reasons = analysis.risk?.reasons ?? [];

  return (
    <Card>
      <CardHeader
        icon={<Gauge size={16} />}
        title="Eligibility risk score"
        right={
          level && (
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${RISK_LEVEL_BADGE[level]}`}>
              {RISK_LEVEL_LABEL[level]}
            </span>
          )
        }
      />
      <CardBody>
        {score === null ? (
          <p className="text-sm text-slate-500">Risk analysis pending…</p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight text-slate-900">{score}</span>
              <span className="pb-1.5 text-sm text-slate-500">/ 100</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${level ? RISK_LEVEL_ACCENT[level] : "bg-slate-400"}`}
                style={{ width: `${score}%` }}
              />
            </div>
            {reasons.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Placeholder: extracted fields (Pranav replaces with ExtractedFieldsPanel)
// ---------------------------------------------------------------------------
function ExtractedFieldsPlaceholder({ analysis }: { analysis: PartialVisaLensAnalysis }) {
  const e = analysis.extracted;
  const rows: [string, string | null | undefined][] = [
    ["Type", e?.opportunity_type],
    ["Paid status", e?.paid_status],
    ["Work authorization", e?.work_authorization_language],
    ["Citizenship requirement", e?.citizenship_requirement],
    ["International eligibility", e?.international_eligibility],
    ["Location", e?.location_requirement],
    ["Deadline / start", e?.deadline_or_start_date],
  ];

  return (
    <Card>
      <CardHeader
        icon={<FileSearch size={16} />}
        title="Extracted requirements"
        subtitle="What VisaLens found in the listing"
      />
      <CardBody>
        {!e ? (
          <p className="text-sm text-slate-500">Extraction pending…</p>
        ) : (
          <dl className="space-y-2.5">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </dt>
                <dd className="max-w-[60%] text-right text-sm font-medium text-slate-900">
                  {value ?? <span className="text-slate-400">not found</span>}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Placeholder: verification kit (Rahul replaces with VerificationKit)
// ---------------------------------------------------------------------------
function VerificationPlaceholder({ analysis }: { analysis: PartialVisaLensAnalysis }) {
  const v = analysis.verification;
  return (
    <Card>
      <CardHeader
        icon={<ClipboardCheck size={16} />}
        title="Verification kit"
        subtitle="Exactly what to ask before you apply"
      />
      <CardBody className="space-y-4">
        {!v ? (
          <p className="text-sm text-slate-500">Verification kit pending…</p>
        ) : (
          <>
            {v.organizer_questions && v.organizer_questions.length > 0 && (
              <div>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ask the organizer
                </h4>
                <ul className="space-y-1">
                  {v.organizer_questions.map((q) => (
                    <li key={q} className="text-sm text-slate-700">• {q}</li>
                  ))}
                </ul>
              </div>
            )}
            {v.email_draft && (
              <div>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email draft
                </h4>
                <p className="rounded-lg bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-700">
                  {v.email_draft}
                </p>
              </div>
            )}
            {v.next_steps && v.next_steps.length > 0 && (
              <div>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Next steps
                </h4>
                <ol className="list-decimal space-y-1 pl-5">
                  {v.next_steps.map((s) => (
                    <li key={s} className="text-sm text-slate-700">{s}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function ResultsDashboard({
  analysis,
}: {
  analysis: PartialVisaLensAnalysis;
}) {
  const disclaimer =
    analysis.verification?.disclaimer ??
    "VisaLens does not provide legal, immigration, financial, or official eligibility advice. Verify with official sources, advisors, or opportunity organizers.";

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      {/* Header */}
      <header className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Opportunity Readiness Case
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {analysis.extracted?.opportunity_type
            ? `Analysis of a ${analysis.extracted.opportunity_type}`
            : "Opportunity analysis"}
          {analysis.extracted?.location_requirement
            ? ` · ${analysis.extracted.location_requirement}`
            : ""}
        </p>
      </header>

      {/* Row 1: score + extracted fields */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RiskScorePlaceholder analysis={analysis} />
        <ExtractedFieldsPlaceholder analysis={analysis} />
      </div>

      {/* Row 2: blocker graph, full width — the demo centerpiece */}
      <BlockerGraph analysis={analysis} />

      {/* Row 3: timeline + critical path */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TimelineSimulator analysis={analysis} />
        <CriticalPathCard analysis={analysis} />
      </div>

      {/* Row 4: verification kit */}
      <VerificationPlaceholder analysis={analysis} />

      {/* Responsible-AI disclaimer */}
      <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-slate-400" />
        <p className="text-xs leading-relaxed text-slate-500">{disclaimer}</p>
      </div>
    </div>
  );
}
