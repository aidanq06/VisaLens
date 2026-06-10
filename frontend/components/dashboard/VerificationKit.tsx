"use client";

import { useState } from "react";
import type { VisaLensAnalysis } from "@/types/analysis";

type Props = { verification: VisaLensAnalysis["verification"] };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-xs px-3 py-1.5 rounded-lg transition-all"
      style={{
        color: copied ? "#2ecc71" : "#7a7f99",
        background: copied ? "rgba(46,204,113,0.1)" : "#161823",
        border: `1px solid ${copied ? "rgba(46,204,113,0.3)" : "#252838"}`,
        fontFamily: "var(--font-mono)",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

type Tab = "organizer" | "advisor" | "email" | "checklist";

export default function VerificationKit({ verification }: Props) {
  const [tab, setTab] = useState<Tab>("organizer");

  const tabs: { id: Tab; label: string }[] = [
    { id: "organizer", label: "Ask Organizer" },
    { id: "advisor", label: "Ask Advisor" },
    { id: "email", label: "Email Draft" },
    { id: "checklist", label: "Next Steps" },
  ];

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "#0f1018", borderColor: "#252838" }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#1a1d2a" }}>
        <p
          className="text-[11px] uppercase tracking-widest mb-0.5"
          style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
        >
          Verification Kit
        </p>
        <h3 className="text-sm font-medium" style={{ color: "#e4e6f0" }}>
          Exactly what to do next
        </h3>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b overflow-x-auto"
        style={{ borderColor: "#1a1d2a" }}
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-5 py-3 text-xs whitespace-nowrap transition-colors flex-shrink-0"
            style={{
              color: tab === id ? "#f5a623" : "#7a7f99",
              borderBottom: tab === id ? "2px solid #f5a623" : "2px solid transparent",
              background: "transparent",
              fontFamily: "var(--font-mono)",
              fontWeight: tab === id ? "500" : "400",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === "organizer" && (
          <div>
            <p className="text-xs mb-4" style={{ color: "#7a7f99" }}>
              Send these questions directly to the opportunity organizer or program coordinator.
            </p>
            <ol className="space-y-3">
              {verification.organizer_questions.map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono mt-0.5"
                    style={{ background: "rgba(245,166,35,0.12)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.25)" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: "#e4e6f0" }}>
                    {q}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {tab === "advisor" && (
          <div>
            <p className="text-xs mb-4" style={{ color: "#7a7f99" }}>
              Bring these to your school&apos;s international student office or DSO/advisor.
            </p>
            <ol className="space-y-3">
              {verification.advisor_questions.map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono mt-0.5"
                    style={{ background: "rgba(46,204,113,0.10)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.22)" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: "#e4e6f0" }}>
                    {q}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {tab === "email" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs" style={{ color: "#7a7f99" }}>
                Ready-to-send email for the organizer. Customize with your name.
              </p>
              <CopyButton text={verification.email_draft} />
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: "#080910", border: "1px solid #1e2130" }}
            >
              <pre
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: "#e4e6f0", fontFamily: "var(--font-mono)", fontSize: "12px" }}
              >
                {verification.email_draft}
              </pre>
            </div>
          </div>
        )}

        {tab === "checklist" && (
          <div>
            <p className="text-xs mb-4" style={{ color: "#7a7f99" }}>
              Complete these steps before applying or accepting.
            </p>
            <ol className="space-y-3">
              {verification.next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono mt-0.5"
                    style={{ background: "#161823", color: "#7a7f99", border: "1px solid #252838" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: "#e4e6f0" }}>
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div
        className="px-6 pb-5 border-t pt-4"
        style={{ borderColor: "#1a1d2a", background: "#080910" }}
      >
        <p className="text-[10px] leading-relaxed" style={{ color: "#484d66" }}>
          ⚖ {verification.disclaimer}
        </p>
      </div>
    </div>
  );
}
