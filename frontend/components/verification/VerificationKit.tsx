"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  GraduationCap,
  ListChecks,
  MessageCircleQuestion,
  ShieldAlert,
} from "lucide-react";

import type { PartialVisaLensAnalysis } from "@/types/analysis";
import { generateVerificationKit } from "@/lib/verification/generateVerificationKit";
import CopyButton from "@/components/ui/CopyButton";
import SectionCard from "@/components/ui/SectionCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmailDraftCard from "@/components/verification/EmailDraftCard";

/**
 * The full verification workflow: who to ask, what to ask, what to send,
 * and what to do next. Works from partial data — anything the backend
 * didn't provide is generated from risk categories.
 */
export default function VerificationKit({
  analysis,
}: {
  analysis: PartialVisaLensAnalysis;
}) {
  const kit = useMemo(() => generateVerificationKit(analysis), [analysis]);
  // Interactive checklist state (demo-friendly).
  const [done, setDone] = useState<Set<number>>(new Set());

  function toggleStep(i: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  }

  const questionSections = [
    {
      key: "organizer",
      icon: <MessageCircleQuestion size={16} />,
      title: "Ask the organizer",
      subtitle: "Step 1 — they own the eligibility answer",
      questions: kit.organizerQuestions,
    },
    {
      key: "advisor",
      icon: <GraduationCap size={16} />,
      title: "Ask your advisor or DSO",
      subtitle: "Step 2 — they own the visa/work-authorization answer",
      questions: kit.advisorQuestions,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header row with urgency */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={18} className="text-slate-500" />
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Verification kit
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          Verification urgency:
          <StatusBadge level={kit.urgencyLabel} />
        </div>
      </div>

      {/* Question sections */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {questionSections.map((section) => (
          <SectionCard
            key={section.key}
            icon={section.icon}
            title={section.title}
            subtitle={section.subtitle}
            right={
              <CopyButton
                text={section.questions.map((q) => `- ${q}`).join("\n")}
                label="Copy all"
              />
            }
          >
            {section.questions.length === 0 ? (
              <p className="text-sm text-slate-500">
                No targeted questions generated — analysis pending.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {section.questions.map((q, i) => (
                  <li key={q} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-700">{q}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        ))}
      </div>

      {/* Email draft */}
      <EmailDraftCard analysis={analysis} />

      {/* Interactive next steps */}
      <SectionCard
        icon={<ListChecks size={16} />}
        title="Next steps"
        subtitle="Check items off as you go"
        right={
          <span className="text-xs font-medium text-slate-500">
            {done.size}/{kit.nextSteps.length} done
          </span>
        }
      >
        <ol className="space-y-2">
          {kit.nextSteps.map((step, i) => {
            const checked = done.has(i);
            return (
              <li key={step}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStep(i)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                  />
                  <span
                    className={`text-sm leading-relaxed ${
                      checked ? "text-slate-400 line-through" : "text-slate-700"
                    }`}
                  >
                    {step}
                  </span>
                </label>
              </li>
            );
          })}
        </ol>
      </SectionCard>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-xs leading-relaxed text-amber-800">{kit.disclaimer}</p>
      </div>
    </div>
  );
}
