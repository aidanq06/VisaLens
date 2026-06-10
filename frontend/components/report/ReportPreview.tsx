"use client";

import { useMemo } from "react";
import { Download, FileText } from "lucide-react";

import type { PartialVisaLensAnalysis } from "@/types/analysis";
import { generateMarkdownReport } from "@/lib/report/generateMarkdownReport";
import { generateVerificationKit } from "@/lib/verification/generateVerificationKit";
import { RISK_LEVEL_LABEL } from "@/lib/riskColors";
import CopyButton from "@/components/ui/CopyButton";
import SectionCard from "@/components/ui/SectionCard";
import StatusBadge from "@/components/ui/StatusBadge";

/**
 * Structured report preview with copy-as-Markdown and .md download
 * (Blob + anchor — zero dependencies).
 */
export default function ReportPreview({
  analysis,
}: {
  analysis: PartialVisaLensAnalysis;
}) {
  const markdown = useMemo(() => generateMarkdownReport(analysis), [analysis]);
  const kit = useMemo(() => generateVerificationKit(analysis), [analysis]);

  function downloadReport() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visalens-report.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const e = analysis.extracted;
  const risk = analysis.risk;

  return (
    <SectionCard
      icon={<FileText size={16} />}
      title="Readiness report"
      subtitle="Shareable summary of this analysis"
      right={
        <div className="flex items-center gap-2">
          <CopyButton text={markdown} label="Copy Markdown" />
          <button
            type="button"
            onClick={downloadReport}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Download size={13} />
            Download .md
          </button>
        </div>
      }
    >
      {/* Report summary header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            VisaLens AI — Opportunity Readiness Report
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {e?.opportunity_type ?? "Opportunity"}
            {e?.location_requirement ? ` · ${e.location_requirement}` : ""}
            {e?.deadline_or_start_date ? ` · due ${e.deadline_or_start_date}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {risk?.score !== undefined && risk?.score !== null && (
            <span className="text-2xl font-bold text-slate-900">
              {risk.score}
              <span className="text-sm font-medium text-slate-400"> /100</span>
            </span>
          )}
          {risk?.level && <StatusBadge level={risk.level} />}
        </div>
      </div>

      {/* Main concerns */}
      {risk?.reasons && risk.reasons.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Main concerns
          </h4>
          <ul className="space-y-1">
            {risk.reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeline note */}
      {analysis.timeline?.recommendation && (
        <div className="mb-4">
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Timeline
            {analysis.timeline.risk_level &&
              ` — ${RISK_LEVEL_LABEL[analysis.timeline.risk_level]}`}
          </h4>
          <p className="rounded-lg border-l-4 border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm leading-relaxed text-slate-600">
            {analysis.timeline.recommendation}
          </p>
        </div>
      )}

      {/* What to verify */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Verify with the organizer
          </h4>
          <ul className="space-y-1">
            {kit.organizerQuestions.slice(0, 4).map((q) => (
              <li key={q} className="text-sm leading-relaxed text-slate-700">
                • {q}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Verify with your advisor/DSO
          </h4>
          <ul className="space-y-1">
            {kit.advisorQuestions.slice(0, 4).map((q) => (
              <li key={q} className="text-sm leading-relaxed text-slate-700">
                • {q}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Next steps */}
      <div className="mb-4">
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Next steps
        </h4>
        <ol className="list-decimal space-y-1 pl-5">
          {kit.nextSteps.map((s) => (
            <li key={s} className="text-sm leading-relaxed text-slate-700">
              {s}
            </li>
          ))}
        </ol>
      </div>

      <p className="border-t border-slate-100 pt-3 text-xs italic leading-relaxed text-slate-400">
        {kit.disclaimer}
      </p>
    </SectionCard>
  );
}
