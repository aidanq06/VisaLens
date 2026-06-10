"use client";

import { useMemo } from "react";
import { ScanSearch } from "lucide-react";

import type { EvidenceItem } from "@/types/analysis";
import SectionCard from "@/components/ui/SectionCard";

/**
 * Renders the original opportunity text with every evidence snippet
 * highlighted — the "X-ray view" of the listing. Hovering a highlight
 * shows which field it triggered and the confidence.
 */

type Segment = { text: string; evidence?: EvidenceItem };

const FIELD_LABEL: Record<string, string> = {
  paid_status: "Paid role",
  work_authorization_language: "Work authorization",
  citizenship_requirement: "Citizenship restriction",
  location_requirement: "Location requirement",
  remote_or_global_status: "Remote/global status",
  funding_restriction: "Funding restriction",
  deadline_or_start_date: "Deadline / start date",
};

/** Fields that signal risk get red/amber; informational ones get blue. */
function highlightClass(field: string): string {
  switch (field) {
    case "citizenship_requirement":
    case "funding_restriction":
      return "bg-red-100 text-red-900 border-b-2 border-red-400";
    case "work_authorization_language":
    case "paid_status":
      return "bg-amber-100 text-amber-900 border-b-2 border-amber-400";
    default:
      return "bg-blue-100 text-blue-900 border-b-2 border-blue-300";
  }
}

/** Split text into plain + highlighted segments (non-overlapping). */
function buildSegments(text: string, evidence: EvidenceItem[]): Segment[] {
  // Locate each evidence snippet in the text; keep non-overlapping matches.
  const matches: { start: number; end: number; evidence: EvidenceItem }[] = [];
  for (const ev of evidence) {
    const snippet = ev.source_text;
    if (!snippet) continue;
    const idx = text.indexOf(snippet);
    if (idx === -1) continue;
    matches.push({ start: idx, end: idx + snippet.length, evidence: ev });
  }
  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  const kept: typeof matches = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      kept.push(m);
      lastEnd = m.end;
    }
  }

  const segments: Segment[] = [];
  let cursor = 0;
  for (const m of kept) {
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start) });
    segments.push({ text: text.slice(m.start, m.end), evidence: m.evidence });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

export default function HighlightedListing({
  text,
  evidence,
}: {
  text: string;
  evidence: EvidenceItem[];
}) {
  const segments = useMemo(() => buildSegments(text, evidence), [text, evidence]);
  const detectedCount = segments.filter((s) => s.evidence).length;

  return (
    <SectionCard
      icon={<ScanSearch size={16} />}
      title="Listing X-ray"
      subtitle={
        detectedCount > 0
          ? `${detectedCount} signal${detectedCount === 1 ? "" : "s"} detected in the original text — hover to inspect`
          : "No risk signals detected in the original text"
      }
    >
      <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
        {segments.map((seg, i) =>
          seg.evidence ? (
            <span
              key={i}
              className={`group relative cursor-help rounded-sm px-0.5 ${highlightClass(seg.evidence.field)}`}
            >
              {seg.text}
              {/* Tooltip */}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max max-w-[260px] -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg group-hover:block">
                {FIELD_LABEL[seg.evidence.field] ?? seg.evidence.field}
                <span className="ml-1.5 text-slate-400">
                  {Math.round(seg.evidence.confidence * 100)}% confidence
                </span>
              </span>
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </p>
    </SectionCard>
  );
}
