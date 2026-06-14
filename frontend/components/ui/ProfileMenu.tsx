"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getUser, signOut } from "@/lib/auth";

const itemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "9px 12px",
  borderRadius: "7px",
  fontSize: "12px",
  color: "#e4e6f0",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  textDecoration: "none",
  fontFamily: "var(--font-mono)",
};

export default function ProfileMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  function handleIconClick() {
    if (!user) {
      router.push("/auth");
      return;
    }
    setOpen((o) => !o);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setUser(null);
    setOpen(false);
    router.push("/");
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Profile icon */}
      <button
        onClick={handleIconClick}
        aria-label="Account"
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: user ? "rgba(245,166,35,0.12)" : "#0f1018",
          border: `1px solid ${user ? "rgba(245,166,35,0.35)" : "#252838"}`,
          cursor: "pointer",
        }}
      >
        {user ? (
          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#f5a623",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
            }}
          >
            {user.email?.charAt(0) ?? "?"}
          </span>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7a7f99"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20 C4 16 8 13 12 13 C16 13 20 16 20 20" />
          </svg>
        )}
      </button>

      {/* Dropdown (logged-in only) */}
      {open && user && (
        <>
          {/* Click-away catcher */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 90 }}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              zIndex: 95,
              minWidth: "160px",
              padding: "6px",
              background: "#0f1018",
              border: "1px solid #252838",
              borderRadius: "10px",
            }}
          >
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              style={itemStyle}
            >
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                ...itemStyle,
                color: "#7a7f99",
                cursor: signingOut ? "wait" : "pointer",
              }}
            >
              {signingOut ? "Signing out…" : "Sign Out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
