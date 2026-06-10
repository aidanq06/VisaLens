"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ScanLine, Sparkles } from "lucide-react";

import {
  analyzeOpportunity,
  storeAnalysis,
} from "@/lib/analyze/analyzeOpportunity";
import type { StudentStatus } from "@/lib/analyze/riskScoring";
import { sampleOpportunities } from "@/data/sampleOpportunities";

const STATUS_OPTIONS: { id: StudentStatus; label: string }[] = [
  { id: "f1", label: "F-1 international" },
  { id: "j1", label: "J-1 international" },
  { id: "international_other", label: "Other international" },
  { id: "domestic", label: "Domestic" },
  { id: "unsure", label: "Not sure" },
];

const TYPE_OPTIONS = [
  "internship",
  "research",
  "scholarship",
  "hackathon",
  "fellowship",
  "other",
];

/**
 * The scanner: student context + pasted opportunity text -> full
 * client-side analysis -> /results. Sample buttons make the demo
 * one click away from each headline scenario.
 */
export default function ScannerForm() {
  const router = useRouter();
  const [status, setStatus] = useState<StudentStatus>("f1");
  const [oppType, setOppType] = useState("internship");
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadSample(id: string) {
    const sample = sampleOpportunities.find((s) => s.id === id);
    if (!sample) return;
    setText(sample.text);
    setOppType(sample.category);
    setError(null);
  }

  async function handleAnalyze() {
    if (text.trim().length < 40) {
      setError("Paste the full opportunity description (at least a few sentences) so the analysis has something to work with.");
      return;
    }
    setError(null);
    setAnalyzing(true);
    // Brief pause so the pipeline stages are visible in the UI.
    await new Promise((r) => setTimeout(r, 650));
    try {
      const analysis = analyzeOpportunity({
        text,
        studentStatus: status,
        opportunityType: oppType,
      });
      storeAnalysis({
        analysis,
        originalText: text,
        studentStatus: status,
        analyzedAt: new Date().toISOString(),
      });
      router.push("/results");
    } catch {
      setAnalyzing(false);
      setError("Something went wrong while analyzing. Please try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Student status */}
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Your status
      </label>
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setStatus(opt.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              status === opt.id
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Opportunity type */}
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Opportunity type
      </label>
      <div className="mb-5 flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setOppType(t)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition ${
              oppType === t
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Opportunity text */}
      <label
        htmlFor="opportunity-text"
        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        Opportunity description
      </label>
      <textarea
        id="opportunity-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={9}
        placeholder="Paste the full internship, scholarship, hackathon, fellowship, or research listing here…"
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
      />

      {/* Samples */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Sparkles size={12} /> Try a sample:
        </span>
        {sampleOpportunities.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => loadSample(s.id)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            {s.title}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
      )}

      {/* Analyze */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={analyzing}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-70 sm:w-auto"
      >
        {analyzing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Extracting requirements, scoring risk…
          </>
        ) : (
          <>
            <ScanLine size={16} />
            Analyze eligibility risk
          </>
        )}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        VisaLens highlights what may need verification. It does not provide
        legal or immigration advice.
      </p>
    </div>
  );
}
