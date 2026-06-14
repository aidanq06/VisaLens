"use client";

import { useState } from "react";
import type { VisaLensAnalysis } from "@/types/analysis";

type Props = { verification: VisaLensAnalysis["verification"] };

const labelMicro: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#AAA398",
};

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
      className={copied ? undefined : "vk-copy"}
      style={{
        marginTop: "16px",
        fontSize: "13px",
        padding: "8px 20px",
        borderRadius: "8px",
        cursor: "pointer",
        color: copied ? "#1D9A57" : "#6F6A60",
        background: copied ? "#E6F7ED" : "#FFFDF8",
        border: `1px solid ${copied ? "#A8DFC0" : "#E8DFCF"}`,
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

type Tab = "organizer" | "advisor" | "email" | "checklist";

/* Split a raw email draft into subject + body when a "Subject:" line leads. */
function parseEmail(raw: string): { subject: string; body: string } {
  const match = raw.match(/^\s*subject:\s*(.+)\n([\s\S]*)$/i);
  if (match) return { subject: match[1].trim(), body: match[2].trim() };
  return { subject: "", body: raw.trim() };
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <div>
      {items.map((q, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "12px",
            padding: "12px 0",
            borderBottom: "1px solid #F3EFE6",
          }}
        >
          <span
            style={{
              flexShrink: 0,
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "#F5A91D",
              color: "#11100D",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {i + 1}
          </span>
          <p style={{ fontSize: "13px", color: "#11100D", margin: 0, lineHeight: 1.5 }}>{q}</p>
        </div>
      ))}
    </div>
  );
}

export default function VerificationKit({ verification }: Props) {
  const [tab, setTab] = useState<Tab>("organizer");
  const [hover, setHover] = useState<Tab | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "organizer", label: "Ask Organizer" },
    { id: "advisor", label: "Ask Advisor" },
    { id: "email", label: "Email Draft" },
    { id: "checklist", label: "Next Steps" },
  ];

  const email = parseEmail(verification.email_draft);

  return (
    <div
      style={{
        background: "#FFFDF8",
        border: "1px solid #E8DFCF",
        borderRadius: "14px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "24px 28px", borderBottom: "1px solid #E8DFCF" }}>
        <p style={{ ...labelMicro, margin: 0 }}>VERIFICATION KIT</p>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#11100D", margin: "4px 0 0" }}>
          Exactly what to do next
        </h3>
      </div>

      {/* Tabs */}
      <div
        style={{
          padding: "0 28px",
          borderBottom: "1px solid #E8DFCF",
          display: "flex",
          overflowX: "auto",
        }}
      >
        {tabs.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => setHover(null)}
              style={{
                padding: "14px 20px",
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${active ? "#F5A91D" : "transparent"}`,
                marginBottom: "-1px",
                transition: "color 0.15s, border-color 0.15s",
                fontWeight: active ? 600 : 400,
                color: active ? "#11100D" : hover === id ? "#6F6A60" : "#AAA398",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px", flex: 1 }}>
        {tab === "organizer" && (
          <div>
            <p style={{ fontSize: "13px", color: "#6F6A60", marginBottom: "20px", lineHeight: 1.55 }}>
              Send these questions directly to the opportunity organizer or program coordinator.
            </p>
            <NumberedList items={verification.organizer_questions} />
          </div>
        )}

        {tab === "advisor" && (
          <div>
            <p style={{ fontSize: "13px", color: "#6F6A60", marginBottom: "20px", lineHeight: 1.55 }}>
              Bring these to your school&apos;s international student office or DSO/advisor.
            </p>
            <NumberedList items={verification.advisor_questions} />
          </div>
        )}

        {tab === "email" && (
          <div>
            <div
              style={{
                background: "#FBF8F1",
                border: "1px solid #E8DFCF",
                borderRadius: "10px",
                padding: "20px",
              }}
            >
              {email.subject && (
                <>
                  <p style={{ ...labelMicro, margin: "0 0 6px" }}>SUBJECT</p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#11100D", margin: "0 0 16px" }}>
                    {email.subject}
                  </p>
                  <div style={{ borderTop: "1px solid #E8DFCF", marginBottom: "16px" }} />
                </>
              )}
              <p style={{ fontSize: "13px", color: "#11100D", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                {email.body}
              </p>
            </div>
            <CopyButton text={verification.email_draft} />
          </div>
        )}

        {tab === "checklist" && (
          <div>
            {verification.next_steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px 0",
                  borderBottom: "1px solid #F3EFE6",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid #E8DFCF",
                    background: "#FFFFFF",
                    marginTop: "2px",
                  }}
                />
                <p style={{ fontSize: "13px", color: "#11100D", margin: 0, lineHeight: 1.5 }}>{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "0 28px 24px" }}>
        <p
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #E8DFCF",
            fontSize: "11px",
            color: "#AAA398",
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          {verification.disclaimer}
        </p>
      </div>

      <style jsx>{`
        .vk-copy:hover {
          border-color: #d8c7a8 !important;
        }
      `}</style>
    </div>
  );
}
