import { FileSearch, Gauge, GitBranch, ClipboardCheck } from "lucide-react";

import ScannerForm from "@/components/scan/ScannerForm";

/**
 * Landing + scanner. The analysis runs fully client-side
 * (lib/analyze/analyzeOpportunity.ts) and hands off to /results.
 */

const STEPS = [
  {
    icon: <FileSearch size={18} />,
    title: "Extract",
    text: "Hidden requirements are pulled out of the listing with evidence for every field.",
  },
  {
    icon: <Gauge size={18} />,
    title: "Score",
    text: "Deterministic rules score the risk — transparent and explainable, not AI guessing.",
  },
  {
    icon: <GitBranch size={18} />,
    title: "Map blockers",
    text: "A dependency graph shows exactly what stands between you and a safe decision.",
  },
  {
    icon: <ClipboardCheck size={18} />,
    title: "Act",
    text: "Get the questions, email drafts, and deadline plan to verify before you apply.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Hero */}
      <div className="mb-10 text-center">
        <p className="mb-3 inline-block rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          VisaLens AI
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Don&apos;t lose the opportunity
          <br className="hidden sm:block" /> after finding it.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
          Internships, scholarships, and research programs often hide
          eligibility risks in fine print like{" "}
          <em>&ldquo;must be eligible to work in the U.S.&rdquo;</em> VisaLens
          decodes the listing, scores the risk, and tells you exactly what to
          verify before you apply.
        </p>
      </div>

      {/* Scanner */}
      <ScannerForm />

      {/* How it works */}
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="mb-2 flex items-center gap-2 text-brand-600">
              {step.icon}
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Step {i + 1}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-slate-400">
        VisaLens does not provide legal, immigration, financial, or official
        eligibility advice. Always verify with official sources.
      </p>
    </main>
  );
}
