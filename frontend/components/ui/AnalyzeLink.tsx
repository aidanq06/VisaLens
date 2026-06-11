"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUser } from "@/lib/auth";

/** Landing nav CTA: sends logged-in users to /scan, everyone else to sign-up. */
export default function AnalyzeLink() {
  const [href, setHref] = useState("/auth?mode=signup");

  useEffect(() => {
    getUser().then((user) => {
      if (user) setHref("/scan");
    });
  }, []);

  return (
    <Link
      href={href}
      style={{
        fontSize: "12px",
        padding: "8px 16px",
        borderRadius: "10px",
        background: "#f5a623",
        color: "#080910",
        fontWeight: "600",
        textDecoration: "none",
      }}
    >
      Analyze →
    </Link>
  );
}
