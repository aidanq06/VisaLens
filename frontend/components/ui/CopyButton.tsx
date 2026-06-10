"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copy-to-clipboard button with a brief "Copied" confirmation.
 * Falls back to a hidden-textarea copy if the Clipboard API is
 * unavailable (e.g. non-HTTPS demo environments).
 */
export default function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Legacy fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setState("copied");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 ${className}`}
    >
      {state === "copied" ? (
        <>
          <Check size={13} className="text-emerald-600" />
          <span className="text-emerald-700">Copied</span>
        </>
      ) : state === "error" ? (
        <span className="text-red-600">Copy failed — select manually</span>
      ) : (
        <>
          <Copy size={13} />
          {label}
        </>
      )}
    </button>
  );
}
