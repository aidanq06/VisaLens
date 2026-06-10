"use client";

import { useMemo, useState } from "react";
import { Mail } from "lucide-react";

import type { PartialVisaLensAnalysis } from "@/types/analysis";
import { generateVerificationKit } from "@/lib/verification/generateVerificationKit";
import CopyButton from "@/components/ui/CopyButton";
import SectionCard from "@/components/ui/SectionCard";

type Recipient = "organizer" | "advisor";

/**
 * Email draft with organizer/advisor tabs, generated subject line, and
 * copy actions for subject, body, or the full email.
 */
export default function EmailDraftCard({
  analysis,
}: {
  analysis: PartialVisaLensAnalysis;
}) {
  const [recipient, setRecipient] = useState<Recipient>("organizer");
  const kit = useMemo(() => generateVerificationKit(analysis), [analysis]);

  const subject =
    recipient === "organizer" ? kit.organizerSubject : kit.advisorSubject;
  const body = recipient === "organizer" ? kit.emailDraft : kit.advisorEmailDraft;
  const fullEmail = `Subject: ${subject}\n\n${body}`;

  const tabs: { id: Recipient; label: string }[] = [
    { id: "organizer", label: "To the organizer" },
    { id: "advisor", label: "To your advisor/DSO" },
  ];

  return (
    <SectionCard
      icon={<Mail size={16} />}
      title="Send this email"
      subtitle="A safe, professional draft — edit before sending"
      right={<CopyButton text={fullEmail} label="Copy email" />}
    >
      {/* Recipient tabs */}
      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRecipient(tab.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              recipient === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subject */}
      <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
        <p className="min-w-0 text-sm">
          <span className="font-semibold text-slate-500">Subject: </span>
          <span className="font-medium text-slate-900">{subject}</span>
        </p>
        <CopyButton text={subject} label="Copy" className="shrink-0" />
      </div>

      {/* Body */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3.5">
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {body}
        </p>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Tip: add the opportunity name and link before sending, and keep the
        organizer&apos;s written reply for your records.
      </p>
    </SectionCard>
  );
}
