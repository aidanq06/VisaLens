"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getUser, signIn, signOut, signUp } from "@/lib/auth";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#080910",
  border: "1px solid #252838",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "13px",
  color: "#e4e6f0",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#484d66",
  fontFamily: "var(--font-mono)",
  marginBottom: "6px",
  display: "block",
};

export default function ProfileMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"signup" | "signin">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  function openModal() {
    setError(null);
    setSignedUp(false);
    setOpen(true);
  }

  function switchTab(next: "signup" | "signin") {
    setTab(next);
    setError(null);
    setSignedUp(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setUser(data.user);
    setOpen(false);
    router.push("/dashboard");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSignedUp(true);
  }

  async function handleSignOut() {
    setLoading(true);
    await signOut();
    setLoading(false);
    setUser(null);
    setOpen(false);
  }

  return (
    <>
      {/* Profile icon */}
      <button
        onClick={openModal}
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
          flexShrink: 0,
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

      {/* Modal overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "380px",
              background: "#0f1018",
              border: "1px solid #252838",
              borderRadius: "16px",
              padding: "28px",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                color: "#7a7f99",
                fontSize: "16px",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ✕
            </button>

            {user ? (
              /* Logged-in view */
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#484d66",
                    fontFamily: "var(--font-mono)",
                    marginBottom: "8px",
                  }}
                >
                  Signed in as
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#e4e6f0",
                    marginBottom: "24px",
                    wordBreak: "break-all",
                  }}
                >
                  {user.email}
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/dashboard");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    background: "#f5a623",
                    color: "#080910",
                    border: "none",
                    cursor: "pointer",
                    marginBottom: "10px",
                  }}
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: "#7a7f99",
                    background: "#161823",
                    border: "1px solid #252838",
                    cursor: loading ? "wait" : "pointer",
                  }}
                >
                  {loading ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            ) : (
              /* Auth view */
              <div>
                {/* Tabs */}
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    marginBottom: "24px",
                    background: "#080910",
                    border: "1px solid #252838",
                    borderRadius: "10px",
                    padding: "4px",
                  }}
                >
                  {(
                    [
                      { key: "signup", label: "Create Account" },
                      { key: "signin", label: "Sign In" },
                    ] as const
                  ).map(({ key, label }) => {
                    const active = tab === key;
                    return (
                      <button
                        key={key}
                        onClick={() => switchTab(key)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "7px",
                          fontSize: "12px",
                          fontWeight: active ? "600" : "400",
                          color: active ? "#f5a623" : "#7a7f99",
                          background: active
                            ? "rgba(245,166,35,0.1)"
                            : "transparent",
                          border: `1px solid ${
                            active ? "rgba(245,166,35,0.3)" : "transparent"
                          }`,
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {tab === "signin" ? (
                  <form onSubmit={handleSignIn}>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={labelStyle}>Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                      <label style={labelStyle}>Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "600",
                        background: loading ? "#1e2130" : "#f5a623",
                        color: loading ? "#484d66" : "#080910",
                        border: "none",
                        cursor: loading ? "wait" : "pointer",
                      }}
                    >
                      {loading ? "Signing in…" : "Sign In"}
                    </button>
                  </form>
                ) : signedUp ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <p style={{ fontSize: "20px", marginBottom: "12px" }}>✉️</p>
                    <p style={{ fontSize: "14px", color: "#e4e6f0" }}>
                      Check your email to confirm your account
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp}>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={labelStyle}>Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={labelStyle}>Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                      <label style={labelStyle}>Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "600",
                        background: loading ? "#1e2130" : "#f5a623",
                        color: loading ? "#484d66" : "#080910",
                        border: "none",
                        cursor: loading ? "wait" : "pointer",
                      }}
                    >
                      {loading ? "Creating account…" : "Create Account"}
                    </button>
                  </form>
                )}

                {error && (
                  <p
                    style={{
                      marginTop: "14px",
                      fontSize: "12px",
                      color: "#ef9a9a",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "rgba(239,67,67,0.06)",
                      border: "1px solid rgba(239,67,67,0.25)",
                    }}
                  >
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
