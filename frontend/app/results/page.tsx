"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ResultsDashboard from "@/components/dashboard/ResultsDashboard";
import HighlightedListing from "@/components/scan/HighlightedListing";
import {
  loadStoredAnalysis,
  type StoredAnalysis,
} from "@/lib/analyze/analyzeOpportunity";
import { mockAnalysis } from "@/data/mockAnalysis";
import { sampleOpportunities } from "@/data/sampleOpportunities";

/**
 * Results page. Reads the analysis handed off by the scanner; falls back
 * to the canonical demo analysis if the user navigated here directly.
 */
export default function ResultsPage() {
  const [stored, setStored] = useState<StoredAnalysis | null | undefined>(
    undefined // undefined = loading, null = nothing stored
  );

  useEffect(() => {
    setStored(loadStoredAnalysis());
  }, []);

  // Avoid hydration mismatch: render nothing until sessionStorage is read.
  if (stored === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">
        Loading analysis…
      </div>
    );
  }

  const analysis = stored?.analysis ?? mockAnalysis;
  const originalText = stored?.originalText ?? sampleOpportunities[0].text;
  const isDemo = !stored;

  return (
    <main>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={15} />
            Analyze another opportunity
          </Link>
          {isDemo && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              Demo data — paste a listing on the home page for a live analysis
            </span>
          )}
        </div>

        {/* Original listing with detected signals highlighted */}
        <div className="mt-5">
          <HighlightedListing
            text={originalText}
            evidence={analysis.extracted?.evidence ?? []}
          />
        </div>
      </div>

      <ResultsDashboard analysis={analysis} />
    </main>
  );
}
